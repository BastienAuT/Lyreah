import type { CSSProperties } from "react";

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

  return (
    <div className={`catalog-cover catalog-cover--${size}`} style={style} aria-label={`Couverture de ${title}`}>
      <span className="catalog-cover__ornament" aria-hidden="true" />
      <strong>{title}</strong>
      <span>{author}</span>
    </div>
  );
}
