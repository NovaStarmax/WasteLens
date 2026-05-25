import React from "react";

/**
 * Barre de confiance + valeur numérique.
 * Couleur verte si >= seuil, orange sinon.
 *
 * Props:
 *  - value : 0-100
 *  - lowConfidence : boolean (forçage couleur warn)
 *  - label : libellé au-dessus (par défaut "Confiance")
 */
export default function ConfidenceBar({
  value = 0,
  lowConfidence = false,
  label = "Confiance",
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = lowConfidence ? "var(--warn)" : "var(--success)";
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(clamped)}
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>%</span>
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: "var(--radius-pill)",
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            borderRadius: "var(--radius-pill)",
            background: color,
            transition: "width 0.6s",
          }}
        />
      </div>
    </div>
  );
}
