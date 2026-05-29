/**
 * Scan & déduplique les collections `villages` et `chiefs`.
 *
 * Usage :
 *   npx tsx scripts/scan-duplicates.ts                        # Dry-run sur les deux
 *   npx tsx scripts/scan-duplicates.ts --target=villages      # Dry-run villages uniquement
 *   npx tsx scripts/scan-duplicates.ts --target=chiefs        # Dry-run chiefs uniquement
 *   npx tsx scripts/scan-duplicates.ts --apply                # SUPPRIME réellement les doublons
 *   npx tsx scripts/scan-duplicates.ts --apply --target=chiefs
 *
 * Critères de doublon :
 *   - Village  : même tuple (région, département, sous-préfecture, nom normalisé)
 *   - Chief    : même tuple (nom normalisé, rôle, région, département, sous-préfecture, village)
 *
 * Choix du document canonique à conserver :
 *   - Le document avec le plus grand nombre de champs non-vides remporte
 *   - En cas d'égalité, le plus ancien (audit.createdAt) ou par défaut, le premier renvoyé par Firestore
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ serviceAccountKey.json introuvable à la racine du projet.');
    console.error('   Téléchargez-le depuis Firebase Console → Paramètres → Comptes de service.');
    process.exit(1);
}
const raw = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8').trim();
if (raw.startsWith('#') || !raw.startsWith('{')) {
    console.error('❌ serviceAccountKey.json semble être un placeholder (commence par # ou non-JSON).');
    process.exit(1);
}
const serviceAccount = JSON.parse(raw);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});
const db = admin.firestore();

// ---- CLI ARGS ----
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const targetArg = args.find(a => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'all';
const DO_VILLAGES = target === 'all' || target === 'villages';
const DO_CHIEFS = target === 'all' || target === 'chiefs';

// ---- HELPERS ----
function normalize(s: any): string {
    if (s === null || s === undefined) return '';
    return String(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function countFilledFields(doc: Record<string, any>): number {
    let n = 0;
    for (const k of Object.keys(doc)) {
        const v = doc[k];
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
        n += 1;
    }
    return n;
}

function pickCanonical<T extends { id: string; _data: Record<string, any> }>(group: T[]): T {
    return group.slice().sort((a, b) => {
        const fa = countFilledFields(a._data);
        const fb = countFilledFields(b._data);
        if (fb !== fa) return fb - fa; // most filled first
        // tiebreak: oldest createdAt
        const ca = a._data?.audit?.createdAt || '';
        const cb = b._data?.audit?.createdAt || '';
        if (ca && cb) return ca.localeCompare(cb);
        return a.id.localeCompare(b.id);
    })[0];
}

type GroupReport = {
    key: string;
    label: string;
    keep: { id: string; filled: number };
    drop: { id: string; filled: number }[];
};

async function scanCollection(
    name: string,
    keyFn: (data: Record<string, any>) => { key: string; label: string } | null,
): Promise<GroupReport[]> {
    console.log(`\n📂 Scan de la collection « ${name} »…`);
    const snap = await db.collection(name).get();
    console.log(`   ${snap.size} document(s) lus.`);

    const buckets = new Map<string, { id: string; _data: Record<string, any>; label: string }[]>();
    snap.docs.forEach(doc => {
        const data = doc.data();
        const k = keyFn(data);
        if (!k) return;
        const arr = buckets.get(k.key) || [];
        arr.push({ id: doc.id, _data: data, label: k.label });
        buckets.set(k.key, arr);
    });

    const dups: GroupReport[] = [];
    buckets.forEach((items, key) => {
        if (items.length < 2) return;
        const canon = pickCanonical(items);
        const drops = items.filter(it => it.id !== canon.id);
        dups.push({
            key,
            label: canon.label,
            keep: { id: canon.id, filled: countFilledFields(canon._data) },
            drop: drops.map(d => ({ id: d.id, filled: countFilledFields(d._data) })),
        });
    });

    return dups.sort((a, b) => b.drop.length - a.drop.length);
}

function printReport(title: string, dups: GroupReport[]) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  ${title.toUpperCase()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (dups.length === 0) {
        console.log('  ✅ Aucun doublon détecté.');
        return;
    }
    let totalDrops = 0;
    dups.forEach((g, i) => {
        console.log(`\n  Groupe ${i + 1}: "${g.label}"`);
        console.log(`    ✅ CONSERVÉ  id=${g.keep.id} (${g.keep.filled} champs remplis)`);
        g.drop.forEach(d => {
            console.log(`    ❌ DOUBLON   id=${d.id} (${d.filled} champs remplis)`);
            totalDrops += 1;
        });
    });
    console.log(`\n  📊 Total à supprimer : ${totalDrops} document(s) dans ${dups.length} groupe(s).`);
}

async function applyDeletions(collection: string, dups: GroupReport[]) {
    if (dups.length === 0) return 0;
    const ids: string[] = [];
    dups.forEach(g => g.drop.forEach(d => ids.push(d.id)));
    console.log(`\n  🗑️  Suppression de ${ids.length} document(s) de « ${collection} »…`);
    // Batch in chunks of 400
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 400) {
        const chunk = ids.slice(i, i + 400);
        const batch = db.batch();
        chunk.forEach(id => batch.delete(db.collection(collection).doc(id)));
        await batch.commit();
        deleted += chunk.length;
        console.log(`     … ${deleted}/${ids.length}`);
    }
    return deleted;
}

// ---- MAIN ----
async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SCAN DES DOUBLONS — Villages & Chefs');
    console.log(`  Mode : ${APPLY ? '⚠️  APPLY (suppression réelle)' : '🔍 DRY-RUN (aucune écriture)'}`);
    console.log(`  Cible : ${target}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const summary: Record<string, { found: number; deleted: number }> = {};

    if (DO_VILLAGES) {
        const dups = await scanCollection('villages', (d) => {
            const r = normalize(d.region);
            const dep = normalize(d.department);
            const sp = normalize(d.subPrefecture);
            const n = normalize(d.name);
            if (!n) return null;
            return {
                key: `${r}|${dep}|${sp}|${n}`,
                label: `${d.name} — ${d.region || '?'} / ${d.department || '?'} / ${d.subPrefecture || '?'}`,
            };
        });
        printReport('Doublons VILLAGES', dups);
        const total = dups.reduce((s, g) => s + g.drop.length, 0);
        summary.villages = { found: total, deleted: 0 };
        if (APPLY && total > 0) {
            summary.villages.deleted = await applyDeletions('villages', dups);
        }
    }

    if (DO_CHIEFS) {
        const dups = await scanCollection('chiefs', (d) => {
            const n = normalize(d.name || `${d.firstName || ''} ${d.lastName || ''}`);
            const role = normalize(d.role);
            const r = normalize(d.region);
            const dep = normalize(d.department);
            const sp = normalize(d.subPrefecture);
            const v = normalize(d.village);
            if (!n) return null;
            return {
                key: `${n}|${role}|${r}|${dep}|${sp}|${v}`,
                label: `${d.name || d.lastName || '(sans nom)'} — ${d.role || '?'} de ${d.village || '?'} (${d.region || '?'})`,
            };
        });
        printReport('Doublons CHEFS', dups);
        const total = dups.reduce((s, g) => s + g.drop.length, 0);
        summary.chiefs = { found: total, deleted: 0 };
        if (APPLY && total > 0) {
            summary.chiefs.deleted = await applyDeletions('chiefs', dups);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  RÉSUMÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(summary).forEach(([col, s]) => {
        const action = APPLY ? `${s.deleted} supprimé(s)` : `${s.found} à supprimer`;
        console.log(`  • ${col.padEnd(10)} : ${action}`);
    });
    if (!APPLY) {
        console.log('\n  ℹ️  Pour appliquer la suppression, relancez avec --apply');
        console.log('     Exemple : npx tsx scripts/scan-duplicates.ts --apply');
    }
    console.log('');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Erreur fatale :', err);
    process.exit(1);
});
