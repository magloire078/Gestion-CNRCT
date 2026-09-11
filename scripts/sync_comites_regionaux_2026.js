const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("serviceAccountKey.json introuvable !");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

function normalize(str) {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function cleanVillageName(villageTitle) {
    if (!villageTitle) return '';
    return villageTitle
        .replace(/Chef du village de |Chef de village de |Chef de Canton\/ |Chef Canton |Chef du canton de |Chef de village \/|Chef de tribu |Chef de village|Chef du Village |Chef du Canton |Cheffe de tribu |Roi des |Roi de |Roi |Chef de Province/gi, '')
        .trim();
}

async function runSync() {
    console.log("=== SYNCHRONISATION DES MEMBRES DES COMITÉS RÉGIONAUX ACTIFS 2026 ===");
    
    // 1. Lire les membres fournis par l'utilisateur
    const membersPath = path.join(process.cwd(), 'data', 'comites_regionaux_actifs_2026.json');
    const targetMembers = JSON.parse(fs.readFileSync(membersPath, 'utf8'));
    console.log(`Nombre de membres dans la liste fournie : ${targetMembers.length}`);

    try {
        // 2. Charger les collections Firestore
        console.log("\nChargement des chefs et employés depuis Firestore...");
        const chiefsSnap = await db.collection('chiefs').get();
        const allChiefs = chiefsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const employeesSnap = await db.collection('employees').get();
        const allEmployees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`- Chefs existants : ${allChiefs.length}`);
        console.log(`- Employés existants : ${allEmployees.length}`);

        let reconnectedCount = 0;
        let activatedCount = 0;
        let createdChiefsCount = 0;
        let createdEmployeesCount = 0;
        let updatedCount = 0;

        for (const target of targetMembers) {
            const normLast = normalize(target.lastName);
            const normFirst = normalize(target.firstName);
            const normFull = normalize(`${target.lastName} ${target.firstName}`);
            const normReverseFull = normalize(`${target.firstName} ${target.lastName}`);
            const normDept = normalize(target.department);
            const normRegion = normalize(target.region);
            const cleanVillage = cleanVillageName(target.role);
            const isReconduit = (target.profile || '').toLowerCase().includes('reconduit');

            // --- RECHERCHE CHEF ---
            let matchedChief = allChiefs.find(c => {
                const cDept = normalize(c.department || c.Departement);
                const cLast = normalize(c.lastName);
                const cFirst = normalize(c.firstName);
                const cFull = normalize(c.name || `${c.lastName} ${c.firstName}`);
                
                const nameMatch = cFull === normFull || cFull === normReverseFull || (cLast === normLast && cFirst === normFirst);
                return nameMatch;
            });

            // Si pas trouvé par nom exact, chercher par combinaison département + nom de famille ou village
            if (!matchedChief && normDept) {
                matchedChief = allChiefs.find(c => {
                    const cDept = normalize(c.department || c.Departement);
                    const cLast = normalize(c.lastName);
                    const cVillage = normalize(c.village || c.Village);
                    return cDept === normDept && (cLast === normLast || (cleanVillage && cVillage === normalize(cleanVillage)));
                });
            }

            let chiefId = null;

            if (matchedChief) {
                chiefId = matchedChief.id;
                const needsActivation = matchedChief.cnrctAffiliation !== 'Comité Régional' || matchedChief.statut !== 'Vivant';
                
                const updatePayload = {
                    region: target.region,
                    department: target.department,
                    village: cleanVillage || matchedChief.village || '',
                    contact: target.contact || matchedChief.contact || '',
                    title: target.role || matchedChief.title || '',
                    cnrctAffiliation: 'Comité Régional',
                    statut: 'Vivant',
                    estRenouvele: isReconduit,
                    mandatDebut: '2026-06-01'
                };

                await db.collection('chiefs').doc(chiefId).update(updatePayload);

                if (needsActivation) {
                    activatedCount++;
                    console.log(`[CHEF ACTIVÉ] ${target.num}. ${target.lastName} ${target.firstName} (${target.region} / ${target.department})`);
                } else {
                    updatedCount++;
                }
            } else {
                // Créer le chef manquant
                const newChief = {
                    name: `${target.lastName} ${target.firstName}`.trim(),
                    lastName: target.lastName,
                    firstName: target.firstName,
                    title: target.role,
                    role: target.role.toLowerCase().includes('canton') ? 'Chef de canton' : (target.role.toLowerCase().includes('roi') ? 'Roi' : (target.role.toLowerCase().includes('tribu') ? 'Chef de tribu' : 'Chef de Village')),
                    region: target.region,
                    department: target.department,
                    village: cleanVillage,
                    contact: target.contact,
                    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(target.lastName + ' ' + target.firstName)}&background=006039&color=fff&size=100`,
                    source: 'Import Comité Régional Actif 2026',
                    statut: 'Vivant',
                    cnrctAffiliation: 'Comité Régional',
                    estRenouvele: isReconduit,
                    mandatDebut: '2026-06-01',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                const docRef = await db.collection('chiefs').add(newChief);
                chiefId = docRef.id;
                createdChiefsCount++;
                console.log(`[CHEF CRÉÉ] ${target.num}. ${target.lastName} ${target.firstName} (${target.region} / ${target.department})`);
            }

            // --- RECHERCHE EMPLOYÉ ---
            let matchedEmp = allEmployees.find(e => {
                const eLast = normalize(e.lastName);
                const eFirst = normalize(e.firstName);
                const eFull = normalize(e.name || `${e.lastName} ${e.firstName}`);
                return eFull === normFull || eFull === normReverseFull || (eLast === normLast && eFirst === normFirst) || (chiefId && e.chiefId === chiefId);
            });

            if (matchedEmp) {
                await db.collection('employees').doc(matchedEmp.id).update({
                    status: 'Actif',
                    bActif: true,
                    poste: 'Membre Comité Régional',
                    Region: target.region,
                    Departement: target.department,
                    Village: cleanVillage || matchedEmp.Village || '',
                    mobile: target.contact || matchedEmp.mobile || '',
                    chiefId: chiefId,
                    groupe_2: 'Rois & Chefs'
                });
            } else {
                // Créer l'employé correspondant
                const matricule = `CR-${String(target.num).padStart(4, '0')}`;
                const newEmp = {
                    matricule: matricule,
                    name: `${target.lastName} ${target.firstName}`.trim(),
                    lastName: target.lastName,
                    firstName: target.firstName,
                    poste: 'Membre Comité Régional',
                    status: 'Actif',
                    bActif: true,
                    Region: target.region,
                    Departement: target.department,
                    Village: cleanVillage,
                    mobile: target.contact,
                    groupe_2: 'Rois & Chefs',
                    chiefId: chiefId,
                    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(target.lastName + ' ' + target.firstName)}&background=006039&color=fff&size=100`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('employees').add(newEmp);
                createdEmployeesCount++;
                console.log(`[EMPLOYÉ CRÉÉ] ${matricule} - ${target.lastName} ${target.firstName}`);
            }
        }

        console.log("\n=== BILAN DE L'OPÉRATION ===");
        console.log(`Total membres traités : ${targetMembers.length}`);
        console.log(`Chefs activés / mis à jour : ${activatedCount + updatedCount}`);
        console.log(`Nouveaux chefs créés : ${createdChiefsCount}`);
        console.log(`Nouveaux employés créés : ${createdEmployeesCount}`);
        console.log("Opération terminée avec succès !");

    } catch (error) {
        console.error("Erreur lors de la synchronisation :", error);
    }
}

runSync();
