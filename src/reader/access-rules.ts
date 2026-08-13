type ReadableBookCandidate = {
  publishedAt: Date | null;
  processingStatus: "pending" | "processing" | "ready" | "failed";
  epubMasterObjectKey: string | null;
  epubRenditionPrefix: string | null;
};

export function canReadBook(book: ReadableBookCandidate) {
  return (
    Boolean(book.publishedAt) &&
    book.processingStatus === "ready" &&
    Boolean(book.epubMasterObjectKey?.trim()) &&
    Boolean(book.epubRenditionPrefix?.trim())
  );
}
