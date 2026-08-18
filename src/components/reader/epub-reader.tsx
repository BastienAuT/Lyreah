"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Book from "epubjs/types/book";
import type Contents from "epubjs/types/contents";
import type Rendition from "epubjs/types/rendition";
import type { Location } from "epubjs/types/rendition";
import {
  getReaderDocumentThemeCss,
  readerFontFamilies,
  readerPalettes,
  READER_DOCUMENT_THEME_STYLE_ID,
} from "@/reader/document-theme";
import {
  DEFAULT_READER_PREFERENCES,
  parseReaderPreferences,
  READER_PREFERENCES_STORAGE_KEY,
  type ReaderPreferences,
} from "@/reader/preferences";
import { AmbientBackdrop } from "./ambient-backdrop";
import { AmbientAudioPlayer } from "./ambient-audio-player";
import { ReaderAppearancePanel } from "./reader-appearance-panel";

type ReaderAccess = { url: string; expiresIn: number };
type SavedProgress = {
  cfi: string;
  percentageBasisPoints: number;
};
type ProgressResponse = { progress: SavedProgress | null };

function applyReaderDocumentTheme(
  document: Document,
  preferences: ReaderPreferences,
) {
  let style = document.getElementById(
    READER_DOCUMENT_THEME_STYLE_ID,
  ) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = READER_DOCUMENT_THEME_STYLE_ID;
    (document.head ?? document.documentElement).append(style);
  }

  document.documentElement.setAttribute("data-reader-theme", preferences.theme);
  style.textContent = getReaderDocumentThemeCss(preferences);
}

function getCurrentContents(rendition: Rendition) {
  // epub.js returns Contents[] at runtime, although its published type declares Contents.
  const contents = rendition.getContents() as unknown as Contents | Contents[];
  return Array.isArray(contents) ? contents : contents ? [contents] : [];
}

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
      (["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) ||
        element.isContentEditable),
  );
}

function applyReaderPreferences(rendition: Rendition, preferences: ReaderPreferences) {
  const palette = readerPalettes[preferences.theme];
  const font = readerFontFamilies[preferences.font];

  rendition.themes.override("color", palette.text, true);
  rendition.themes.override("font-family", font, true);
  rendition.themes.override("line-height", String(preferences.lineHeight), true);
  rendition.themes.fontSize(`${preferences.fontSize}%`);

  rendition.themes.override("--lyreah-heading-color", palette.heading, true);
  rendition.themes.override("--lyreah-link-color", palette.link, true);
  getCurrentContents(rendition).forEach((contents) =>
    applyReaderDocumentTheme(contents.document, preferences),
  );
}

function typographySignature(preferences: ReaderPreferences) {
  return `${preferences.font}:${preferences.fontSize}:${preferences.lineHeight}`;
}

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
  const preferencesRef = useRef(DEFAULT_READER_PREFERENCES);
  const preferencesLoadedRef = useRef(false);
  const currentCfiRef = useRef<string | null>(null);
  const lastTypographyRef = useRef<string | null>(null);
  const reflowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reflowRequestRef = useRef(0);
  const reflowingRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [chapter, setChapter] = useState("Ouverture du livre");
  const [pageLabel, setPageLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_READER_PREFERENCES);
  const [isReflowing, setIsReflowing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const move = useCallback(async (direction: "previous" | "next") => {
    const rendition = renditionRef.current;
    if (!rendition || reflowingRef.current) return;

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

  useEffect(() => {
    queueMicrotask(() => {
      const restored = parseReaderPreferences(
        window.localStorage.getItem(READER_PREFERENCES_STORAGE_KEY),
      );
      preferencesRef.current = restored;
      preferencesLoadedRef.current = true;
      setPreferences(restored);
    });
  }, []);

  useEffect(() => {
    preferencesRef.current = preferences;
    document.documentElement.dataset.readerTheme = preferences.theme;

    if (preferencesLoadedRef.current) {
      window.localStorage.setItem(
        READER_PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );
    }

    const rendition = renditionRef.current;
    if (rendition) {
      const previousTypography = lastTypographyRef.current;
      const nextTypography = typographySignature(preferences);
      applyReaderPreferences(rendition, preferences);
      lastTypographyRef.current = nextTypography;

      if (
        status === "ready" &&
        previousTypography !== null &&
        previousTypography !== nextTypography
      ) {
        if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
        const requestId = reflowRequestRef.current + 1;
        reflowRequestRef.current = requestId;
        reflowingRef.current = true;
        setIsReflowing(true);
        reflowTimerRef.current = setTimeout(async () => {
          reflowTimerRef.current = null;
          const anchor = currentCfiRef.current;

          try {
            rendition.clear();
            await rendition.display(anchor ?? undefined);
          } catch {
            try {
              await rendition.display();
            } catch {
              if (reflowRequestRef.current === requestId) {
                setError("La mise en page n’a pas pu être recalculée.");
              }
            }
          } finally {
            if (reflowRequestRef.current === requestId) {
              reflowingRef.current = false;
              setIsReflowing(false);
            }
          }
        }, 120);
      }
    }

    return () => {
      delete document.documentElement.dataset.readerTheme;
    };
  }, [preferences, status]);

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
        lastTypographyRef.current = typographySignature(preferencesRef.current);
        rendition.themes.default({
          html: {
            "background-color": "transparent !important",
          },
          body: {
            "background-color": "transparent !important",
            color: "#3f3842",
            "font-family": "Georgia, 'Times New Roman', serif",
            "line-height": "1.75",
            "box-sizing": "border-box",
            "max-width": "680px",
            margin: "0 auto",
            padding: "7% 9% 12%",
          },
          "p, li, blockquote": {
            "font-size": "1em !important",
          },
          p: {
            margin: "0 0 1.15em",
          },
          h1: {
            color: "var(--lyreah-heading-color, #332b31)",
            "font-family": "Georgia, 'Times New Roman', serif",
            "font-size": "2em",
            "font-weight": "600",
            "line-height": "1.15",
            margin: "0 0 1.1em",
          },
          "h2, h3": {
            color: "var(--lyreah-heading-color, #332b31)",
            "font-family": "Georgia, 'Times New Roman', serif",
            "font-weight": "500",
            "line-height": "1.25",
            margin: "1.35em 0 0.7em",
          },
          a: { color: "var(--lyreah-link-color, #665b82)" },
          img: { "max-width": "100%" },
        });
        rendition.hooks.content.register((contents: Contents) => {
          applyReaderDocumentTheme(contents.document, preferencesRef.current);
          contents.document.addEventListener("keydown", (event) => {
            if (isEditableTarget(event.target)) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              void move(event.key === "ArrowLeft" ? "previous" : "next");
            }
          });
        });
        applyReaderPreferences(rendition, preferencesRef.current);

        rendition.on("relocated", (location: Location) => {
          if (disposed) return;

          currentCfiRef.current = location.start.cfi;

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
          viewer.classList.remove("is-page-entering");
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            void viewer.offsetWidth;
            viewer.classList.add("is-page-entering");
          }
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
      if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
      reflowTimerRef.current = null;
      reflowRequestRef.current += 1;
      reflowingRef.current = false;
      saveBeforeLeaving();
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current = null;
      currentCfiRef.current = null;
      lastTypographyRef.current = null;
      viewer?.replaceChildren();
    };
  }, [bookId, move]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (isEditableTarget(target)) return;

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
    <section
      aria-label={`Lecture de ${title}`}
      className="epub-reader"
      data-reader-texture={preferences.texture ? "on" : "off"}
      data-reader-theme={preferences.theme}
    >
      <header className="epub-reader__header">
        <span className="epub-reader__page">{pageLabel || "Lecture"}</span>
        <span className="epub-reader__chapter">{chapter}</span>
        <div className="epub-reader__tools">
          <ReaderAppearancePanel
            disabled={status !== "ready"}
            onChange={setPreferences}
            preferences={preferences}
          />
        </div>
      </header>

      <div className="epub-reader__stage">
        <AmbientBackdrop />
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
            disabled={status !== "ready" || isReflowing || atStart}
            onClick={() => move("previous")}
            type="button"
          >
            <span aria-hidden="true">←</span>
            Page précédente
          </button>
          <button
            disabled={status !== "ready" || isReflowing || atEnd}
            onClick={() => move("next")}
            type="button"
          >
            Page suivante
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div
          className="epub-reader__progress-wrap"
          data-progress-label={`${chapter} · ${Math.round(progress)} %`}
          title={`${chapter} · ${Math.round(progress)} %`}
        >
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
