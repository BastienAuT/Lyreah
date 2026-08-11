import Image from "next/image";
import type { CSSProperties } from "react";
import { getCatalogCoverPath } from "@/catalog/cover-assets";

function hueFromSlug(slug: string) {
  return [...slug].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
}

export function BookCover({
  title,
  author,
  slug,
  size = "card",
}: {
  title: string;
  author: string;
  slug: string;
  size?: "card" | "detail";
}) {
  const style = { "--catalog-cover-hue": hueFromSlug(slug) } as CSSProperties;
  const coverPath = getCatalogCoverPath(slug);

  return (
    <div
      className={`catalog-cover catalog-cover--${size}${coverPath ? " catalog-cover--image" : ""}`}
      style={style}
      aria-label={coverPath ? undefined : `Couverture de ${title}`}
    >
      {coverPath ? (
        <Image
          className="catalog-cover__image"
          src={coverPath}
          alt={`Couverture de ${title}`}
          fill
          sizes={size === "detail" ? "(max-width: 760px) 100vw, 390px" : "(max-width: 480px) 100vw, (max-width: 760px) 50vw, 30vw"}
        />
      ) : (
        <>
          <span className="catalog-cover__ornament" aria-hidden="true" />
          <strong>{title}</strong>
          <span>{author}</span>
        </>
      )}
    </div>
  );
}
