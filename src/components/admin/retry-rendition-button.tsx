"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || "Impossible de relancer la préparation.";
}

export function RetryRenditionButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/imports/${bookId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      router.refresh();
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Impossible de relancer la préparation.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-retry">
      <button disabled={pending} onClick={retry} type="button">
        {pending ? "Relance…" : "Relancer"}
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
