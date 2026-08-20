# Mise en production de Lyreah

## Architecture retenue

- application Next.js déployable sur Vercel (région Paris `cdg1`) ou avec le `Dockerfile` autonome ;
- PostgreSQL et authentification chez Neon ;
- EPUB, couvertures et audio dans un bucket Supabase privé ;
- migrations Drizzle appliquées par une étape de livraison distincte, avant le trafic applicatif.

Le dépôt utilise le remote GitHub `origin`. La CI fournie dans `.github/workflows/ci.yml` s’active sur chaque pull request et chaque push vers `main`.

## Variables de production

Configurer les variables décrites dans `.env.example`. Les valeurs `DATABASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` et `MONITORING_TOKEN` sont des secrets serveur. La clé Supabase `service_role` ne doit jamais porter le préfixe `NEXT_PUBLIC_`.

Utiliser `SUPABASE_STORAGE_PREFIX=prod`, une base Neon de production séparée et des clés différentes entre preview et production. Les variables `NEXT_PUBLIC_*` sont figées au build : les renseigner avant la construction de l’image. Pour Docker, transmettre ces valeurs avec les arguments de build homonymes déclarés dans le `Dockerfile` ; conserver les secrets serveur comme variables d’exécution.

Avant l’ouverture publique, choisir explicitement le régime de l’éditeur avec `NEXT_PUBLIC_LEGAL_PUBLISHER_STATUS` :

- `individual-non-professional` pour une personne physique éditant à titre non professionnel. Renseigner le nom complet et l’e-mail public, laisser `NEXT_PUBLIC_LEGAL_PUBLISHER_ADDRESS` vide et ne passer `NEXT_PUBLIC_LEGAL_HOST_IDENTITY_CONFIRMED` à `true` qu’après avoir vérifié que le nom complet, le domicile et les autres éléments d’identification requis ont bien été communiqués à l’hébergeur. Pour Vercel, contrôler les informations du titulaire du compte et, si nécessaire, demander au support quel canal utiliser ;
- `professional` pour une activité professionnelle. Le nom, l’e-mail et l’adresse publique sont alors tous requis par la validation de configuration.

Ne jamais enregistrer l’adresse personnelle dans le dépôt, dans une variable `NEXT_PUBLIC_*` ou dans un ticket public. Les valeurs d’hébergement proposées dans `.env.example` correspondent à Vercel ; les remplacer si un autre hébergeur sert la production. Vérifier ensuite que `/mentions-legales` présente le bon régime et n’affiche plus l’avertissement de configuration de développement, puis que `/politique-de-confidentialite` affiche directement le nom et l’e-mail du responsable du traitement.

## Livraison

1. Exécuter `bun install --frozen-lockfile`, `bun test`, `bun run lint`, `bun run typecheck` et `bun run build`.
2. Sauvegarder la base et l’inventaire du bucket.
3. Exécuter `bun run db:migrate` avec la connexion de production.
4. Déployer le commit testé, puis appeler `/api/health` et `/api/health` avec `Authorization: Bearer $MONITORING_TOKEN` pour le contrôle profond de la base.
5. Exécuter la suite Playwright contre l’URL de staging sur ordinateur, iPhone et tablette, puis effectuer un smoke test de production après bascule.

Dans GitHub, définir `E2E_BASE_URL` comme variable pointant vers le staging. Si la preview Vercel est protégée, enregistrer son secret d’automatisation dans `E2E_VERCEL_PROTECTION_BYPASS` ; Playwright l’envoie uniquement dans l’en-tête de bypass. Le secret `E2E_SIGNUP_EMAIL` doit contenir le marqueur `{timestamp}` (par exemple `lyreah-recette+{timestamp}@example.com`) afin que chaque recette crée un compte distinct. Ne jamais pointer ces tests mutateurs vers la base de production.

Ne jamais lancer les migrations depuis plusieurs instances web en parallèle. En cas d’échec, restaurer le snapshot de base, remettre l’image précédente et conserver le préfixe de stockage existant.

La CI exécute aussi `bun audit`. L’avis `GHSA-67mh-4wv8-2f99` est temporairement ignoré : il provient exclusivement du serveur de développement `esbuild` embarqué par le CLI `drizzle-kit`, qui n’est ni inclus ni lancé dans le runtime de production. Retirer cette exception dès que Drizzle Kit ne dépend plus de cette version.

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
