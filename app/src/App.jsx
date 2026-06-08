import React, { useState, useEffect, useRef } from "react";
import {
  LoginScreen,
  PredictHomeScreen,
  ResultScreen,
  LegalScreen,
} from "./wastelens";
import { login, setToken, isTokenValid, predict, clearToken, getHistory } from "./services/api";
import { Loader2 } from "lucide-react";

const DEMO_IMAGES = {
  cardboard: () => import("./assets/demo/cardboard.jpg"),
  glass:     () => import("./assets/demo/glass.jpg"),
  metal:     () => import("./assets/demo/metal.jpg"),
  paper:     () => import("./assets/demo/paper.jpg"),
  plastic:   () => import("./assets/demo/plastic.jpg"),
  trash:     () => import("./assets/demo/trash.jpg"),
};

export default function App() {
  const [route, setRoute] = useState("login");
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [offline, setOffline] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const logoutMenuRef = useRef(null);

  useEffect(() => {
    if (isTokenValid()) {
      setRoute("home");
      loadHistory();
    } else {
      clearToken();
    }
  }, []);

  useEffect(() => {
    if (!showLogoutMenu) return;
    function onMouseDown(e) {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(e.target)) {
        setShowLogoutMenu(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showLogoutMenu]);

  // ---- HISTORY ----
  async function loadHistory() {
    try {
      const data = await getHistory(0, 20);
      setHistory(
        data.predictions.map((p) => ({
          id: p.id,
          cls: p.predicted_class,
          confidence: Math.round(p.confidence * 100),
          time: new Date(p.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    } catch {
      setHistory([]);
    }
  }

  // ---- LOGIN ----
  async function handleLogin(email, password) {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { access_token } = await login(email, password);
      setToken(access_token);
      setUser({ email });
      setRoute("home");
      loadHistory();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  // ---- LOGOUT ----
  function handleLogout() {
    clearToken();
    setHistory([]);
    setUser(null);
    setRoute("login");
  }

  // ---- PREDICT ----
  async function handlePhoto(imageFile) {
    if (predictLoading) return;
    setPredictLoading(true);
    setPredictError(null);
    const thumbnail = URL.createObjectURL(imageFile);
    setPendingImageUrl(thumbnail);
    try {
      const result = await predict(imageFile);
      const entry = {
        id: String(Date.now()),
        cls: result.predicted_class,
        confidence: Math.round(result.confidence * 100),
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        thumbnailUrl: thumbnail,
        fileName: imageFile.name,
      };
      setCurrent(entry);
      setCurrentImageUrl(thumbnail);
      loadHistory();
      setRoute("result");
    } catch (err) {
      URL.revokeObjectURL(thumbnail);
      if (err.message.includes("Session expirée")) {
        clearToken();
        setRoute("login");
      } else {
        setPredictError(err.message);
      }
    } finally {
      setPredictLoading(false);
      setPendingImageUrl(null);
    }
  }

  function handleTakePhoto() {
    cameraInputRef.current?.click();
  }

  function handlePickGallery() {
    galleryInputRef.current?.click();
  }

  async function handleDemo(className) {
    const mod = await DEMO_IMAGES[className]?.();
    if (!mod) return;
    const res = await fetch(mod.default);
    const blob = await res.blob();
    const file = new File([blob], `${className}.jpg`, { type: "image/jpeg" });
    await handlePhoto(file);
  }

  // ---- RENDER ----
  return (
    <div
      className="theme-civique"
      style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}
    >
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) handlePhoto(e.target.files[0]); e.target.value = ""; }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) handlePhoto(e.target.files[0]); e.target.value = ""; }}
      />

      {route === "login" && (
        <LoginScreen
          onSubmit={handleLogin}
          onForgotPassword={() => alert("TODO")}
          loading={loginLoading}
          error={loginError}
        />
      )}

      {route === "home" && (
        <>
          {predictError && (
            <div role="alert" style={{
              margin: "12px 20px 0",
              padding: "10px 14px",
              background: "color-mix(in srgb, var(--danger) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              borderRadius: "var(--radius-btn)",
              fontSize: 13,
              color: "var(--danger)",
              fontFamily: "var(--font-body)",
            }}>
              {predictError}
            </div>
          )}
          <PredictHomeScreen
            agentName={user?.email}
            history={history}
            isLoading={predictLoading}
            imagePreview={pendingImageUrl}
            offline={offline}
            queueCount={history.filter((p) => p.pending).length}
            onTakePhoto={predictLoading ? undefined : handleTakePhoto}
            onPickGallery={predictLoading ? undefined : handlePickGallery}
            onSelectPrediction={(p) => { setCurrent(p); setCurrentImageUrl(p.thumbnailUrl); setRoute("result"); }}
            onRetryQueue={() => setOffline(false)}
            onDemo={handleDemo}
            onProfile={() => setShowLogoutMenu((prev) => !prev)}
            onLegal={() => setRoute("legal")}
          />
          {predictLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(4px)",
              }}
            >
              <Loader2
                size={40}
                style={{ animation: "wastelens-spin 1s linear infinite", color: "var(--primary)" }}
              />
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                Analyse en cours…
              </div>
            </div>
          )}
          {showLogoutMenu && (
            <div
              ref={logoutMenuRef}
              style={{
                position: "absolute",
                top: 56,
                left: 16,
                zIndex: 100,
                minWidth: 200,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                padding: 8,
                fontFamily: "var(--font-body)",
              }}
            >
              <div style={{ padding: "6px 8px 8px", fontSize: 12, color: "var(--text-muted)" }}>
                {user?.email}
              </div>
              <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid var(--border)" }} />
              <button
                type="button"
                onClick={() => { handleLogout(); setShowLogoutMenu(false); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 8px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-btn)",
                  color: "var(--danger)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 16 }}>→</span>
                Se déconnecter
              </button>
            </div>
          )}
        </>
      )}

      {route === "result" && (
        <ResultScreen
          prediction={current}
          imageUrl={currentImageUrl}
          onBack={() => setRoute("home")}
          onHistory={() => setRoute("home")}
          onNewPhoto={() => { setPredictError(null); handleTakePhoto(); }}
        />
      )}

      {route === "legal" && <LegalScreen onBack={() => setRoute("home")} />}
    </div>
  );
}
