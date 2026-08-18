import { expect, type Page } from "@playwright/test";
import JSZip from "jszip";

export const readerState = process.env.E2E_READER_STORAGE_STATE;
export const adminState = process.env.E2E_ADMIN_STORAGE_STATE;

export async function expectReaderReady(page: Page) {
  await expect(page.getByText("Le livre s’ouvre…")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Page suivante" })).toBeEnabled();
}

export async function createMinimalEpub() {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
  );
  zip.file(
    "EPUB/package.opf",
    '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">lyreah-e2e</dc:identifier><dc:title>Recette E2E</dc:title><dc:language>fr</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>',
  );
  zip.file(
    "EPUB/nav.xhtml",
    '<html xmlns="http://www.w3.org/1999/xhtml"><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol><li><a href="chapter.xhtml">Chapitre</a></li></ol></nav></body></html>',
  );
  zip.file(
    "EPUB/chapter.xhtml",
    '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapitre de recette</h1><p>Un contenu assez long pour vérifier le parcours d’import administrateur.</p></body></html>',
  );
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}
