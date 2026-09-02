# Incident : clés Gemini exposées dans l'historique git

## Résumé

Deux clés API Google Gemini ont été committées dans `serviceAccountKey.json` :

| Clé | Commit | Statut |
|---|---|---|
| `AIzaSyAazN1Scfer-c7jdK1AGrsbJT6Sa9oU7QQ` | antérieur à `c116d1b` | **à révoquer** |
| `hgUbZvyX443vI5c8w6vGyGryYJtlqT53usXW4zlK` | `c116d1b` (2025-10-01) | **à révoquer** |

Ces clés restent visibles dans l'historique git même si les fichiers ont été modifiés depuis. Elles doivent être considérées comme compromises.

## Étape 1 — Révocation (à faire MAINTENANT, avant tout le reste)

1. Ouvrir [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Sélectionner le projet lié à votre application
3. Repérer chaque clé API (en particulier celles commençant par `AIza…`)
4. Supprimer les deux clés listées ci-dessus
5. Créer une nouvelle clé si nécessaire pour l'application, avec des **restrictions strictes** :
   - Restriction par API : uniquement `Generative Language API` (Gemini)
   - Restriction par référent HTTP : uniquement votre domaine de production
   - Quota journalier réduit

⚠️ La révocation est **irréversible et immédiate**. Toute app utilisant la clé cesse de fonctionner. Prévoyez de remplacer la clé dans votre `.env.local` production juste après.

## Étape 2 — Purger l'historique git

Deux options : `git filter-repo` (recommandé, moderne) ou BFG Repo-Cleaner (rapide sur gros dépôts).

### Option A — `git filter-repo` (recommandé)

```bash
# Installation (macOS/Linux)
brew install git-filter-repo
# ou : pip install git-filter-repo

# 1. Cloner un miroir frais du dépôt (par sécurité)
cd /tmp
git clone --mirror https://github.com/magloire078/Gestion-CNRCT.git
cd Gestion-CNRCT.git

# 2. Créer un fichier de remplacements
cat > /tmp/replacements.txt <<'EOF'
AIzaSyAazN1Scfer-c7jdK1AGrsbJT6Sa9oU7QQ==>REVOKED_GEMINI_KEY_1
hgUbZvyX443vI5c8w6vGyGryYJtlqT53usXW4zlK==>REVOKED_GEMINI_KEY_2
EOF

# 3. Réécrire l'historique — remplace le texte dans TOUS les commits/branches/tags
git filter-repo --replace-text /tmp/replacements.txt

# 4. Force push vers le dépôt d'origine
git push --force --all
git push --force --tags
```

### Option B — BFG Repo-Cleaner

```bash
# Télécharger le jar : https://rtyley.github.io/bfg-repo-cleaner/
# 1. Clone miroir
git clone --mirror https://github.com/magloire078/Gestion-CNRCT.git
cd Gestion-CNRCT.git

# 2. Créer le fichier de secrets
cat > /tmp/secrets.txt <<'EOF'
AIzaSyAazN1Scfer-c7jdK1AGrsbJT6Sa9oU7QQ
hgUbZvyX443vI5c8w6vGyGryYJtlqT53usXW4zlK
EOF

# 3. Purger
java -jar bfg.jar --replace-text /tmp/secrets.txt .

# 4. Nettoyer et pousser
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

## Étape 3 — Après la purge

1. **Prévenez chaque collaborateur** qu'ils doivent supprimer leur clone local et re-cloner. Les vieux clones contiennent encore les clés.
2. **Vérifiez** que les clés ne sont plus indexées :
   ```bash
   git log --all -p | grep -E "AIzaSy|hgUbZv" || echo "OK, plus rien"
   ```
3. **Rotation générale** — considérez la même chose pour :
   - Mot de passe du compte Google associé
   - Tokens GitHub (Personal Access Tokens)
   - Secrets CI/CD (Vercel, Firebase Hosting)
4. **Activez le scan de secrets** GitHub sur votre repo (gratuit sur repos publics, payant sur privés) :
   Settings → Code security and analysis → Secret scanning → Enable

## Étape 4 — Prévention

Les modifications déjà appliquées sur cette branche :

- `serviceAccountKey.json` **retiré du tracking git** (`git rm --cached`)
- `.gitignore` **étend maintenant** aux patterns `serviceAccountKey.json`, `*serviceAccount*.json`, `*.key.json`, `firebase-adminsdk-*.json`, `credentials.json`, etc.
- `serviceAccountKey.example.json` **ajouté** — modèle à copier localement en `serviceAccountKey.json` (qui reste ignoré)

Recommandations supplémentaires :

- Installer un **pre-commit hook** qui bloque les commits contenant `AIzaSy`, `-----BEGIN PRIVATE KEY-----`, ou d'autres patterns de secrets. Voir [gitleaks](https://github.com/gitleaks/gitleaks) ou [trufflehog](https://github.com/trufflesecurity/trufflehog).
- Toujours utiliser `.env.local` (ignoré) plutôt que d'inliner des secrets dans du JSON.
- Pour la production : injecter les secrets via variables d'environnement du provider (Firebase Functions config, Vercel env, GitHub Actions secrets), jamais via fichier.
