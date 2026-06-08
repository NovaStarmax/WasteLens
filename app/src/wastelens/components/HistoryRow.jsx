import React, { useState } from "react";
import WastePic from "../WastePic";
import { Ic } from "../icons";
import { CLASS_LABEL } from "../constants";

/**
 * Ligne d'historique : vignette + classe + temps + score.
 *
 * Props:
 *  - prediction : { id, cls, confidence, time, thumbnailUrl? }
 *  - lowConfidence : boolean (affiche pictogramme d'alerte)
 *  - pending : boolean (état "en file d'attente")
 *  - showIcons : boolean
 *  - onClick : () => void
 */
export default function HistoryRow({
  prediction,
  lowConfidence = false,
  pending = false,
  showIcons = true,
  onClick,
}) {
  const { cls, confidence, time, thumbnailUrl } = prediction || {};
  const [imgError, setImgError] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-btn)",
        padding: "10px 12px",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
    >
      {thumbnailUrl && !imgError ? (
        <img
          src={thumbnailUrl}
          alt=""
          style={{
            width: 44,
            height: 44,
            objectFit: "cover",
            borderRadius: "var(--radius-btn)",
            flexShrink: 0,
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <WastePic cls={cls} size={44} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            {CLASS_LABEL[cls] || cls}
          </span>
          {lowConfidence && showIcons && (
            <Ic.warn width={13} height={13} style={{ color: "var(--warn)" }} />
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          {pending
            ? "En attente d'envoi"
            : `${time} · ${Math.round(confidence)}%`}
        </div>
      </div>

      {pending ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--warn)",
            background: "color-mix(in srgb, var(--warn) 18%, transparent)",
            padding: "4px 8px",
            borderRadius: "var(--radius-pill)",
          }}
        >
          file
        </span>
      ) : (
        showIcons && (
          <Ic.chev
            width={16}
            height={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )
      )}
    </button>
  );
}
