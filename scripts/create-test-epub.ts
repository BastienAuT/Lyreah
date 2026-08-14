import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";

const outputDirectory = join(process.cwd(), "tmp");
const outputPath = join(outputDirectory, "lyreah-progress-test.epub");
const archive = new JSZip();
const chapters = [
  {
    id: "clearing",
    title: "La clairière",
    paragraphs: [
      "À la tombée du soir, les premières lucioles s’allumèrent entre les fougères. Élise ralentit le pas pour ne pas troubler leur danse, attentive au moindre frémissement de la forêt.",
      "Le sentier disparaissait parfois sous les feuilles, puis revenait entre deux pierres couvertes de mousse. Au loin, une chouette lança son appel et le silence sembla lui répondre.",
      "Élise suivit leur lumière jusqu’au vieux chêne, là où les histoires attendaient qu’on les écoute. Son tronc immense portait des signes que personne au village ne savait plus lire.",
      "Elle posa la main contre l’écorce. Une chaleur légère traversa sa paume, pareille au souvenir d’un feu longtemps éteint, et une porte étroite se dessina entre les racines.",
      "Derrière elle, les lucioles s’assemblèrent en une constellation mouvante. Elles éclairaient maintenant un escalier qui descendait sous la clairière.",
      "Chaque marche résonnait comme une note grave. Élise compta jusqu’à vingt, puis renonça : l’escalier paraissait se prolonger bien au-delà de la profondeur possible.",
      "L’air sentait la terre humide, le bois ancien et une fleur qu’elle ne reconnaissait pas. Pourtant, elle n’éprouvait aucune peur, seulement la certitude d’être attendue.",
      "Au bas des marches, une galerie s’ouvrait devant elle. Des racines couraient le long des murs comme les veines d’un immense animal endormi.",
      "Une luciole se posa sur son épaule. Sa lumière battait lentement, au même rythme que le cœur d’Élise, et lui indiqua le passage de gauche.",
      "Elle inspira profondément avant de continuer. Le village était déjà loin au-dessus d’elle, mais le voyage, elle le comprenait enfin, ne faisait que commencer.",
    ],
  },
  {
    id: "underground-river",
    title: "La rivière souterraine",
    paragraphs: [
      "La galerie déboucha sur une rive de sable pâle. Une rivière noire coulait sans bruit, reflétant des étoiles qui ne pouvaient appartenir au ciel du dehors.",
      "Une barque était attachée à un anneau de pierre. Elle semblait très ancienne, mais son bois ne portait ni fissure ni trace d’humidité.",
      "Élise détacha la corde et s’installa. À peine eut-elle posé les mains sur les rames que le courant emporta l’embarcation vers l’obscurité.",
      "Les lucioles voyageaient avec elle, suspendues au-dessus de l’eau. Leur reflet formait un second cortège sous la surface, comme si une autre barque avançait à l’envers.",
      "Des silhouettes de pierre apparurent sur les berges. Certaines avaient des visages humains, d’autres portaient des ailes ou des couronnes de branches.",
      "La rivière se resserra entre deux parois couvertes de cristaux. Lorsqu’elle les frôlait, la lumière des lucioles se divisait en centaines de couleurs.",
      "Puis une voix monta de l’eau. Elle ne prononçait aucun mot, mais Élise y reconnut la chanson que sa grand-mère fredonnait autrefois près de la fenêtre.",
      "Elle se pencha, cherchant un visage dans le courant. La barque oscilla et la luciole posée sur son épaule s’envola brusquement devant ses yeux.",
      "Le chant s’éloigna. À sa place vint le grondement d’une chute invisible, de plus en plus proche, tandis que le courant accélérait.",
      "Élise saisit les rames. Devant elle, une arche de lumière verte apparut dans la roche et elle dirigea la barque vers cette ouverture étroite.",
    ],
  },
  {
    id: "house-of-stories",
    title: "La maison des histoires",
    paragraphs: [
      "Au-delà de l’arche, la rivière devenait calme. Une maison se tenait au milieu d’une île minuscule, avec des fenêtres éclairées et une cheminée d’où montait une fumée violette.",
      "La barque toucha doucement le quai. Avant même qu’Élise ait pu frapper, la porte s’ouvrit sur une salle remplie de livres du sol au plafond.",
      "Les ouvrages respiraient. Leurs couvertures se soulevaient à peine, leurs pages frémissaient et de petits murmures circulaient entre les rayonnages.",
      "Une femme aux cheveux blancs l’attendait près du feu. Elle portait autour du cou une clef semblable au signe gravé dans le vieux chêne.",
      "Elle expliqua que chaque luciole gardait une histoire oubliée. Quand une lumière s’éteignait, une aventure disparaissait de la mémoire du monde.",
      "Élise observa les milliers de lueurs qui entraient par la cheminée et se posaient sur les livres. Certaines étaient vives, d’autres à peine visibles.",
      "Sur une table reposait un volume sans titre. La femme l’ouvrit et les pages blanches se couvrirent aussitôt du récit du sentier, de la rivière et de leur rencontre.",
      "Il manquait pourtant la dernière page. La femme tendit une plume à Élise et lui demanda quelle histoire elle souhaitait rapporter au village.",
      "Élise pensa aux signes oubliés, aux voix cachées sous l’eau et aux lumières que personne ne remarquait plus. Puis elle commença à écrire.",
      "Lorsque le jour se leva, elle se trouvait de nouveau dans la clairière. Le livre était entre ses mains et, tout autour d’elle, les lucioles brillaient encore.",
    ],
  },
] as const;

archive.file("mimetype", "application/epub+zip", { compression: "STORE" });
archive.file(
  "META-INF/container.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
);
archive.file(
  "EPUB/package.opf",
  `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="fr">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:9a18c35c-066a-4c95-9bc6-8c88c3ad01cd</dc:identifier>
    <dc:title>Les Sentiers de Lyreah</dc:title>
    <dc:creator>Atelier Lyreah</dc:creator>
    <dc:language>fr</dc:language>
    <meta property="dcterms:modified">2026-08-14T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${chapters.map((chapter) => `<item id="${chapter.id}" href="${chapter.id}.xhtml" media-type="application/xhtml+xml"/>`).join("\n    ")}
    <item id="style" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    ${chapters.map((chapter) => `<itemref idref="${chapter.id}"/>`).join("\n    ")}
  </spine>
</package>`,
);
archive.file(
  "EPUB/nav.xhtml",
  `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="fr">
  <head><title>Sommaire</title></head>
  <body><nav epub:type="toc"><ol>${chapters.map((chapter) => `<li><a href="${chapter.id}.xhtml">${chapter.title}</a></li>`).join("")}</ol></nav></body>
</html>`,
);

for (const chapter of chapters) {
  archive.file(
    `EPUB/${chapter.id}.xhtml`,
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
  <head><title>${chapter.title}</title><link rel="stylesheet" href="styles.css"/></head>
  <body>
    <h1>${chapter.title}</h1>
    ${chapter.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n    ")}
  </body>
</html>`,
  );
}

archive.file(
  "EPUB/styles.css",
  "body { font-family: serif; line-height: 1.7; } h1 { font-weight: 500; } p { margin: 0 0 1.2em; }",
);

await mkdir(outputDirectory, { recursive: true });
const epub = await archive.generateAsync({
  type: "uint8array",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});
await Bun.write(outputPath, epub);

console.log(`EPUB long de test créé : ${outputPath}`);
