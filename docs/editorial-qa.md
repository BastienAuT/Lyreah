# Recette éditoriale du catalogue de lancement

Recette effectuée le 18 août 2026. Les 13 archives ont été téléchargées depuis les fiches Project Gutenberg, validées comme EPUB, décompressées avec contrôle des chemins et importées dans le bucket privé. Les titres français de Jules Verne utilisent le texte français ; les dix autres ouvrages sont en version originale anglaise et l’interface l’indique désormais explicitement.

| Livre | PG | Langue | EPUB | Source et droits |
|---|---:|:---:|:---:|---|
| Frankenstein | 84 | en | prêt | domaine public, Project Gutenberg |
| Alice au pays des merveilles | 11 | en | prêt | domaine public, Project Gutenberg |
| Le Tour du monde en quatre-vingts jours | 800 | fr | prêt | domaine public, Project Gutenberg |
| Vingt mille lieues sous les mers | 54873 | fr | prêt, compact | domaine public, Project Gutenberg |
| Voyage au centre de la Terre | 4791 | fr | prêt | domaine public, Project Gutenberg |
| La Machine à explorer le temps | 35 | en | prêt | domaine public, Project Gutenberg |
| La Guerre des mondes | 36 | en | prêt | domaine public, Project Gutenberg |
| Dracula | 345 | en | prêt | domaine public, Project Gutenberg |
| Peter Pan | 16 | en | prêt | domaine public, Project Gutenberg |
| Le Magicien d’Oz | 55 | en | prêt | domaine public, Project Gutenberg |
| L’Île au trésor | 120 | en | prêt, compact | domaine public, Project Gutenberg |
| Le Jardin secret | 17396 | en | prêt, compact | domaine public, Project Gutenberg |
| Robinson Crusoé | 521 | en | prêt, compact | domaine public, Project Gutenberg |

Les œuvres sont dans le domaine public en France (auteurs décédés depuis plus de 70 ans) et signalées comme domaine public aux États-Unis par Project Gutenberg. La mention de source et les crédits de transcription sont conservés dans chaque fiche. Les couvertures locales sont rattachées à l’édition Project Gutenberg correspondante et leur crédit est affiché dans la note de provenance.

Les ambiances utilisent uniquement les sources et licences renseignées par `scripts/import-curated-soundscapes.ts` (CC0 ou domaine public). L’attribution, le nom de licence et le lien source sont exposés dans le panneau audio. Toute nouvelle piste doit conserver ces trois champs et passer la validation de durée.

Commandes de contrôle :

```bash
bun run catalog:audit
bun run catalog:import
bun run audio:import
```

L’import EPUB est idempotent : sans `--force`, il ne remplace jamais un livre déjà prêt. `--only <slug>` limite la recette à un ouvrage.
