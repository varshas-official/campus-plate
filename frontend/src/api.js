const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${response.status})`)
  }
  return response.json()
}

export const getDashboard = () => request('/dashboard')
export const getPredictions = () => request('/predictions?limit=100')
export const getHistory = () => request('/history')
export const getModel = () => request('/model')
export const createPrediction = (data) => request('/predictions', { method: 'POST', body: JSON.stringify(data) })
