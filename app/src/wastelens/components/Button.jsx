import React from "react";

/**
 * Bouton primaire pleine largeur — couleur primaire (marine).
 *
 * Props:
 *  - children : libellé
 *  - leftIcon : élément React (icon) optionnel
 *  - showIcons : boolean, par défaut true
 *  - disabled : boolean
 *  - onClick
 *  - type : 'button' | 'submit' (défaut 'button')
 *  - style : surcharge inline
 */
export function PrimaryButton({
  children,
  leftIcon,
  showIcons = true,
  disabled = false,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        height: 56,
        border: "none",
        borderRadius: "var(--radius-btn)",
        background: "var(--primary)",
        color: "var(--primary-ink)",
        fontFamily: "var(--font-body)",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
        padding: "0 16px",
        ...style,
      }}
      {...rest}
    >
      {showIcons && leftIcon
        ? React.cloneElement(leftIcon, { width: 20, height: 20 })
        : null}
      {children}
    </button>
  );
}

/**
 * Bouton secondaire — bordure forte, fond transparent.
 */
export function SecondaryButton({
  children,
  leftIcon,
  showIcons = true,
  disabled = false,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        height: 56,
        borderRadius: "var(--radius-btn)",
        background: "transparent",
        border: "1.5px solid var(--border-strong)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
        padding: "0 16px",
        ...style,
      }}
      {...rest}
    >
      {showIcons && leftIcon
        ? React.cloneElement(leftIcon, { width: 20, height: 20 })
        : null}
      {children}
    </button>
  );
}
