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

// Vérifie que le token existe ET que sa claim exp n'est pas dépassée
export function isTokenValid() {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
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
  if (res.status === 413) throw new Error('Fichier trop lourd (max 10 Mo).')
  if (!res.ok) throw new Error('Erreur inattendue lors de la prédiction.')

  return res.json()
}

export async function getHistory(skip = 0, limit = 20) {
  const token = getToken()
  if (!token) throw new Error('Session expirée.')

  const res = await fetch(`${API_BASE}/history/me?skip=${skip}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) throw new Error('Session expirée.')
  if (!res.ok) throw new Error("Erreur lors du chargement de l'historique.")

  return res.json()
}

export function getRoleFromToken() {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || null
  } catch {
    return null
  }
}

export async function getUsers() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur chargement users.')
  return res.json()
}

export async function createUser(username, password, role = 'user') {
  const token = getToken()
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, role }),
  })
  if (!res.ok) throw new Error('Erreur création user.')
  return res.json()
}

export async function getAllHistory(skip = 0, limit = 20, userId = null) {
  const token = getToken()
  const params = new URLSearchParams({ skip, limit })
  if (userId) params.append('user_id', userId)
  const res = await fetch(`${API_BASE}/history?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur chargement historique.')
  return res.json()
}

export async function getEvaluation() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/reports/evaluation`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur chargement métriques.')
  return res.json()
}

export async function deleteUser(userId) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 403) throw new Error('Action non autorisée.')
  if (res.status === 404) throw new Error('Utilisateur introuvable.')
  if (!res.ok) throw new Error('Erreur suppression user.')
}

export async function getConfusionMatrixBlob() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/reports/confusion-matrix`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Erreur chargement confusion matrix.')
  return URL.createObjectURL(await res.blob())
}
