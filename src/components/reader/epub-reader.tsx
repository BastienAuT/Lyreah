"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Book from "epubjs/types/book";
import type Rendition from "epubjs/types/rendition";
import type { Location } from "epubjs/types/rendition";

type ReaderAccess = { url: string; expiresIn: number };

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
    const viewer = viewerRef.current;

    async function openBook() {
      if (!viewer) return;

      try {
        const accessResponse = await fetch(`/api/reader/books/${bookId}/access`, {
          cache: "no-store",
        });

        if (!accessResponse.ok) {
          throw new Error(await readApiError(accessResponse));
        }

        const access = (await accessResponse.json()) as ReaderAccess;
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
          spread: "auto",
          minSpreadWidth: 960,
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
            margin: "0",
            padding: "5% 8% 10%",
          },
          p: {
            "font-size": "1rem",
            "margin-bottom": "1.15em",
          },
          "h1, h2, h3": {
            color: "#3f3842",
            "font-family": "Georgia, 'Times New Roman', serif",
            "font-weight": "500",
          },
          a: { color: "#6d6388" },
          img: { "max-width": "100%" },
        });
        rendition.themes.fontSize("108%");

        rendition.on("relocated", (location: Location) => {
          if (disposed) return;

          const current = book.navigation.get(location.start.href);
          const displayed = location.start.displayed;

          setChapter(current?.label?.trim() || "Lecture");
          setPageLabel(
            displayed?.total
              ? `Page ${displayed.page} sur ${displayed.total}`
              : "",
          );
          setProgress(
            displayed?.total
              ? Math.min(100, (displayed.page / displayed.total) * 100)
              : 0,
          );
          setAtStart(location.atStart);
          setAtEnd(location.atEnd);
          setError("");
        });

        await rendition.display();

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

    return () => {
      disposed = true;
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
        <span>{pageLabel || "Lecture en cours"}</span>
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
          <div className="epub-reader__progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        {error && status === "ready" ? <strong role="alert">{error}</strong> : null}
      </footer>
    </section>
  );
}
