"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Book from "epubjs/types/book";
import type Rendition from "epubjs/types/rendition";
import type { Location } from "epubjs/types/rendition";
import { AmbientAudioPlayer } from "./ambient-audio-player";

type ReaderAccess = { url: string; expiresIn: number };
type SavedProgress = {
  cfi: string;
  percentageBasisPoints: number;
};
type ProgressResponse = { progress: SavedProgress | null };

async function readApiError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || "Impossible d’ouvrir ce livre.";
}

export function EpubReader({
  bookId,
  title,
}: {
  bookId: string;
  title: string;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [chapter, setChapter] = useState("Ouverture du livre");
  const [pageLabel, setPageLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [fontSize, setFontSize] = useState(108);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const move = useCallback(async (direction: "previous" | "next") => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    try {
      if (direction === "previous") {
        await rendition.prev();
      } else {
        await rendition.next();
      }
    } catch {
      setError("La page suivante n’a pas pu être affichée.");
    }
  }, []);

  const changeFontSize = useCallback((delta: number) => {
    setFontSize((current) => {
      const next = Math.min(140, Math.max(88, current + delta));
      renditionRef.current?.themes.fontSize(`${next}%`);
      return next;
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let latestPosition: SavedProgress | null = null;
    const viewer = viewerRef.current;

    async function savePosition(position: SavedProgress, keepalive = false) {
      if (!keepalive && !disposed) setSaveStatus("saving");

      try {
        const response = await fetch(`/api/reader/books/${bookId}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(position),
          keepalive,
        });

        if (!response.ok) throw new Error("Unable to save reading progress.");
        if (!disposed) setSaveStatus("saved");
      } catch {
        if (!disposed) setSaveStatus("error");
      }
    }

    function scheduleSave(position: SavedProgress) {
      latestPosition = position;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => savePosition(position), 800);
    }

    function saveBeforeLeaving() {
      if (latestPosition) void savePosition(latestPosition, true);
    }

    async function openBook() {
      if (!viewer) return;

      try {
        const [accessResponse, progressResponse] = await Promise.all([
          fetch(`/api/reader/books/${bookId}/access`, { cache: "no-store" }),
          fetch(`/api/reader/books/${bookId}/progress`, { cache: "no-store" }),
        ]);

        if (!accessResponse.ok) {
          throw new Error(await readApiError(accessResponse));
        }

        const access = (await accessResponse.json()) as ReaderAccess;
        const savedProgress = progressResponse.ok
          ? ((await progressResponse.json()) as ProgressResponse).progress
          : null;
        const epubResponse = await fetch(access.url, { cache: "no-store" });

        if (!epubResponse.ok) {
          throw new Error("Le fichier EPUB privé n’est plus accessible.");
        }

        const epubData = await epubResponse.arrayBuffer();
        const { default: ePub } = await import("epubjs");

        if (disposed) return;

        const book = ePub(epubData);
        const rendition = book.renderTo(viewer, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
          allowScriptedContent: false,
        });

        bookRef.current = book;
        renditionRef.current = rendition;
        rendition.themes.default({
          html: {
            "background-color": "#f5eee2 !important",
          },
          body: {
            "background-color": "#f5eee2 !important",
            color: "#3f3842",
            "font-family": "Georgia, 'Times New Roman', serif",
            "line-height": "1.75",
            "box-sizing": "border-box",
            "max-width": "780px",
            margin: "0 auto",
            padding: "5% 8% 10%",
          },
          p: {
            "font-size": "1rem",
            margin: "0 0 1.15em",
          },
          h1: {
            color: "#3f3842",
            "font-family": "Georgia, 'Times New Roman', serif",
            "font-weight": "500",
            "line-height": "1.15",
            margin: "0 0 1.1em",
          },
          "h2, h3": {
            color: "#3f3842",
            "font-family": "Georgia, 'Times New Roman', serif",
            "font-weight": "500",
            "line-height": "1.25",
            margin: "1.35em 0 0.7em",
          },
          a: { color: "#6d6388" },
          img: { "max-width": "100%" },
        });
        rendition.themes.fontSize("108%");

        rendition.on("relocated", (location: Location) => {
          if (disposed) return;

          const current = book.navigation.get(location.start.href);
          const displayedStart = location.start.displayed;
          const displayedEnd = location.end.displayed;
          const isTwoPageSpread =
            location.start.href === location.end.href &&
            displayedEnd.page > displayedStart.page;
          const isWholeChapter =
            displayedStart.page === 1 &&
            displayedEnd.page === displayedEnd.total;
          const spineLength = book.spine.last().index + 1;
          const sectionProgress = displayedEnd.total
            ? displayedEnd.page / displayedEnd.total
            : 0;

          setChapter(current?.label?.trim() || "Lecture");
          setPageLabel(
            displayedStart.total
              ? isWholeChapter
                ? "Chapitre entier"
                : isTwoPageSpread
                ? `Pages ${displayedStart.page}–${displayedEnd.page} sur ${displayedEnd.total}`
                : `Page ${displayedStart.page} sur ${displayedStart.total}`
              : "",
          );
          const percentage = spineLength
            ? Math.min(
                100,
                ((location.end.index + sectionProgress) / spineLength) * 100,
              )
            : 0;

          setProgress(percentage);
          setAtStart(location.atStart);
          setAtEnd(location.atEnd);
          setError("");
          scheduleSave({
            cfi: location.start.cfi,
            percentageBasisPoints: Math.round(percentage * 100),
          });
        });

        if (savedProgress?.cfi) {
          try {
            await rendition.display(savedProgress.cfi);
          } catch {
            await rendition.display();
          }
        } else {
          await rendition.display();
        }

        if (!disposed) {
          setStatus("ready");
        }
      } catch (readerError) {
        if (!disposed) {
          setStatus("error");
          setError(
            readerError instanceof Error
              ? readerError.message
              : "Impossible d’ouvrir ce livre.",
          );
        }
      }
    }

    openBook();
    window.addEventListener("pagehide", saveBeforeLeaving);

    return () => {
      disposed = true;
      window.removeEventListener("pagehide", saveBeforeLeaving);
      if (saveTimer) clearTimeout(saveTimer);
      saveBeforeLeaving();
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current = null;
      viewer?.replaceChildren();
    };
  }, [bookId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move("previous");
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move("next");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <section className="epub-reader" aria-label={`Lecture de ${title}`}>
      <header className="epub-reader__header">
        <span className="epub-reader__page">{pageLabel || "Lecture"}</span>
        <span className="epub-reader__chapter">{chapter}</span>
        <div className="epub-reader__tools">
          <div aria-label="Taille du texte" className="epub-reader__font-controls">
            <button
              aria-label="Réduire la taille du texte"
              disabled={status !== "ready" || fontSize <= 88}
              onClick={() => changeFontSize(-10)}
              type="button"
            >
              A
            </button>
            <span aria-hidden="true">Aa</span>
            <button
              aria-label="Augmenter la taille du texte"
              disabled={status !== "ready" || fontSize >= 140}
              onClick={() => changeFontSize(10)}
              type="button"
            >
              A
            </button>
          </div>
        </div>
      </header>

      <div className="epub-reader__stage">
        <div className="epub-reader__viewer" ref={viewerRef} />
        {status === "loading" ? (
          <div className="epub-reader__notice" role="status">
            <span aria-hidden="true">✦</span>
            <strong>Le livre s’ouvre…</strong>
            <p>Préparation de votre espace de lecture.</p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="epub-reader__notice epub-reader__notice--error" role="alert">
            <strong>Le livre n’a pas pu s’ouvrir.</strong>
            <p>{error}</p>
          </div>
        ) : null}
      </div>

      <footer className="epub-reader__controls">
        <div className="epub-reader__status">
          <AmbientAudioPlayer bookId={bookId} />
        </div>
        <div className="epub-reader__navigation" aria-label="Navigation dans le livre">
          <button
            disabled={status !== "ready" || atStart}
            onClick={() => move("previous")}
            type="button"
          >
            <span aria-hidden="true">←</span>
            Page précédente
          </button>
          <button
            disabled={status !== "ready" || atEnd}
            onClick={() => move("next")}
            type="button"
          >
            Page suivante
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="epub-reader__progress-wrap">
          <span>
            Progression du livre {Math.round(progress)} %
            {saveStatus === "saving" ? " · sauvegarde…" : ""}
            {saveStatus === "saved" ? " · enregistrée" : ""}
            {saveStatus === "error" ? " · non enregistrée" : ""}
          </span>
          <div
            aria-label="Progression du livre"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress)}
            className="epub-reader__progress"
            role="progressbar"
          >
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        {error && status === "ready" ? <strong role="alert">{error}</strong> : null}
      </footer>
    </section>
  );
}
