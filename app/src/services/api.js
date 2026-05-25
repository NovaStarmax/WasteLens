const API_BASE = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'wastelens_token'

// --- Gestion du token JWT ---

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return getToken() !== null
}

// --- Appels API ---

// Authentifie l'utilisateur et retourne { access_token, token_type, expires_in }
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (res.status === 401) throw new Error('Email ou mot de passe incorrect.')
  if (!res.ok) throw new Error('Erreur serveur, veuillez réessayer.')

  return res.json()
}

// Envoie une image au modèle et retourne { predicted_class, confidence, bin_recommendation }
export async function predict(imageFile) {
  const token = getToken()
  if (!token) throw new Error('Session expirée, veuillez vous reconnecter.')

  const body = new FormData()
  body.append('file', imageFile)

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  if (res.status === 400) throw new Error('Image invalide ou illisible.')
  if (res.status === 401) throw new Error('Session expirée, veuillez vous reconnecter.')
  if (res.status === 500) throw new Error('Erreur du modèle, veuillez réessayer.')
  if (!res.ok) throw new Error('Erreur inattendue lors de la prédiction.')

  return res.json()
}
