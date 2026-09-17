/**
 * isSuperAdmin() et can() lisent leurs droits dans users/{uid} : roleId et
 * resourcePermissions. La règle d'update interdit bien de modifier ces deux
 * champs — mais la règle de create, elle, ne contraint pas le contenu du
 * document. Un compte fraîchement inscrit, qui n'a donc pas encore de
 * document utilisateur, pourrait le créer avec les droits de son choix.
 *
 * Nécessite l'émulateur Firestore sur 127.0.0.1:8080 (voir npm run test:rules).
 */
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { seed, setupEnv } from './helpers';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await setupEnv('privesc');
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    users: {
      existant: { roleId: 'agent-simple' },
    },
    roles: {
      'agent-simple': { resourcePermissions: {} },
      'super-admin': { resourcePermissions: { employees: { read: true } } },
    },
  });
});

describe('Élévation de privilèges', () => {
  test("un nouvel inscrit ne peut pas se créer un profil super-admin", async () => {
    const db = env.authenticatedContext('nouveau').firestore();
    await assertFails(setDoc(doc(db, 'users/nouveau'), { roleId: 'super-admin' }));
  });

  test("un nouvel inscrit ne peut pas s'octroyer des permissions à la création", async () => {
    const db = env.authenticatedContext('nouveau').firestore();
    await assertFails(
      setDoc(doc(db, 'users/nouveau'), {
        resourcePermissions: { employees: { read: true, update: true, delete: true } },
      }),
    );
  });

  test("un utilisateur existant ne peut pas changer son roleId", async () => {
    const db = env.authenticatedContext('existant').firestore();
    await assertFails(updateDoc(doc(db, 'users/existant'), { roleId: 'super-admin' }));
  });

  test("un utilisateur existant ne peut pas s'octroyer des permissions", async () => {
    const db = env.authenticatedContext('existant').firestore();
    await assertFails(
      updateDoc(doc(db, 'users/existant'), {
        resourcePermissions: { employees: { read: true } },
      }),
    );
  });

  test("une inscription normale reste possible avec le rôle par défaut", async () => {
    const db = env.authenticatedContext('nouveau').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users/nouveau'), {
        name: 'Nouvel Agent',
        email: 'nouvel.agent@cnrct.ci',
        roleId: 'employe-operationnel',
        photoUrl: '',
      }),
    );
  });

  test("un utilisateur ne peut pas écrire dans la matrice des rôles", async () => {
    const db = env.authenticatedContext('existant').firestore();
    await assertFails(
      setDoc(doc(db, 'roles/agent-simple'), { resourcePermissions: { employees: { read: true } } }),
    );
  });

  test("un utilisateur ne peut pas s'octroyer le drapeau super-admin sur son rôle", async () => {
    const db = env.authenticatedContext('existant').firestore();
    await assertFails(updateDoc(doc(db, 'roles/agent-simple'), { isSuperAdmin: true }));
  });
});

describe('Super-admin porté par le rôle', () => {
  test("un rôle marqué isSuperAdmin confère les droits d'administration", async () => {
    await seed(env, {
      users: { patron: { roleId: 'direction' } },
      roles: { direction: { isSuperAdmin: true } },
    });
    const db = env.authenticatedContext('patron').firestore();
    await assertSucceeds(setDoc(doc(db, 'roles/nouveau-role'), { resourcePermissions: {} }));
  });

  test("un rôle sans le drapeau ne confère rien", async () => {
    const db = env.authenticatedContext('existant').firestore();
    await assertFails(setDoc(doc(db, 'roles/nouveau-role'), { resourcePermissions: {} }));
  });
});
