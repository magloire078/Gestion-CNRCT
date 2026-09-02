# Politique de sécurité

## Signaler une vulnérabilité

Merci d'envoyer un e-mail à l'administrateur du projet plutôt que d'ouvrir une issue publique. Les vulnérabilités reçoivent une réponse initiale sous 72 heures et un correctif est proposé selon la gravité.

## Authentification à deux facteurs (MFA)

Le code applicatif est prêt pour la MFA par TOTP (application authentificatrice : Google/Microsoft Authenticator, 1Password, Authy…). Chaque utilisateur peut activer/désactiver son second facteur depuis **Profil → Sécurité (MFA)** (`/settings/security`).

**⚠️ Activation côté Firebase requise avant tout usage** :

1. Ouvrir la [Firebase Console](https://console.firebase.google.com/) → projet CNRCT
2. Authentication → Sign-in method → **Multi-factor authentication**
3. Activer **TOTP** comme second facteur
4. Sauvegarder

Sans cette activation, la page `/settings/security` renverra une erreur au moment de générer le QR code (`auth/operation-not-allowed`).

**Recommandation** : activer la MFA sur tous les comptes super-admin, dirigeant et administrateur RH — ce sont les premiers ciblés par du phishing.

## Bonnes pratiques pour les contributeurs

### Ne jamais commiter de secrets

Les fichiers suivants sont **ignorés par `.gitignore` et bloqués par le pre-commit hook** :

- `serviceAccountKey.json` (Firebase Admin SDK)
- `.env`, `.env.local`, `.env.production`
- `credentials.json`, `client_secret*.json`
- Tout fichier matchant `*serviceAccount*.json`, `firebase-adminsdk-*.json`, `*.key.json`

Pour l'exemple d'un fichier de credentials, voir [`serviceAccountKey.example.json`](./serviceAccountKey.example.json).

### Activer le pre-commit hook anti-secrets

Après avoir cloné le repo (une seule fois) :

```bash
git config core.hooksPath .githooks
```

Le hook `.githooks/pre-commit` scanne chaque commit pour bloquer :

- Clés API Google (`AIza...`)
- Clés privées PEM (`-----BEGIN … PRIVATE KEY-----`)
- Tokens AWS, GitHub, OpenAI, Slack
- Emails de service Firebase Admin

### Routes API

Toute nouvelle route dans `src/app/api/**/route.ts` DOIT commencer par un helper d'auth :

```typescript
import { requireAuth, requireSuperAdmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);        // ou requireSuperAdmin
  if (!auth.ok) return auth.response;
  // ...
}
```

Un endpoint sans cette vérification est **exposé à Internet sans authentification** dès son déploiement.

### Rendu de HTML utilisateur

Ne jamais utiliser `dangerouslySetInnerHTML` avec du contenu venu d'un utilisateur sans sanitisation. Utiliser :

```typescript
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

### Règles Firestore

Toute modification de `firestore.rules` doit être testée localement avec l'émulateur :

```bash
firebase emulators:start --only firestore
```

Ne jamais introduire de `match /{document=**} { allow read: if true; }` — c'est le pattern qui a exposé toute la base en octobre 2025.

## Incident historique

En cas de fuite de clés/tokens dans l'historique git, voir la procédure de purge dans [`docs/SECURITY-INCIDENT-KEYS.md`](./docs/SECURITY-INCIDENT-KEYS.md).
