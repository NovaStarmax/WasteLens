import React, { useState } from "react";
import { Ic } from "../icons";
import { WASTE_CLASSES, CLASS_LABEL } from "../constants";
import TopBar from "../components/TopBar";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import HistoryRow from "../components/HistoryRow";
import OfflineBanner from "../components/OfflineBanner";


/**
 * Écran principal : capture photo + historique de session.
 *
 * Props:
 *  - agentName : string (affiché en sous-titre de la TopBar)
 *  - history : Prediction[]
 *  - lowConfidenceThreshold : number (par défaut 70)
 *  - offline : boolean
 *  - queueCount : number
 *  - onTakePhoto() / onPickGallery() : actions caméra/galerie
 *  - onSelectPrediction(prediction)
 *  - onRetryQueue() : retry hors-ligne
 *  - onProfile() / onLegal() : icônes TopBar
 *  - showIcons : boolean
 */
export default function PredictHomeScreen({
  agentName = "Agent",
  history = [],
  lowConfidenceThreshold = 70,
  isLoading = false,
  imagePreview = null,
  offline = false,
  queueCount = 0,
  onTakePhoto,
  onPickGallery,
  onSelectPrediction,
  onRetryQueue,
  onProfile,
  onLegal,
  onDemo,
  showIcons = true,
}) {
  const [showDemoSelector, setShowDemoSelector] = useState(false);

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
        title="Scanner"
        subtitle={agentName}
        leftIcon={<Ic.user />}
        rightIcon={<Ic.doc />}
        onLeftClick={onProfile}
        onRightClick={onLegal}
        showIcons={showIcons}
      />

      {offline && (
        <OfflineBanner
          queueCount={queueCount}
          onRetry={onRetryQueue}
          showIcons={showIcons}
        />
      )}

      <div style={{ padding: "4px 20px 20px" }}>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                lineHeight: 1.15,
              }}
            >
              Identifier un déchet
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 6,
                lineHeight: 1.45,
                fontFamily: "var(--font-body)",
              }}
            >
              Cadrez un seul objet, fond uni, bonne lumière.
            </div>
          </div>
          {imagePreview && (
            <div
              style={{
                borderRadius: "var(--radius-btn)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                aspectRatio: "16/9",
              }}
            >
              <img
                src={imagePreview}
                alt="Aperçu"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton
              disabled={isLoading}
              onClick={onTakePhoto}
              showIcons={showIcons}
              leftIcon={<Ic.camera />}
            >
              Prendre une photo
            </PrimaryButton>
            <SecondaryButton
              disabled={isLoading}
              onClick={onPickGallery}
              showIcons={showIcons}
              leftIcon={<Ic.gallery />}
            >
              Choisir dans la galerie
            </SecondaryButton>

            {onDemo && (
              <>
                <SecondaryButton
                  onClick={() => setShowDemoSelector((v) => !v)}
                  showIcons={false}
                >
                  ⚡ Tester avec une image démo
                </SecondaryButton>

                {showDemoSelector && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
                    {WASTE_CLASSES.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => { onDemo(cls); setShowDemoSelector(false); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          border: "1.5px solid var(--border-strong)",
                          borderRadius: "var(--radius-pill)",
                          background: "transparent",
                          color: "var(--text)",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: `var(--cls-${cls})`,
                          flexShrink: 0,
                        }} />
                        {CLASS_LABEL[cls]}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 20px 16px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
          }}
        >
          Cette session
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {history.length} photo{history.length > 1 ? "s" : ""}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "0 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {history.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-btn)",
            }}
          >
            Aucune photo dans cette session.
            <br />
            Démarrez en prenant un cliché.
          </div>
        ) : (
          history.map((p) => (
            <HistoryRow
              key={p.id}
              prediction={p}
              lowConfidence={p.confidence < lowConfidenceThreshold}
              pending={p.pending}
              showIcons={showIcons}
              onClick={
                onSelectPrediction ? () => onSelectPrediction(p) : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
