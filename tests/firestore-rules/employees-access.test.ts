/**
 * La règle de lecture de /employees comporte une troisième clause qui n'est
 * PAS protégée par isSignedIn() :
 *
 *   (resource.data.status == 'Actif' && (
 *      resource.data.departmentId == '9ywKFDgVMS86rZLPYhpm' ||
 *      resource.data.poste in ['Président', 'Secrétaire Général', 'Membre du Directoire']
 *   ))
 *
 * Or une fiche agent porte le salaire, le RIB complet (banque, numéro de
 * compte, code banque, code guichet, clé) et les données personnelles. Ces
 * tests vérifient qu'un visiteur anonyme ne peut pas les atteindre.
 *
 * Nécessite l'émulateur Firestore sur 127.0.0.1:8080 (voir npm run test:rules).
 */
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { seed, setupEnv } from './helpers';

const DIRECTOIRE_DEPT_ID = '9ywKFDgVMS86rZLPYhpm';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await setupEnv('employees');
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    users: {
      rh: { roleId: 'gestionnaire-rh' },
      agent: { roleId: 'agent-simple', employeeId: 'emp-agent' },
    },
    roles: {
      'gestionnaire-rh': { resourcePermissions: { employees: { read: true } } },
      'agent-simple': { resourcePermissions: {} },
    },
    employees: {
      'emp-president': {
        name: 'Nanan Kouassi',
        poste: 'Président',
        status: 'Actif',
        departmentId: DIRECTOIRE_DEPT_ID,
        baseSalary: 2500000,
        Salaire_Net: 2100000,
        banque: 'SGBCI',
        numeroCompte: '00123456789',
        CB: '01001',
        CG: '00042',
        Cle_RIB: '17',
        mobile: '+225 07 00 00 00',
        Date_Naissance: '1962-04-11',
      },
      'emp-agent': {
        name: 'Agent Ordinaire',
        poste: 'Chauffeur',
        status: 'Actif',
        departmentId: 'autre-departement',
        baseSalary: 180000,
      },
    },
  });
});

describe('Lecture des fiches agents', () => {
  test("un visiteur anonyme ne peut pas lire la fiche du Président", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'employees/emp-president')));
  });

  test("un visiteur anonyme ne peut pas énumérer le Directoire", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, 'employees'),
          where('status', '==', 'Actif'),
          where('departmentId', '==', DIRECTOIRE_DEPT_ID),
        ),
      ),
    );
  });

  test("un visiteur anonyme ne peut pas énumérer par intitulé de poste", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, 'employees'),
          where('status', '==', 'Actif'),
          where('poste', '==', 'Président'),
        ),
      ),
    );
  });

  test("un agent sans droit RH ne peut pas lire la fiche d'un autre agent", async () => {
    const db = env.authenticatedContext('agent').firestore();
    await assertFails(getDoc(doc(db, 'employees/emp-president')));
  });

  test("un agent peut lire sa propre fiche", async () => {
    const db = env.authenticatedContext('agent').firestore();
    await assertSucceeds(getDoc(doc(db, 'employees/emp-agent')));
  });

  test("un gestionnaire RH peut lire les fiches", async () => {
    const db = env.authenticatedContext('rh').firestore();
    await assertSucceeds(getDoc(doc(db, 'employees/emp-president')));
  });
});
