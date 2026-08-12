"use client";

import { createClient } from "@supabase/supabase-js";
import { useRef, useState } from "react";
import {
  MAX_COVER_BYTES,
  MAX_EPUB_BYTES,
  slugify,
} from "@/admin/import-schema";

type SignedUpload = { path: string; token: string };

type PreparedImport = {
  bookId: string;
  uploads: { epub: SignedUpload; cover: SignedUpload | null };
};

function fileMetadata(file: File) {
  return { name: file.name, size: file.size, type: file.type };
}

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || "Une erreur inattendue est survenue.";
}

function getBrowserStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Les variables publiques Supabase ne sont pas configurées.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function BookImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Préparation de l’import…");

    const form = event.currentTarget;
    const data = new FormData(form);
    const epub = data.get("epub");
    const cover = data.get("cover");

    if (!(epub instanceof File) || epub.size === 0) {
      setStatus("error");
      setMessage("Choisis un fichier EPUB.");
      return;
    }

    const coverFile = cover instanceof File && cover.size > 0 ? cover : null;

    if (epub.size > MAX_EPUB_BYTES) {
      setStatus("error");
      setMessage("Le fichier EPUB dépasse la limite de 6 Mo.");
      return;
    }

    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      setStatus("error");
      setMessage("La couverture dépasse la limite de 4 Mo.");
      return;
    }
    const categories = String(data.get("categories"))
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean);
    const year = String(data.get("publicationYear")).trim();

    try {
      const prepareResponse = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          authorName: data.get("authorName"),
          synopsis: data.get("synopsis"),
          language: data.get("language"),
          publicationYear: year ? Number(year) : null,
          categories,
          rightsStatus: data.get("rightsStatus"),
          rightsStatement: data.get("rightsStatement"),
          sourceUrl: data.get("sourceUrl"),
          epub: fileMetadata(epub),
          cover: coverFile ? fileMetadata(coverFile) : null,
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error(await readError(prepareResponse));
      }

      const prepared = (await prepareResponse.json()) as PreparedImport;
      const storage = getBrowserStorageClient().storage.from(
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "lyreah",
      );

      setMessage("Envoi sécurisé des fichiers vers Supabase…");
      const uploads = [
        storage.uploadToSignedUrl(
          prepared.uploads.epub.path,
          prepared.uploads.epub.token,
          epub,
          { contentType: "application/epub+zip" },
        ),
      ];

      if (coverFile && prepared.uploads.cover) {
        uploads.push(
          storage.uploadToSignedUrl(
            prepared.uploads.cover.path,
            prepared.uploads.cover.token,
            coverFile,
            { contentType: coverFile.type },
          ),
        );
      }

      const uploadResults = await Promise.all(uploads);
      const uploadError = uploadResults.find((result) => result.error)?.error;

      if (uploadError) {
        throw new Error(`Échec de l’envoi : ${uploadError.message}`);
      }

      setMessage("Vérification de l’import…");
      const completeResponse = await fetch(
        `/api/admin/imports/${prepared.bookId}/complete`,
        { method: "POST" },
      );

      if (!completeResponse.ok) {
        throw new Error(await readError(completeResponse));
      }

      formRef.current?.reset();
      setSlugTouched(false);
      setStatus("success");
      setMessage("Livre importé. Sa préparation EPUB a démarré.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "L’import a échoué.");
    }
  }

  return (
    <form className="admin-import-form" ref={formRef} onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label>
          <span>Titre</span>
          <input
            name="title"
            required
            maxLength={180}
            onChange={(event) => {
              if (!slugTouched && formRef.current) {
                const slugInput = formRef.current.elements.namedItem("slug");
                if (slugInput instanceof HTMLInputElement) {
                  slugInput.value = slugify(event.target.value);
                }
              }
            }}
          />
        </label>
        <label>
          <span>Adresse du livre</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            onChange={() => setSlugTouched(true)}
          />
        </label>
        <label>
          <span>Auteur</span>
          <input name="authorName" required maxLength={140} />
        </label>
        <label>
          <span>Catégories</span>
          <input name="categories" required placeholder="Fantastique, Aventure" />
        </label>
        <label>
          <span>Langue</span>
          <input name="language" required defaultValue="fr" maxLength={12} />
        </label>
        <label>
          <span>Année de publication</span>
          <input name="publicationYear" type="number" min="0" max="2100" />
        </label>
      </div>

      <label>
        <span>Synopsis</span>
        <textarea name="synopsis" required minLength={20} maxLength={5000} rows={6} />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>Statut des droits</span>
          <select name="rightsStatus" defaultValue="public_domain">
            <option value="public_domain">Domaine public</option>
            <option value="licensed">Sous licence</option>
          </select>
        </label>
        <label>
          <span>Source officielle</span>
          <input name="sourceUrl" type="url" required placeholder="https://…" />
        </label>
      </div>

      <label>
        <span>Justification des droits</span>
        <textarea
          name="rightsStatement"
          required
          rows={3}
          placeholder="Œuvre du domaine public, source et édition utilisées…"
        />
      </label>

      <div className="admin-file-grid">
        <label className="admin-file-field">
          <span>Fichier EPUB</span>
          <input name="epub" type="file" accept=".epub,application/epub+zip" required />
          <small>6 Mo maximum · conservé dans le bucket privé</small>
        </label>
        <label className="admin-file-field">
          <span>Couverture (facultative)</span>
          <input name="cover" type="file" accept="image/avif,image/jpeg,image/png,image/webp" />
          <small>AVIF, JPEG, PNG ou WebP · 4 Mo maximum</small>
        </label>
      </div>

      <div className="admin-submit-row">
        <button className="button button--primary" disabled={status === "loading"}>
          {status === "loading" ? "Import en cours…" : "Importer le livre"}
        </button>
        {message ? <p className={`admin-message admin-message--${status}`}>{message}</p> : null}
      </div>

    </form>
  );
}
