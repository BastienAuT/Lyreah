"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || "Impossible de mettre à jour la publication.";
}

export function PublicationControl({
  bookId,
  isPublished,
  canPublish,
}: {
  bookId: string;
  isPublished: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const intent = isPublished ? "unpublish" : "publish";
  const disabled = pending || (!isPublished && !canPublish);

  async function updatePublication() {
    setPending(true);
    setMessage("");
    setStatus("idle");

    try {
      const response = await fetch(`/api/admin/books/${bookId}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setStatus("success");
      setMessage(
        intent === "publish"
          ? "Livre publié dans le catalogue."
          : "Livre retiré du catalogue.",
      );
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour la publication.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-publication-control">
      <button disabled={disabled} onClick={updatePublication} type="button">
        {pending
          ? "Mise à jour…"
          : isPublished
            ? "Dépublier"
            : "Publier"}
      </button>
      {message ? (
        <span className={`admin-publication-message admin-publication-message--${status}`}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
