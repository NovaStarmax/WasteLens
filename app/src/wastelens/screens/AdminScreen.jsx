import React, { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import { Ic } from "../icons";
import { CLASS_LABEL } from "../constants";
import {
  getUsers,
  createUser,
  deleteUser,
  getAllHistory,
  getEvaluation,
  getConfusionMatrixBlob,
} from "../../services/api";

const GRAFANA_URL = "https://grafana-wastelens.starspath-place.fr";
const LIMIT = 20;

// ---- Shared styles ----

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  padding: "16px",
};

const sectionTitle = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 12,
};

const mutedText = {
  fontSize: 13,
  color: "var(--text-muted)",
  fontFamily: "var(--font-body)",
};

const errorText = {
  fontSize: 13,
  color: "var(--danger)",
  fontFamily: "var(--font-body)",
  padding: "10px 12px",
  background: "color-mix(in srgb, var(--danger) 8%, transparent)",
  border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
  borderRadius: "var(--radius-btn)",
};

const inputStyle = {
  height: 44,
  padding: "0 12px",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-btn)",
  background: "var(--bg)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text)",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary = {
  height: 44,
  border: "none",
  borderRadius: "var(--radius-btn)",
  background: "var(--primary)",
  color: "var(--primary-ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
};

const btnSecondary = {
  height: 36,
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-btn)",
  background: "transparent",
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  padding: "0 14px",
};

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  fontWeight: 600,
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontFamily: "var(--font-body)",
};

const tdStyle = {
  padding: "8px 8px",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  color: "var(--text)",
  borderBottom: "1px solid var(--border)",
};

// ---- Tab bar ----

function TabBar({ active, onChange }) {
  const tabs = [
    { id: "users", label: "Utilisateurs" },
    { id: "history", label: "Historique" },
    { id: "metrics", label: "Métriques" },
  ];
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            padding: "12px 8px",
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? "var(--primary)" : "var(--text-muted)",
            borderBottom: active === t.id ? "2px solid var(--primary)" : "2px solid transparent",
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---- Users Tab ----

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newUserPassword, setNewUserPassword] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId) {
    setDeleting(true);
    try {
      await deleteUser(userId);
      setConfirmDelete(null);
      loadUsers();
    } catch (e) {
      setError(e.message);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.username || !form.password) return;
    setCreating(true);
    setCreateError(null);
    setNewUserPassword(null);
    try {
      await createUser(form.username, form.password, form.role);
      setNewUserPassword(form.password);
      setForm({ username: "", password: "", role: "user" });
      loadUsers();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={cardStyle}>
        <div style={sectionTitle}>Créer un utilisateur</div>
        {newUserPassword && (
          <div style={{
            padding: "10px 12px",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
            borderRadius: "var(--radius-btn)",
            fontSize: 13,
            color: "var(--success)",
            fontFamily: "var(--font-body)",
            marginBottom: 12,
          }}>
            Utilisateur créé. Mot de passe : <strong>{newUserPassword}</strong>
          </div>
        )}
        {createError && <div style={{ ...errorText, marginBottom: 12 }}>{createError}</div>}
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Nom d'utilisateur"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            style={inputStyle}
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            style={inputStyle}
            autoComplete="new-password"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            style={inputStyle}
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
          <button type="submit" disabled={creating} style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}>
            {creating ? "Création…" : "Créer l'utilisateur"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>Liste des utilisateurs</div>
        {loading ? (
          <div style={mutedText}>Chargement…</div>
        ) : error ? (
          <div style={errorText}>{error}</div>
        ) : users.length === 0 ? (
          <div style={mutedText}>Aucun utilisateur.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg)",
                  borderRadius: "var(--radius-btn)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text)" }}>
                    {u.username}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-pill)",
                    background: u.role === "admin"
                      ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                      : "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: u.role === "admin" ? "var(--primary)" : "var(--accent)",
                    fontFamily: "var(--font-body)",
                  }}>
                    {u.role}
                  </span>
                  {confirmDelete === u.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => handleDelete(u.id)}
                        style={{
                          padding: "4px 10px", border: "none", borderRadius: "var(--radius-btn)",
                          background: "var(--danger)", color: "#fff",
                          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid var(--border-strong)",
                          borderRadius: "var(--radius-btn)",
                          background: "transparent", color: "var(--text-muted)",
                          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(u.id)}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
                        borderRadius: "var(--radius-btn)",
                        background: "transparent",
                        color: "var(--danger)",
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- History Tab ----

function HistoryTab() {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [users, setUsers] = useState([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllHistory(skip, LIMIT, filterUserId || null);
        setPredictions(data.predictions);
        setTotal(data.total);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [skip, filterUserId]);

  const usersById = Object.fromEntries(users.map((u) => [u.id, u.username]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <select
        value={filterUserId}
        onChange={(e) => { setFilterUserId(e.target.value); setSkip(0); }}
        style={inputStyle}
      >
        <option value="">Tous les utilisateurs</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.username}</option>
        ))}
      </select>

      {loading ? (
        <div style={mutedText}>Chargement…</div>
      ) : error ? (
        <div style={errorText}>{error}</div>
      ) : (
        <>
          <div style={cardStyle}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th scope="col" style={thStyle}>Utilisateur</th>
                  <th scope="col" style={thStyle}>Classe</th>
                  <th scope="col" style={thStyle}>Confiance</th>
                  <th scope="col" style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>
                      Aucune prédiction.
                    </td>
                  </tr>
                ) : predictions.map((p) => (
                  <tr key={p.id}>
                    <td style={tdStyle}>{usersById[p.user_id] || p.user_id.slice(0, 8) + "…"}</td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: `var(--cls-${p.predicted_class})`, flexShrink: 0,
                        }} />
                        {CLASS_LABEL[p.predicted_class] || p.predicted_class}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {Math.round(p.confidence * 100)}%
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {new Date(p.timestamp).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              type="button"
              disabled={skip === 0}
              onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
              style={{ ...btnSecondary, opacity: skip === 0 ? 0.4 : 1, cursor: skip === 0 ? "default" : "pointer" }}
            >
              ← Précédent
            </button>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              {total === 0 ? "0 résultat" : `${skip + 1}–${Math.min(skip + LIMIT, total)} sur ${total}`}
            </div>
            <button
              type="button"
              disabled={skip + LIMIT >= total}
              onClick={() => setSkip((s) => s + LIMIT)}
              style={{ ...btnSecondary, opacity: skip + LIMIT >= total ? 0.4 : 1, cursor: skip + LIMIT >= total ? "default" : "pointer" }}
            >
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Metrics Tab ----

function MetricsTab() {
  const [evaluation, setEvaluation] = useState(null);
  const [matrixUrl, setMatrixUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalError, setEvalError] = useState(null);
  const matrixBlobRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [evalResult, matrixResult] = await Promise.allSettled([
        getEvaluation(),
        getConfusionMatrixBlob(),
      ]);
      if (evalResult.status === "fulfilled") {
        setEvaluation(evalResult.value);
      } else {
        setEvalError(evalResult.reason?.message || "Rapport non disponible.");
      }
      if (matrixResult.status === "fulfilled") {
        matrixBlobRef.current = matrixResult.value;
        setMatrixUrl(matrixResult.value);
      }
      setLoading(false);
    }
    load();
    return () => { if (matrixBlobRef.current) URL.revokeObjectURL(matrixBlobRef.current); };
  }, []);

  if (loading) return <div style={mutedText}>Chargement des métriques…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {evaluation ? (
        <>
          <div style={cardStyle}>
            <div style={sectionTitle}>Performance globale</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Test accuracy", value: `${Math.round((evaluation.test_accuracy || 0) * 100)}%` },
                { label: "Val. accuracy", value: `${Math.round((evaluation.best_val_accuracy || 0) * 100)}%` },
              ].map((m) => (
                <div key={m.label} style={{
                  flex: 1,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-btn)",
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.02em" }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {evaluation.per_class_metrics && (
            <div style={cardStyle}>
              <div style={sectionTitle}>F1 par classe</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Classe", "Précision", "Rappel", "F1"].map((h) => (
                      <th key={h} scope="col" style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(evaluation.per_class_metrics).map(([cls, m]) => (
                    <tr key={cls}>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--cls-${cls})`, flexShrink: 0 }} />
                          {CLASS_LABEL[cls] || cls}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{(m.precision * 100).toFixed(1)}%</td>
                      <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{(m.recall * 100).toFixed(1)}%</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: "var(--primary)" }}>{(m.f1 * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div style={cardStyle}>
          <div style={sectionTitle}>Performance globale</div>
          <div style={errorText}>{evalError}</div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={sectionTitle}>Matrice de confusion</div>
        {matrixUrl ? (
          <img
            src={matrixUrl}
            alt="Matrice de confusion"
            style={{ width: "100%", borderRadius: "var(--radius-btn)", marginTop: 4 }}
          />
        ) : (
          <div style={mutedText}>Non disponible (lancez l'entraînement pour la générer).</div>
        )}
      </div>

      <a
        href={GRAFANA_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...btnSecondary,
          textDecoration: "none",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Ouvrir Grafana →
      </a>
    </div>
  );
}

// ---- AdminScreen ----

export default function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", minHeight: "100%" }}>
      <TopBar
        title="Dashboard Admin"
        subtitle="Administration"
        leftIcon={<Ic.back />}
        onLeftClick={onBack}
        ariaLabelLeft="Retour à l'accueil"
      />
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 32px" }}>
        {activeTab === "users" && <UsersTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "metrics" && <MetricsTab />}
      </div>
    </div>
  );
}
