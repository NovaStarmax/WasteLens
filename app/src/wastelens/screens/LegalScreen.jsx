import React from "react";
import { Ic } from "../icons";
import TopBar from "../components/TopBar";

/**
 * Section légale individuelle.
 * @typedef {Object} LegalSection
 * @property {string} title
 * @property {string} description
 * @property {() => void} [onClick]
 */

/**
 * Sections affichées par défaut si la prop `sections` n'est pas fournie.
 */
export const DEFAULT_LEGAL_SECTIONS = [
  {
    title: "Traitement par IA",
    description:
      "Modèle ResNet18 hébergé en France. Photos analysées en mémoire, aucune image n'est stockée par défaut.",
  },
  {
    title: "Hébergement",
    description:
      "OVHcloud Roubaix · serveurs UE. Aucune sous-traitance hors UE.",
  },
  {
    title: "Vos droits",
    description:
      "Accès, rectification, suppression et opposition. Réponse sous 30 jours.",
  },
  {
    title: "Contact DPO",
    description: "dpo@structure.fr · 04 91 00 00 00",
  },
  {
    title: "Mentions légales",
    description: "Éditeur, hébergeur, propriété intellectuelle.",
  },
];

/**
 * Écran Mentions légales / RGPD.
 *
 * Props:
 *  - sections : LegalSection[]
 *  - heroTitle, heroDesc : contenu du bandeau primaire
 *  - onBack()
 *  - showIcons : boolean
 */
export default function LegalScreen({
  sections = DEFAULT_LEGAL_SECTIONS,
  heroTitle = "Vos données, votre contrôle",
  heroDesc = "Conformément au RGPD, voici comment WasteLens traite vos photos et identifiants.",
  onBack,
  showIcons = true,
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        minHeight: "100%",
      }}
    >
      <TopBar
        title="Mentions légales"
        leftIcon={<Ic.back />}
        onLeftClick={onBack}
        showIcons={showIcons}
      />

      <div
        style={{
          flex: 1,
          padding: "0 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            background: "var(--primary)",
            color: "var(--primary-ink)",
            borderRadius: "var(--radius-card)",
            padding: "18px 18px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          {showIcons && (
            <Ic.shield
              width={22}
              height={22}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
          )}
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {heroTitle}
            </div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.85,
                marginTop: 6,
                lineHeight: 1.5,
                fontFamily: "var(--font-body)",
              }}
            >
              {heroDesc}
            </div>
          </div>
        </div>

        {sections.map((s, i) => (
          <LegalItem
            key={i}
            title={s.title}
            desc={s.description}
            onClick={s.onClick}
            showIcons={showIcons}
          />
        ))}
      </div>
    </div>
  );
}

function LegalItem({ title, desc, onClick, showIcons }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-btn)",
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "var(--font-body)",
        color: "var(--text)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 3,
            lineHeight: 1.45,
          }}
        >
          {desc}
        </div>
      </div>
      {showIcons && (
        <Ic.chev
          width={16}
          height={16}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
      )}
    </button>
  );
}
