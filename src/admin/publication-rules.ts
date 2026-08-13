type PublicationCandidate = {
  processingStatus: "pending" | "processing" | "ready" | "failed";
  epubRenditionPrefix: string | null;
};

export function canPublishBook(book: PublicationCandidate) {
  return (
    book.processingStatus === "ready" &&
    Boolean(book.epubRenditionPrefix?.trim())
  );
}
