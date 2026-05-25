import React from "react";

/**
 * Barre supérieure d'écran : titre central, sous-titre, icônes G/D.
 *
 * Props:
 *  - title, subtitle
 *  - leftIcon, rightIcon : éléments React (icones)
 *  - onLeftClick, onRightClick
 *  - showIcons : boolean (par défaut true)
 */
export default function TopBar({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftClick,
  onRightClick,
  showIcons = true,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 14px",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onLeftClick}
        aria-label="back"
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          cursor: onLeftClick ? "pointer" : "default",
          padding: 0,
        }}
      >
        {showIcons && leftIcon
          ? React.cloneElement(leftIcon, { width: 22, height: 22 })
          : null}
      </button>

      <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 1,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRightClick}
        aria-label="action"
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          cursor: onRightClick ? "pointer" : "default",
          padding: 0,
        }}
      >
        {showIcons && rightIcon
          ? React.cloneElement(rightIcon, { width: 22, height: 22 })
          : null}
      </button>
    </div>
  );
}
