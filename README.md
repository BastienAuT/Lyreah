# Lyreah

Application de lecture EPUB avec progression synchronisée et ambiances sonores.

## Stack

- Next.js, React, TypeScript et Tailwind CSS
- Bun pour les dépendances et les scripts
- Neon PostgreSQL pour les données
- Neon Auth pour les comptes et les sessions
- Supabase Storage pour les fichiers privés

## Développement local

Copier `.env.example` vers `.env.local`, puis renseigner les variables locales. Ne
jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans une variable `NEXT_PUBLIC_*`.

```bash
bun install
bun dev
```

L'application est ensuite disponible sur <http://localhost:3000>.

## Stockage Supabase

Créer automatiquement le bucket **privé** configuré dans l'environnement :

```bash
bun run storage:setup
```

Le bucket utilise les préfixes suivants :

- `masters/` : fichiers EPUB originaux, réservés à l'administration ;
- `renditions/` : contenu EPUB préparé pour le lecteur ;
- `covers/` : couvertures optimisées ;
- `audio/` : ambiances sonores.

Le navigateur ne reçoit jamais la clé `service_role`. Les accès de lecture seront
accordés côté serveur avec des URL signées de courte durée.

Les imports administrateur utilisent également une URL signée : le navigateur
emploie uniquement `NEXT_PUBLIC_SUPABASE_URL` et la clé publiable Supabase. Cette
clé ne donne aucun accès privilégié au bucket privé ; le jeton temporaire est
créé par l’API Lyreah après vérification du rôle administrateur.

`SUPABASE_STORAGE_PREFIX` sépare les objets d'environnement dans le même bucket :
utiliser `dev` localement et `prod` en production.

## Connexions externes

Une fois les variables configurées, vérifier Neon et Supabase sans afficher de
secret :

```bash
bun run services:check
```

## Administration

Après une première connexion, promouvoir le profil de développement :

```bash
bun run admin:promote
```

Si plusieurs profils existent, la commande demande explicitement l’identifiant
à promouvoir. Le back-office est ensuite disponible sur <http://localhost:3000/admin>.

L’import accepte les EPUB jusqu’à 6 Mo et les couvertures AVIF, JPEG, PNG ou WebP
jusqu’à 4 Mo. Un livre importé reste non publié tant que sa rendition de lecture
n’a pas été préparée et validée.

Après confirmation de l’upload, Lyreah vérifie automatiquement la structure de
l’EPUB, bloque les chemins dangereux et les archives démesurées, puis extrait les
fichiers de lecture dans `renditions/<book-id>/`. Le statut visible dans le
back-office passe à `ready` ou `failed` à la fin du traitement. Un import échoué
peut être relancé en confirmant à nouveau son upload.

Si le navigateur interrompt l’envoi avant sa confirmation, une nouvelle
soumission avec le même slug remplace automatiquement l’import `pending`
abandonné par le même administrateur.

## Vérifications

```bash
bun run lint
bun run typecheck
bun run build
```
