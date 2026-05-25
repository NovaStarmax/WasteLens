import React, { useState } from "react";
import {
  LoginScreen,
  PredictHomeScreen,
  ResultScreen,
  LegalScreen,
} from "./wastelens";

export default function App() {
  const [route, setRoute] = useState("login"); // login | home | result | legal
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const [offline, setOffline] = useState(false);

  // ---- LOGIN ----
  async function handleLogin(email, password) {
    // Remplace par ton appel API d'auth.
    setUser({ email });
    setRoute("home");
  }

  // ---- PHOTO ----
  function handleTakePhoto() {
    // Ouvre <input type="file" accept="image/*" capture="environment" />
    // ou un picker custom, puis :
    fakeApiPredict("cardboard", 0.94, "IMG_0428.jpg");
  }
  function handlePickGallery() {
    fakeApiPredict("glass", 0.62, "IMG_0429.jpg");
  }

  function fakeApiPredict(cls, confidence, fileName) {
    const prediction = {
      id: String(Date.now()),
      cls,
      confidence: Math.round(confidence * 100),
      time: "à l'instant",
      fileName,
    };
    setCurrent(prediction);
    setHistory((h) => [
      { ...prediction, time: "il y a quelques sec." },
      ...h,
    ]);
    setRoute("result");
  }

  // ---- RENDER ----
  return (
    <div
      className="theme-civique"
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {route === "login" && (
        <LoginScreen onSubmit={handleLogin} onForgotPassword={() => alert("TODO")} />
      )}

      {route === "home" && (
        <PredictHomeScreen
          agentName={user?.email}
          history={history}
          offline={offline}
          queueCount={history.filter((p) => p.pending).length}
          onTakePhoto={handleTakePhoto}
          onPickGallery={handlePickGallery}
          onSelectPrediction={(p) => {
            setCurrent(p);
            setRoute("result");
          }}
          onRetryQueue={() => setOffline(false)}
          onProfile={() => setRoute("legal")}
          onLegal={() => setRoute("legal")}
        />
      )}

      {route === "result" && (
        <ResultScreen
          prediction={current}
          onBack={() => setRoute("home")}
          onHistory={() => setRoute("home")}
          onNewPhoto={() => setRoute("home")}
        />
      )}

      {route === "legal" && <LegalScreen onBack={() => setRoute("home")} />}
    </div>
  );
}
