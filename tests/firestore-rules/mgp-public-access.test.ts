/**
 * Le suivi citoyen public (/mgp/track) passe par la route serveur
 * /api/mgp/track, qui filtre les champs et s'appuie sur l'Admin SDK.
 *
 * Tout ce dispositif ne tient que si /conflicts reste fermé en lecture
 * directe : ouvrir cette collection exposerait d'un coup la description des
 * litiges, l'identité des parties, la localisation et les notes internes —
 * champs que la page publique était d'ailleurs écrite pour afficher.
 *
 * Nécessite l'émulateur Firestore sur 127.0.0.1:8080 (voir npm run test:rules).
 */
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { seed, setupEnv } from './helpers';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await setupEnv('mgp');
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    users: {
      agent: { roleId: 'mediateur' },
      passant: { roleId: 'lecteur-sans-droit' },
    },
    roles: {
      mediateur: { resourcePermissions: { conflicts: { read: true } } },
      'lecteur-sans-droit': { resourcePermissions: {} },
    },
    conflicts: {
      dossier1: {
        trackingId: 'CNRCT-2026-K9X4M2',
        status: 'En médiation',
        type: 'Foncier',
        village: 'Yamoussoukro',
        parties: 'Famille A contre Famille B',
        description: 'Litige de limite parcellaire',
        comments: [{ date: '2026-01-10', author: 'Médiateur', content: 'Note interne' }],
      },
    },
  });
});

describe('Accès public aux dossiers de médiation', () => {
  test("un visiteur anonyme ne peut pas lire un dossier par son identifiant", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'conflicts/dossier1')));
  });

  test("un visiteur anonyme ne peut pas énumérer les dossiers par numéro de suivi", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(
      getDocs(query(collection(db, 'conflicts'), where('trackingId', '==', 'CNRCT-2026-K9X4M2'))),
    );
  });

  test("un visiteur anonyme ne peut pas lister toute la collection", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, 'conflicts')));
  });

  test("un utilisateur connecté sans droit sur les conflits ne peut pas lire un dossier", async () => {
    const db = env.authenticatedContext('passant').firestore();
    await assertFails(getDoc(doc(db, 'conflicts/dossier1')));
  });

  test("un agent habilité peut lire le dossier", async () => {
    const db = env.authenticatedContext('agent').firestore();
    await assertSucceeds(getDoc(doc(db, 'conflicts/dossier1')));
  });
});
