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

`SUPABASE_STORAGE_PREFIX` sépare les objets d'environnement dans le même bucket :
utiliser `dev` localement et `prod` en production.

## Connexions externes

Une fois les variables configurées, vérifier Neon et Supabase sans afficher de
secret :

```bash
bun run services:check
```

## Vérifications

```bash
bun run lint
bun run typecheck
bun run build
```
