import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Chaque fichier de test passe son propre identifiant de projet : vitest
 * exécute les fichiers en parallèle sur le même émulateur, et un projectId
 * partagé ferait effacer par le clearFirestore() de l'un les données que
 * l'autre vient d'écrire.
 */
export async function setupEnv(namespace: string): Promise<RulesTestEnvironment> {
  const rules = readFileSync(
    path.resolve(__dirname, '../../firestore.rules'),
    'utf8',
  );
  return initializeTestEnvironment({
    projectId: `cnrct-rules-${namespace}`,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

/**
 * Jeux d'essai écrits en contournant les règles.
 *   users/{uid}       → profil (roleId, resourcePermissions, employeeId)
 *   roles/{roleId}    → rôle porteur de resourcePermissions
 *   employees/{id}    → fiche agent
 *   conflicts/{id}    → dossier de médiation (support du suivi citoyen MGP)
 */
export interface Seed {
  users?: Record<string, any>;
  roles?: Record<string, any>;
  employees?: Record<string, any>;
  conflicts?: Record<string, any>;
}

export async function seed(env: RulesTestEnvironment, data: Seed) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as any;
    for (const [id, value] of Object.entries(data.users ?? {})) {
      await setDoc(doc(db, `users/${id}`), value);
    }
    for (const [id, value] of Object.entries(data.roles ?? {})) {
      await setDoc(doc(db, `roles/${id}`), value);
    }
    for (const [id, value] of Object.entries(data.employees ?? {})) {
      await setDoc(doc(db, `employees/${id}`), value);
    }
    for (const [id, value] of Object.entries(data.conflicts ?? {})) {
      await setDoc(doc(db, `conflicts/${id}`), value);
    }
  });
}
