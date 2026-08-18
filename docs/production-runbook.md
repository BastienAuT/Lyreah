# Mise en production de Lyreah

## Architecture retenue

- application Next.js déployable sur Vercel (région Paris `cdg1`) ou avec le `Dockerfile` autonome ;
- PostgreSQL et authentification chez Neon ;
- EPUB, couvertures et audio dans un bucket Supabase privé ;
- migrations Drizzle appliquées par une étape de livraison distincte, avant le trafic applicatif.

Le dépôt ne possède pas encore de remote : créer le dépôt Git, puis ajouter `origin` et pousser `main`. La CI fournie dans `.github/workflows/ci.yml` s’activera dès le premier push.

## Variables de production

Configurer les variables décrites dans `.env.example`. Les valeurs `DATABASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` et `MONITORING_TOKEN` sont des secrets serveur. La clé Supabase `service_role` ne doit jamais porter le préfixe `NEXT_PUBLIC_`.

Utiliser `SUPABASE_STORAGE_PREFIX=prod`, une base Neon de production séparée et des clés différentes entre preview et production. Les variables `NEXT_PUBLIC_*` sont figées au build : les renseigner avant la construction de l’image.

## Livraison

1. Exécuter `bun install --frozen-lockfile`, `bun test`, `bun run lint`, `bun run typecheck` et `bun run build`.
2. Sauvegarder la base et l’inventaire du bucket.
3. Exécuter `bun run db:migrate` avec la connexion de production.
4. Déployer le commit testé, puis appeler `/api/health` et `/api/health` avec `Authorization: Bearer $MONITORING_TOKEN` pour le contrôle profond de la base.
5. Exécuter la suite Playwright contre l’URL de production ou de staging avant bascule DNS.

Ne jamais lancer les migrations depuis plusieurs instances web en parallèle. En cas d’échec, restaurer le snapshot de base, remettre l’image précédente et conserver le préfixe de stockage existant.

## Domaine et TLS

Ajouter le domaine dans Vercel (ou devant le conteneur via un proxy TLS), créer les enregistrements DNS indiqués par l’hébergeur, puis définir `NEXT_PUBLIC_SITE_URL`. Conserver l’ancien domaine en redirection permanente après validation des routes d’authentification. Ajouter le domaine final aux URL autorisées de Neon Auth et Supabase.

## Supervision

- sonde d’uptime toutes les minutes sur `/api/health` ;
- sonde profonde toutes les cinq minutes avec `MONITORING_TOKEN` ;
- alerte sur taux de réponses 5xx, latence p95, erreurs d’import et espace du bucket ;
- collecte des logs structurés de la plateforme avec rétention d’au moins 30 jours ;
- rapport Playwright conservé comme artefact CI.

La connexion à un outil de suivi d’erreurs (Sentry ou équivalent) reste un choix de compte externe : créer le projet, ajouter son DSN comme secret et définir les règles de rétention avant ouverture publique.

## Sauvegardes

- activer la restauration à un instant donné Neon et conserver un snapshot quotidien 30 jours ;
- exporter chaque nuit les tables critiques (`books`, `profiles`, `library_entries`, `reading_progress`, `soundscapes`) vers un stockage distinct ;
- répliquer quotidiennement le bucket Supabase privé vers un second fournisseur ou une autre région, avec versioning et chiffrement ;
- tester chaque trimestre une restauration dans un environnement isolé ; objectif RPO 24 h, RTO 4 h.

Une sauvegarde n’est considérée valide qu’après restauration contrôlée d’un EPUB, de sa rendition et de la progression d’un lecteur.
