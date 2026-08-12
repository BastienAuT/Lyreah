import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";

const outputDirectory = join(process.cwd(), "tmp");
const outputPath = join(outputDirectory, "lyreah-test.epub");
const archive = new JSZip();

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
    <dc:identifier id="book-id">urn:uuid:28dff831-e4c9-4a25-a0bc-88273181413a</dc:identifier>
    <dc:title>La Nuit des lucioles</dc:title>
    <dc:creator>Atelier Lyreah</dc:creator>
    <dc:language>fr</dc:language>
    <meta property="dcterms:modified">2026-08-12T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="chapter"/>
  </spine>
</package>`,
);
archive.file(
  "EPUB/nav.xhtml",
  `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="fr">
  <head><title>Sommaire</title></head>
  <body><nav epub:type="toc"><ol><li><a href="chapter.xhtml">La clairière</a></li></ol></nav></body>
</html>`,
);
archive.file(
  "EPUB/chapter.xhtml",
  `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
  <head><title>La clairière</title><link rel="stylesheet" href="styles.css"/></head>
  <body>
    <h1>La clairière</h1>
    <p>À la tombée du soir, les premières lucioles s’allumèrent entre les fougères.</p>
    <p>Élise suivit leur lumière jusqu’au vieux chêne, là où les histoires attendaient qu’on les écoute.</p>
  </body>
</html>`,
);
archive.file(
  "EPUB/styles.css",
  "body { font-family: serif; line-height: 1.7; } h1 { font-weight: 500; }",
);

await mkdir(outputDirectory, { recursive: true });
const epub = await archive.generateAsync({
  type: "uint8array",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});
await Bun.write(outputPath, epub);

console.log(`EPUB de test créé : ${outputPath}`);
