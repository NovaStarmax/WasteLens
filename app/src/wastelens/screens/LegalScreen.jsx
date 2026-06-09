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
    title: "Responsable du traitement",
    description:
      "Antoine Gobbe — agobbe@marseille-tourisme.com · " +
      "Office de Tourisme et des Congrès de Marseille.",
  },
  {
    title: "Données collectées",
    description:
      "Nom d'utilisateur et historique des prédictions (classe détectée, " +
      "score de confiance, horodatage). Aucune image n'est stockée — " +
      "traitement en mémoire uniquement.",
  },
  {
    title: "Finalité du traitement",
    description:
      "Authentification des utilisateurs et traçabilité des prédictions " +
      "IA. Base légale : consentement (connexion volontaire à l'application).",
  },
  {
    title: "Durée de conservation",
    description:
      "Les données sont conservées jusqu'à la suppression du compte " +
      "par l'administrateur. Aucune suppression automatique.",
  },
  {
    title: "Cookies et stockage local",
    description:
      "L'application utilise uniquement le localStorage du navigateur " +
      "pour stocker le token d'authentification JWT. " +
      "Aucun cookie de tracking ou de publicité n'est utilisé.",
  },
  {
    title: "Vos droits (RGPD)",
    description:
      "Vous disposez d'un droit d'accès, de rectification et de suppression " +
      "de vos données. Pour exercer ces droits, contactez : " +
      "agobbe@marseille-tourisme.com. Réponse sous 30 jours.",
  },
  {
    title: "Hébergement",
    description:
      "OVHcloud · 2 rue Kellermann, 59100 Roubaix, France. " +
      "Serveurs localisés dans l'Union Européenne. " +
      "Aucune sous-traitance hors UE.",
  },
  {
    title: "Mentions légales",
    description:
      "Éditeur : Antoine Gobbe. Application développée dans le cadre " +
      "d'une formation Développeur en Intelligence Artificielle (RNCP). " +
      "Propriété intellectuelle réservée.",
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
    </button>
  );
}
