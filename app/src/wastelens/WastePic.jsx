import React from "react";

/**
 * Vignette colorée par classe de déchet.
 * Fond = couleur sémantique de la classe, shape blanche minimaliste.
 *
 * @param {object} props
 * @param {"cardboard"|"glass"|"metal"|"paper"|"plastic"|"trash"} props.cls
 * @param {number} props.size  taille en px (par défaut 56)
 * @param {string|number} [props.radius]  override du border-radius (par défaut var(--radius-btn))
 */
export default function WastePic({ cls = "trash", size = 56, radius }) {
  const r = radius != null ? radius : "var(--radius-btn)";
  const stroke = {
    fill: "none",
    stroke: "rgba(255,255,255,0.9)",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const shapes = {
    cardboard: (
      <g {...stroke}>
        <path d="M12 18 L28 12 L44 18 L28 24 Z" />
        <path d="M12 18 V40 L28 46" />
        <path d="M44 18 V40 L28 46" />
        <path d="M28 24 V46" />
      </g>
    ),
    glass: (
      <g {...stroke}>
        <path d="M22 10 H34 V18 C34 22 36 24 36 30 V42 C36 44 34 46 32 46 H24 C22 46 20 44 20 42 V30 C20 24 22 22 22 18 Z" />
        <path d="M22 18 H34" />
      </g>
    ),
    metal: (
      <g {...stroke}>
        <rect x="18" y="12" width="20" height="32" rx="3" />
        <path d="M18 18 H38" />
        <path d="M22 26 H34" />
        <path d="M22 32 H30" />
      </g>
    ),
    paper: (
      <g {...stroke}>
        <path d="M14 10 H38 L42 14 V46 H14 Z" />
        <path d="M38 10 V14 H42" />
        <path d="M20 22 H36" />
        <path d="M20 28 H36" />
        <path d="M20 34 H30" />
      </g>
    ),
    plastic: (
      <g {...stroke}>
        <path d="M24 8 H32 V14 H34 L36 18 V26 C38 28 38 34 36 36 V44 C36 46 34 46 32 46 H24 C22 46 20 46 20 44 V36 C18 34 18 28 20 26 V18 L22 14 H24 Z" />
        <path d="M22 26 H34" />
      </g>
    ),
    trash: (
      <g {...stroke}>
        <path d="M12 16 H44 L40 46 H16 Z" />
        <path d="M20 16 V12 H36 V16" />
        <path d="M22 22 V40" />
        <path d="M28 22 V40" />
        <path d="M34 22 V40" />
      </g>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      style={{
        display: "block",
        borderRadius: r,
        background: `var(--cls-${cls})`,
      }}
    >
      {shapes[cls] || shapes.trash}
    </svg>
  );
}
