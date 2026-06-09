import React, { useState } from "react";
import { Ic } from "../icons";
import Field from "../components/Field";
import { PrimaryButton } from "../components/Button";

/**
 * Écran de connexion WasteLens.
 *
 * Props:
 *  - onSubmit(email, password)
 *  - onForgotPassword()
 *  - loading : boolean
 *  - error : string | null
 *  - showIcons : boolean
 */
export default function LoginScreen({
  onSubmit,
  onForgotPassword,
  loading = false,
  error = null,
  showIcons = true,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (onSubmit) onSubmit(email, password);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "24px 24px 32px",
        background: "var(--bg)",
        minHeight: "100%",
      }}
    >
      {/* Marque */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
          paddingTop: 32,
        }}
      >
        <img src="/favicon.png" alt="WasteLens" style={{ width: 64, height: 64, marginBottom: 16 }} />
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              lineHeight: 1.05,
            }}
          >
            WasteLens
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginTop: 6,
              fontFamily: "var(--font-body)",
              maxWidth: 280,
              lineHeight: 1.45,
            }}
          >
            Identification des déchets pour les équipes de collecte.
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 48,
        }}
      >
        <Field
          label="Nom d’utilisateur"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="agent@structure.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Mot de passe"
          name="password"
          type={revealed ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          rightAdornment={
            showIcons ? (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={
                  revealed
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
              >
                <Ic.eye width={18} height={18} />
              </button>
            ) : null
          }
        />
        <button
          type="button"
          onClick={onForgotPassword}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            padding: "4px 0",
            color: "var(--text-muted)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            textDecoration: "underline",
            whiteSpace: "nowrap",
          }}
        >
          Mot de passe oublié ?
        </button>

        {error ? (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: "var(--danger)",
              background: "color-mix(in srgb, var(--danger) 10%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              padding: "8px 10px",
              borderRadius: "var(--radius-btn)",
              fontFamily: "var(--font-body)",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 24,
        }}
      >
        <PrimaryButton type="submit" disabled={loading} showIcons={showIcons}>
          {loading ? "Connexion…" : "Se connecter"}
        </PrimaryButton>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
            padding: "0 16px",
            fontFamily: "var(--font-body)",
          }}
        >
          En vous connectant, vous acceptez la{" "}
          <u>politique de confidentialité</u> et les <u>mentions légales</u>.
        </div>
      </div>
    </form>
  );
}
