# Audit de préparation portfolio — Lyreah

Audit réalisé le 24 août 2026 sur la branche `main`, avant la création du visuel
portfolio et la refonte du README.

## Verdict

**Lyreah est présentable dans un portfolio comme projet full-stack abouti.**

Le socle technique, la sécurité du stockage, le traitement EPUB, l’accessibilité
publique et le build de production sont validés. Aucun défaut bloquant n’a été
détecté dans le périmètre testable localement.

L’ouverture publique reste conditionnée à la configuration du domaine et de
l’identité légale, puis à une recette authentifiée sur un staging dédié. Ces
points relèvent du déploiement et des comptes externes, pas d’un défaut du code.

## Périmètre examiné

- architecture Next.js App Router et frontières serveur/client ;
- catalogue, bibliothèque, liseuse EPUB et progression ;
- authentification et contrôle du rôle administrateur ;
- import, extraction et publication des EPUB ;
- stockage privé et URL signées Supabase ;
- ambiances audio, préférences et rafraîchissement des URL ;
- SEO, métadonnées sociales, sitemap et robots.txt ;
- accessibilité clavier, réduction des animations et responsive ;
- configuration CI, Docker, Vercel, sauvegardes et supervision ;
- dépendances et exposition de secrets.

## Résultats automatisés

| Contrôle | Résultat |
|---|---:|
| Tests unitaires | 70 réussis, 0 échec |
| ESLint | réussi |
| TypeScript | réussi |
| Build Next.js 16.3 | réussi, 28 pages générées |
| Playwright public | 40 réussis, 0 échec |
| Formats Playwright | Chromium, iPhone 13, iPad portrait et paysage |
| axe-core | aucune violation sur les pages publiques testées |
| Neon PostgreSQL | connexion validée |
| Schéma Neon Auth | validé |
| Supabase Storage | connexion validée, bucket privé |

## Points forts constatés

### Sécurité

- secrets serveur séparés des variables `NEXT_PUBLIC_*` et fichiers `.env*`
  exclus de Git, Docker et Vercel ;
- autorisation administrateur revérifiée dans chaque route sensible ;
- bucket privé et accès lecteur limité par publication, session et URL signée ;
- EPUB scriptés désactivés dans epub.js ;
- protection contre la traversée de répertoires, les archives ZIP anormales et
  les renditions trop volumineuses ;
- en-têtes HSTS, anti-MIME-sniffing, anti-framing, politique de référent et
  permissions navigateur restrictives.

### Produit et UX

- expérience responsive explicitement couverte par les tests ;
- navigation clavier et focus visibles ;
- prise en charge de `prefers-reduced-motion` ;
- progression CFI synchronisée et préférences conservées ;
- immersion sonore désactivable et pause automatique en arrière-plan ;
- sources, droits et licences affichés sur les fiches et dans le lecteur.

### Exploitation

- CI sur pull request et `main` ;
- build Vercel ou conteneur standalone non-root ;
- migrations séparées du démarrage web ;
- sonde légère et sonde profonde protégée par jeton ;
- runbook de livraison, rollback, supervision et restauration.

## Corrections intégrées pendant l’audit

- chargement immédiat des couvertures identifiées comme éléments LCP sur
  l’accueil, le catalogue et la fiche livre, avec l’API `loading="eager"`
  recommandée par Next.js 16 ;
- création d’un visuel 16:9 dédié au carrousel du portfolio ;
- remplacement du README technique minimal par une présentation produit et
  architecture complète.

## Risques résiduels et conditions de lancement

### À faire avant ouverture publique

1. Définir `NEXT_PUBLIC_SITE_URL` avec le domaine HTTPS définitif.
2. Confirmer la transmission de l’identité privée à l’hébergeur ou renseigner
   l’adresse requise selon le statut de l’éditeur.
3. Exécuter les parcours E2E lecteur, inscription et administration sur un
   staging avec des sessions de test dédiées.
4. Effectuer un Lighthouse en conditions de production et activer la collecte
   des Core Web Vitals réels.

### Dépendance de développement

`bun audit` remonte une vulnérabilité modérée dans `esbuild`, dépendance
transitive de `drizzle-kit`. Elle concerne le serveur de développement esbuild,
qui n’est pas livré dans le runtime Lyreah. La CI documente et ignore précisément
`GHSA-67mh-4wv8-2f99` jusqu’à la mise à jour amont. Aucun avis visant une
dépendance du runtime de production n’a été détecté.

### Améliorations non bloquantes

- ajouter un suivi d’erreurs externe après choix du compte et de la politique de
  rétention ;
- ajouter des pages d’erreur et 404 entièrement personnalisées ;
- mesurer les bundles et les Web Vitals sur le déploiement final ;
- étudier une Content Security Policy par nonce compatible avec epub.js et les
  URL signées, plutôt qu’une règle statique susceptible de casser la liseuse.

## Conclusion

Lyreah dépasse le stade de démonstrateur visuel : le projet montre une vraie
gestion de données, des flux privés, une chaîne de traitement de fichiers non
fiables, un produit accessible et une stratégie de livraison. Il peut être ajouté
au portfolio dès maintenant, en présentant clairement le lien GitHub et le visuel
fourni. Le lien de démonstration public ne devrait être ajouté qu’après validation
des quatre conditions de lancement ci-dessus.
