# Politique de sécurité

## Signaler une vulnérabilité

Merci d'envoyer un e-mail à l'administrateur du projet plutôt que d'ouvrir une issue publique. Les vulnérabilités reçoivent une réponse initiale sous 72 heures et un correctif est proposé selon la gravité.

## Firebase App Check

App Check ajoute une couche d'attestation reCAPTCHA v3 (invisible) devant Firestore / Auth / Storage / Functions. Objectif : refuser les requêtes qui ne proviennent pas d'une session de navigateur légitime sur votre app (bloque `curl`, scripts, bots, extractions massives — même quand l'API Key Firebase publique est connue).

**⚠️ Activation en 3 étapes**

1. **reCAPTCHA v3** — Aller sur https://www.google.com/recaptcha/admin, créer un site v3 pour votre domaine (`intranetcnrct.org` + `localhost` en dev), copier la **site key** publique.
2. **Firebase Console** — Ouvrir le projet CNRCT → **App Check** → cliquer sur votre app web → *Register* → sélectionner *reCAPTCHA v3* → coller la site key + le secret. Firebase la garde côté serveur pour vérifier les tokens.
3. **Variables d'environnement** — Ajouter dans `.env.local` (dev) et l'env de prod :
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=votre-site-key-recaptcha-v3
   ```
   Optionnel en dev : `NEXT_PUBLIC_APP_CHECK_DEBUG=true` (voir plus bas).

**Enforcement progressif**

Ne pas passer directement en mode « Enforce ». Séquence recommandée :

1. Rester en mode « Unenforced » 24-48h après la mise en prod pour vérifier que 100% des requêtes légitimes portent bien un token App Check dans les métriques (Firebase Console → App Check → onglet *Usage*).
2. Passer en « Enforce » pour Firestore, Storage, Auth, Functions un service à la fois.
3. Toute requête sans token valide sera alors refusée avec `403 Missing App Check token`.

**Développement local**

Le mode debug permet de whitelister votre poste sans passer par reCAPTCHA :

1. Mettre `NEXT_PUBLIC_APP_CHECK_DEBUG=true` dans `.env.local`.
2. Charger l'app une fois — la console navigateur affiche un debug token UUID.
3. Firebase Console → App Check → onglet *Apps* → dropdown de votre app → *Debug tokens* → ajouter ce token.
4. Il reste valide pour ce poste tant qu'il n'est pas révoqué.

Sans `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` défini, App Check est **désactivé silencieusement** — l'app fonctionne mais sans la protection. Utile pour les postes de dev qui ne veulent pas configurer reCAPTCHA.

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
