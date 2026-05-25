import React from "react";
import { Ic } from "../icons";

/**
 * Bandeau hors-ligne avec compteur de file d'attente et bouton retry.
 *
 * Props:
 *  - queueCount : nombre de photos en attente
 *  - showIcons : boolean
 *  - onRetry : () => void
 */
export default function OfflineBanner({
  queueCount = 0,
  showIcons = true,
  onRetry,
}) {
  return (
    <div
      role="status"
      style={{
        margin: "0 20px 12px",
        padding: "10px 12px",
        background: "color-mix(in srgb, var(--warn) 18%, var(--surface))",
        border: "1px solid color-mix(in srgb, var(--warn) 40%, transparent)",
        borderRadius: "var(--radius-btn)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
    >
      {showIcons && (
        <Ic.offline
          width={18}
          height={18}
          style={{ color: "var(--warn)", flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
          Hors-ligne
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            marginTop: 1,
            lineHeight: 1.3,
          }}
        >
          {queueCount} photo{queueCount > 1 ? "s" : ""} en attente · envoi auto
          au retour.
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          height: 30,
          padding: "0 12px",
          border: "1px solid var(--border-strong)",
          background: "transparent",
          color: "var(--text)",
          borderRadius: "var(--radius-btn)",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
        }}
      >
        {showIcons && <Ic.retry width={13} height={13} />}
        Réessayer
      </button>
    </div>
  );
}
