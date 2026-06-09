import React, { useState } from "react";

/**
 * Champ de formulaire libellé (label en haut, input dans une surface).
 *
 * Props:
 *  - label, placeholder, type (text/email/password…), name, value, defaultValue
 *  - onChange : (event) => void
 *  - rightAdornment : élément React affiché à droite (icone, bouton show/hide…)
 *  - autoComplete, required, disabled
 */
export default function Field({
  label,
  placeholder,
  type = "text",
  name,
  value,
  defaultValue,
  onChange,
  rightAdornment,
  autoComplete,
  required,
  disabled,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 52,
          background: "var(--surface)",
          border: `1.5px solid ${focused ? "var(--primary)" : "var(--border)"}`,
          borderRadius: "var(--radius-btn)",
          padding: "0 14px",
          gap: 8,
        }}
      >
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--text)",
            minWidth: 0,
          }}
          {...rest}
        />
        {rightAdornment ? (
          <span style={{ color: "var(--text-muted)", display: "flex" }}>
            {rightAdornment}
          </span>
        ) : null}
      </div>
    </label>
  );
}
