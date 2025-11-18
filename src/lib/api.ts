import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () =>
    api.get('/auth/profile'),
};

// Projects API
export const projectsAPI = {
  getAll: () =>
    api.get('/projects'),

  getById: (id: number) =>
    api.get(`/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),

  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/projects/${id}`, data),

  delete: (id: number) =>
    api.delete(`/projects/${id}`),

  saveDrawing: (id: number, data: { canvas_data?: any; parameters?: any; loops_data?: any }) =>
    api.post(`/projects/${id}/drawing`, data),

  uploadFloorPlan: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/projects/${id}/floorplan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteFloorPlan: (id: number) =>
    api.delete(`/projects/${id}/floorplan`),
};

export default api;
