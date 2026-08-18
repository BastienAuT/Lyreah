type PublicationCandidate = {
  language: string;
  processingStatus: "pending" | "processing" | "ready" | "failed";
  epubRenditionPrefix: string | null;
};

export function canPublishBook(book: PublicationCandidate) {
  return (
    book.processingStatus === "ready" &&
    book.language === "fr" &&
    Boolean(book.epubRenditionPrefix?.trim())
  );
}
