"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  MAX_AUDIO_FILE_BYTES,
  MAX_SOUNDSCAPE_LAYERS,
} from "@/admin/soundscape-schema";
import type { VisualEffect } from "@/audio/effects";

type BookOption = { id: string; title: string };
type SoundscapeItem = {
  id: string;
  title: string;
  description: string | null;
  attribution: string | null;
  licenseName: string;
  licenseSourceUrl: string | null;
  isActive: boolean;
  bookId: string;
  bookTitle: string;
  isDefault: boolean;
  layerCount: number;
  manifestReady: boolean;
  visualEffect: VisualEffect;
  updatedAt: string;
};
type LayerDraft = { title: string; volume: number };
type PreparedSoundscape = {
  bookId: string;
  isDefault: boolean;
  soundscapeId: string;
  visualEffect: VisualEffect;
  layers: Array<{
    id: string;
    title: string;
    volume: number;
    file: string;
    contentType: string;
    path: string;
    token: string;
  }>;
};

const effectOptions: Array<{ value: VisualEffect; label: string }> = [
  { value: "none", label: "Aucun effet" },
  { value: "fireflies", label: "Clairière nocturne" },
  { value: "rain", label: "Pluie" },
  { value: "dawn", label: "Aube aux oiseaux" },
  { value: "fireplace", label: "Feu de cheminée" },
  { value: "shore", label: "Rive et écume" },
  { value: "train", label: "Train de nuit" },
  { value: "zombies", label: "Nuit des zombies" },
  { value: "lofi", label: "Studio lo-fi" },
  { value: "underwater", label: "Sous l’eau" },
  { value: "submarine", label: "Intérieur de sous-marin" },
  { value: "storm", label: "Orage gothique" },
];

function fileMetadata(file: File) {
  return { name: file.name, size: file.size, type: file.type };
}

function titleFromFile(fileName: string) {
  const title = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : "Couche audio";
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

function SoundscapeCard({ item }: { item: SoundscapeItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/soundscapes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attribution: data.get("attribution"),
          bookId: item.bookId,
          description: data.get("description"),
          isActive: data.get("isActive") === "on",
          isDefault: data.get("isDefault") === "on",
          licenseName: data.get("licenseName"),
          licenseSourceUrl: data.get("licenseSourceUrl"),
          title: data.get("title"),
          visualEffect: data.get("visualEffect"),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setStatus("success");
      setMessage("Ambiance mise à jour.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Mise à jour impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-soundscape-card" onSubmit={save}>
      <div className="admin-soundscape-card__heading">
        <div>
          <span>{item.bookTitle}</span>
          <strong>{item.title}</strong>
        </div>
        <div className="admin-soundscape-badges">
          {item.isDefault ? <span>Par défaut</span> : null}
          <span className={item.isActive ? "is-active" : ""}>
            {item.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>Titre</span>
          <input defaultValue={item.title} maxLength={180} name="title" required />
        </label>
        <label>
          <span>Effet visuel</span>
          <select defaultValue={item.visualEffect} name="visualEffect">
            {effectOptions.map((effect) => (
              <option key={effect.value} value={effect.value}>{effect.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Description</span>
        <textarea defaultValue={item.description || ""} maxLength={600} name="description" rows={2} />
      </label>
      <div className="admin-form-grid">
        <label>
          <span>Attribution</span>
          <input defaultValue={item.attribution || ""} maxLength={240} name="attribution" />
        </label>
        <label>
          <span>Licence</span>
          <input defaultValue={item.licenseName} maxLength={160} name="licenseName" required />
        </label>
        <label>
          <span>Lien de licence</span>
          <input defaultValue={item.licenseSourceUrl || ""} maxLength={500} name="licenseSourceUrl" type="url" />
        </label>
      </div>
      <div className="admin-soundscape-card__footer">
        <div>
          <label className="admin-check-field">
            <input defaultChecked={item.isActive} name="isActive" type="checkbox" />
            <span>Ambiance active</span>
          </label>
          <label className="admin-check-field">
            <input defaultChecked={item.isDefault} name="isDefault" type="checkbox" />
            <span>Par défaut pour ce livre</span>
          </label>
          <small>
            {item.manifestReady
              ? `${item.layerCount} couche${item.layerCount > 1 ? "s" : ""} audio`
              : "Fichiers incomplets"}
          </small>
        </div>
        <button disabled={pending || !item.manifestReady} type="submit">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {message ? (
        <p className={`admin-message admin-message--${status}`} role={status === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function SoundscapeManager({
  books,
  soundscapes,
}: {
  books: BookOption[];
  soundscapes: SoundscapeItem[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [layers, setLayers] = useState<LayerDraft[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []).slice(
      0,
      MAX_SOUNDSCAPE_LAYERS,
    );
    setFiles(selected);
    setLayers(
      selected.map((file) => ({ title: titleFromFile(file.name), volume: 1 })),
    );
  }

  async function createSoundscape(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) {
      setStatus("error");
      setMessage("Choisis au moins un fichier audio.");
      return;
    }
    if (files.some((file) => file.size > MAX_AUDIO_FILE_BYTES)) {
      setStatus("error");
      setMessage("Un fichier dépasse la limite de 40 Mo.");
      return;
    }

    const data = new FormData(event.currentTarget);
    setPending(true);
    setStatus("idle");
    setMessage("Préparation de l’ambiance…");

    try {
      const prepareResponse = await fetch("/api/admin/soundscapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attribution: data.get("attribution"),
          bookId: data.get("bookId"),
          description: data.get("description"),
          files: files.map(fileMetadata),
          isDefault: data.get("isDefault") === "on",
          layers,
          licenseName: data.get("licenseName"),
          licenseSourceUrl: data.get("licenseSourceUrl"),
          title: data.get("title"),
          visualEffect: data.get("visualEffect"),
        }),
      });
      if (!prepareResponse.ok) throw new Error(await readError(prepareResponse));
      const prepared = (await prepareResponse.json()) as PreparedSoundscape;
      const storage = getBrowserStorageClient().storage.from(
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "lyreah",
      );

      setMessage("Envoi sécurisé des pistes audio…");
      const results = await Promise.all(
        prepared.layers.map((layer, index) =>
          storage.uploadToSignedUrl(layer.path, layer.token, files[index]!, {
            contentType: layer.contentType,
          }),
        ),
      );
      const uploadError = results.find((result) => result.error)?.error;
      if (uploadError) throw new Error(`Échec de l’envoi : ${uploadError.message}`);

      setMessage("Vérification et activation…");
      const completeResponse = await fetch(
        `/api/admin/soundscapes/${prepared.soundscapeId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: prepared.bookId,
            isDefault: prepared.isDefault,
            layers: prepared.layers.map(({ id, title, volume, file }) => ({
              id,
              title,
              volume,
              file,
            })),
            visualEffect: prepared.visualEffect,
          }),
        },
      );
      if (!completeResponse.ok) throw new Error(await readError(completeResponse));

      formRef.current?.reset();
      setFiles([]);
      setLayers([]);
      setStatus("success");
      setMessage("Ambiance créée et activée.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-soundscape-manager">
      <form className="admin-import-form" onSubmit={createSoundscape} ref={formRef}>
        <div className="admin-form-grid">
          <label>
            <span>Livre</span>
            <select name="bookId" required>
              <option value="">Choisir un livre</option>
              {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
            </select>
          </label>
          <label>
            <span>Nom de l’ambiance</span>
            <input maxLength={180} name="title" required />
          </label>
          <label>
            <span>Effet visuel</span>
            <select defaultValue="none" name="visualEffect">
              {effectOptions.map((effect) => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>Description</span>
          <textarea maxLength={600} name="description" rows={3} />
        </label>
        <div className="admin-form-grid">
          <label>
            <span>Attribution</span>
            <input maxLength={240} name="attribution" />
          </label>
          <label>
            <span>Licence</span>
            <input defaultValue="Création originale" maxLength={160} name="licenseName" required />
          </label>
          <label>
            <span>Lien de licence</span>
            <input maxLength={500} name="licenseSourceUrl" type="url" />
          </label>
        </div>
        <label className="admin-file-field">
          <span>Pistes audio</span>
          <input
            accept=".mp3,.m4a,.ogg,.wav,audio/mpeg,audio/mp4,audio/ogg,audio/wav"
            multiple
            onChange={chooseFiles}
            type="file"
          />
          <small>1 à {MAX_SOUNDSCAPE_LAYERS} pistes · 40 Mo maximum par fichier</small>
        </label>

        {layers.length ? (
          <div className="admin-audio-layers">
            {layers.map((layer, index) => (
              <div key={`${files[index]?.name}-${index}`}>
                <span>{files[index]?.name}</span>
                <label>
                  <span>Titre de la couche</span>
                  <input
                    maxLength={100}
                    onChange={(event) =>
                      setLayers((current) => current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: event.target.value } : item,
                      ))
                    }
                    required
                    value={layer.title}
                  />
                </label>
                <label>
                  <span>Volume {Math.round(layer.volume * 100)} %</span>
                  <input
                    max="1"
                    min="0"
                    onChange={(event) =>
                      setLayers((current) => current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, volume: Number(event.target.value) }
                          : item,
                      ))
                    }
                    step="0.05"
                    type="range"
                    value={layer.volume}
                  />
                </label>
              </div>
            ))}
          </div>
        ) : null}

        <div className="admin-submit-row">
          <label className="admin-check-field">
            <input name="isDefault" type="checkbox" />
            <span>Définir comme ambiance par défaut</span>
          </label>
          <button className="button button--primary" disabled={pending || !books.length}>
            {pending ? "Création…" : "Créer l’ambiance"}
          </button>
          {message ? (
            <p className={`admin-message admin-message--${status}`} role={status === "error" ? "alert" : "status"}>
              {message}
            </p>
          ) : null}
        </div>
      </form>

      <div className="admin-soundscape-list">
        {soundscapes.length ? (
          soundscapes.map((item) => (
            <SoundscapeCard item={item} key={`${item.id}-${item.updatedAt}`} />
          ))
        ) : (
          <p className="admin-empty">Aucune ambiance configurée.</p>
        )}
      </div>
    </div>
  );
}
