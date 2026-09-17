/**
 * Reproduit les lectures que signIn() enchaîne après l'authentification
 * Firebase : getUserProfile() lit users/{uid}, puis getRoles() liste la
 * collection roles. Si l'une des deux est refusée, la connexion n'aboutit
 * jamais côté application.
 *
 * Nécessite l'émulateur Firestore sur 127.0.0.1:8080 (voir npm run test:rules).
 */
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { seed, setupEnv } from './helpers';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await setupEnv('login');
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    users: {
      'uid-admin': { roleId: 'administrateur', email: 'magloire078@gmail.com' },
      'uid-agent': { roleId: 'employe' },
    },
    roles: {
      administrateur: { name: 'Administrateur', resourcePermissions: { employees: { read: true } } },
      employe: { name: 'Employé Opérationnel', resourcePermissions: {} },
    },
  });
});

describe('Chaîne de lecture de la connexion', () => {
  test("un agent lit son propre document utilisateur", async () => {
    const db = env.authenticatedContext('uid-agent').firestore();
    await assertSucceeds(getDoc(doc(db, 'users/uid-agent')));
  });

  test("un agent liste les rôles", async () => {
    const db = env.authenticatedContext('uid-agent').firestore();
    await assertSucceeds(getDocs(query(collection(db, 'roles'), orderBy('name', 'asc'))));
  });

  test("un administrateur lit son propre document utilisateur", async () => {
    const db = env.authenticatedContext('uid-admin', { email: 'magloire078@gmail.com' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'users/uid-admin')));
  });

  test("un administrateur liste les rôles", async () => {
    const db = env.authenticatedContext('uid-admin', { email: 'magloire078@gmail.com' }).firestore();
    await assertSucceeds(getDocs(query(collection(db, 'roles'), orderBy('name', 'asc'))));
  });

  test("un compte sans document utilisateur peut vérifier son absence", async () => {
    const db = env.authenticatedContext('uid-inconnu').firestore();
    await assertSucceeds(getDoc(doc(db, 'users/uid-inconnu')));
  });
});
