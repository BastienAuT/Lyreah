# Recette éditoriale du catalogue de lancement

Recette corrigée le 18 août 2026 : le catalogue est exclusivement francophone. Chaque archive est contrôlée sur trois niveaux avant son import : métadonnée EPUB `dc:language=fr`, analyse lexicale du contenu, puis validation structurelle et sécuritaire de l’archive.

| Livre | Édition française | Langue | Source |
|---|---|:---:|---|
| Frankenstein ou le Prométhée moderne | traduction Jules Saladin, 1821 | fr | Wikisource |
| Aventures d’Alice au pays des merveilles | traduction Henri Bué | fr | Project Gutenberg 55456 |
| Le Tour du monde en quatre-vingts jours | texte original | fr | Project Gutenberg 800 |
| Vingt mille lieues sous les mers | texte original | fr | Project Gutenberg 54873 |
| Voyage au centre de la Terre | texte original | fr | Project Gutenberg 4791 |
| La Machine à explorer le temps | traduction Henry D. Davray, 1898 | fr | Wikisource |
| La Guerre des mondes | traduction Henry D. Davray, 1899 | fr | Wikisource |
| De la Terre à la Lune | texte original | fr | Project Gutenberg 38674 |
| Le Livre de la jungle | traduction Louis Fabulet et Robert d’Humières | fr | Project Gutenberg 54183 |
| Les Malheurs de Sophie | texte original | fr | Project Gutenberg 15058 |
| L’Île au trésor | traduction Paschal Grousset, édition Hetzel 1885 | fr | Project Gutenberg 76225 |
| En famille | texte original | fr | Project Gutenberg 13793 |
| Aventures surprenantes de Robinson Crusoé | édition française illustrée | fr | Project Gutenberg 57964 |

Les anciennes entrées anglaises `dracula`, `peter-pan`, `le-magicien-d-oz` et `le-jardin-secret` sont dépubliées. Elles sont remplacées par quatre ouvrages français ou traductions françaises dont les droits sont vérifiables. Les couvertures provenant des anciennes éditions anglaises ne sont plus utilisées ; une couverture typographique française est générée par l’interface lorsqu’aucune couverture locale vérifiée n’est disponible.

Les traductions retenues sont dans le domaine public en France. Les crédits de transcription et le lien vers l’édition numérique sont conservés dans chaque fiche. Les contenus Wikisource restent soumis aux conditions de réutilisation CC BY-SA de Wikisource en plus du statut patrimonial du texte source.

Les ambiances utilisent uniquement les sources et licences renseignées par `scripts/import-curated-soundscapes.ts` (CC0 ou domaine public). L’attribution, le nom de licence et le lien source sont exposés dans le panneau audio.

```bash
bun run db:seed
bun run catalog:audit
bun run catalog:import --force
```

L’import refuse désormais une archive anglaise même si sa base de données ou ses métadonnées prétendent qu’elle est française.
