import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Ic } from "../icons";
import TopBar from "../components/TopBar";
import { PrimaryButton } from "../components/Button";
import ConfidenceBar from "../components/ConfidenceBar";
import WastePic from "../WastePic";
import { CLASS_LABEL, CLASS_BIN, DEFAULT_LOW_CONFIDENCE } from "../constants";

/**
 * Écran de résultat : pastille colorée + score + reco de tri.
 *
 * Props:
 *  - prediction : { cls, confidence, time?, fileName? }
 *  - imageUrl : url de la photo (sinon WastePic est utilisée comme thumb)
 *  - lowConfidenceThreshold : number (défaut 70)
 *  - onBack() / onHistory() / onNewPhoto()
 *  - showIcons : boolean
 */
export default function ResultScreen({
  prediction,
  imageUrl,
  lowConfidenceThreshold = DEFAULT_LOW_CONFIDENCE,
  onBack,
  onHistory,
  onNewPhoto,
  showIcons = true,
}) {
  const [imageOpen, setImageOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!prediction) return null;
  const { cls, confidence, time, fileName } = prediction;
  const lowConf = confidence < lowConfidenceThreshold;
  const cb = CLASS_BIN[cls] || { bin: "—", tip: "" };
  const label = CLASS_LABEL[cls] || cls;

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
        title="Résultat"
        subtitle={lowConf ? "À vérifier" : "Identifié avec succès"}
        leftIcon={<Ic.back />}
        rightIcon={<Ic.history />}
        onLeftClick={onBack}
        onRightClick={onHistory}
        showIcons={showIcons}
      />

      {/* Bandeau photo + métadata */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-btn)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {imageUrl && !imageError ? (
            <Dialog.Root open={imageOpen} onOpenChange={setImageOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  style={{
                    width: "100%", height: "100%", padding: 0,
                    border: "none", background: "none",
                    cursor: "zoom-in", display: "block",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setImageError(true)}
                  />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay
                  style={{
                    position: "fixed", inset: 0, zIndex: 200,
                    background: "rgba(0,0,0,0.92)",
                  }}
                />
                <Dialog.Content
                  aria-describedby={undefined}
                  style={{
                    position: "fixed", inset: 0, zIndex: 201,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Dialog.Title style={{ display: "none" }}>Image en plein écran</Dialog.Title>
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ maxWidth: "100vw", maxHeight: "100dvh", objectFit: "contain", display: "block" }}
                  />
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      style={{
                        position: "fixed", top: 16, right: 16,
                        width: 40, height: 40, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", backdropFilter: "blur(4px)",
                      }}
                    >
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : (
            <WastePic cls={cls} size={56} radius={0} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Photo {time ? `· ${time}` : ""}
          </div>
          {fileName ? (
            <div
              style={{
                fontSize: 13,
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                marginTop: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {fileName}
            </div>
          ) : null}
        </div>
      </div>

      {/* Grande pastille */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 24px 12px",
        }}
      >
        <div
          style={{
            width: 236,
            height: 236,
            borderRadius: "50%",
            background: `var(--cls-${cls})`,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: `0 18px 50px color-mix(in srgb, var(--cls-${cls}) 35%, transparent)`,
          }}
        >
          {showIcons && <WastePic cls={cls} size={64} radius={0} />}
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 42,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginTop: showIcons ? 14 : 0,
            }}
          >
            {label}
          </div>
          {lowConf && (
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 9px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(4px)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "var(--font-body)",
              }}
            >
              {showIcons && <Ic.warn width={11} height={11} />}
              à vérifier
            </div>
          )}
        </div>

        <div style={{ width: "100%", maxWidth: 300, marginTop: 24 }}>
          <ConfidenceBar value={confidence} lowConfidence={lowConf} />
        </div>
      </div>

      {/* Reco de tri */}
      <div style={{ padding: "0 20px 16px" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "var(--shadow-card)",
          }}
        >
          {showIcons && (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-btn)",
                background: "var(--primary)",
                color: "var(--primary-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ic.bin width={20} height={20} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {cb.bin}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 2,
                lineHeight: 1.4,
                fontFamily: "var(--font-body)",
              }}
            >
              {cb.tip}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 24px", display: "flex", gap: 10 }}>
        <PrimaryButton
          onClick={onNewPhoto}
          showIcons={showIcons}
          leftIcon={<Ic.camera />}
          style={{ flex: 1 }}
        >
          Nouvelle photo
        </PrimaryButton>
      </div>
    </div>
  );
}
