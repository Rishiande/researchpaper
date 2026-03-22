import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach token from localStorage on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Papers ───────────────────────────────────────────────
export const getAllPapers = (params = {}) =>
  API.get('/papers', { params });

export const getPaper = (id) =>
  API.get(`/papers/${id}`);

export const createPaper = (formData) =>
  API.post('/papers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updatePaper = (id, formData) =>
  API.put(`/papers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateStatus = (id, status) =>
  API.patch(`/papers/${id}/status`, { reading_status: status });

export const deletePaper = (id) =>
  API.delete(`/papers/${id}`);

export const searchPapers = (query) =>
  API.get('/papers/search', { params: { q: query } });

export const getStats = () =>
  API.get('/papers/stats');

export const resolveDOI = (doi) =>
  API.post('/papers/resolve-doi', { doi });

export const getCitation = (id, format) =>
  API.get(`/papers/${id}/citation`, { params: { format } });

export const getDownloadUrl = (id) =>
  `/api/papers/${id}/download`;

// ─── Notes ────────────────────────────────────────────────
export const getNotes = (paperId) =>
  API.get(`/papers/${paperId}/notes`);

export const createNote = (paperId, content) =>
  API.post(`/papers/${paperId}/notes`, { content });

export const updateNote = (noteId, content) =>
  API.put(`/notes/${noteId}`, { content });

export const deleteNote = (noteId) =>
  API.delete(`/notes/${noteId}`);

export default API;
