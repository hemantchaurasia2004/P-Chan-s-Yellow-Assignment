import axios from 'axios'

// Use environment variable for API URL, fallback to proxy for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Project API functions
export const projectAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

// Prompt API functions
export const promptAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/prompts`),
  create: (projectId, data) => api.post(`/projects/${projectId}/prompts`, data),
  update: (promptId, data) => api.put(`/projects/prompts/${promptId}`, data),
  delete: (promptId) => api.delete(`/projects/prompts/${promptId}`),
}

// Chat API functions
export const chatAPI = {
  sendMessage: (projectId, message, sessionId = null) => 
    api.post(`/projects/${projectId}/chat`, { message, session_id: sessionId }),
  listSessions: (projectId) => api.get(`/projects/${projectId}/sessions`),
  getSession: (projectId, sessionId) => api.get(`/projects/${projectId}/sessions/${sessionId}`),
  createSession: (projectId) => api.post(`/projects/${projectId}/sessions`),
  deleteSession: (projectId, sessionId) => api.delete(`/projects/${projectId}/sessions/${sessionId}`),
}

// File API functions
export const fileAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/files`),
  upload: (projectId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (fileId) => api.delete(`/files/${fileId}`),
}
