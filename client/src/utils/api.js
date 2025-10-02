import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

export const articles = {
  list: (params) => api.get('/articles', { params }),
  get: (slug) => api.get(`/articles/${slug}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  updateStatus: (id, status) => api.patch(`/articles/${id}/status`, { status }),
  uploadMedia: (articleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/articles/${articleId}/media`, formData);
  },
  getMedia: (id) => api.get(`/articles/${id}/media`)
};

export const profile = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getBookmarks: (params) => api.get('/profile/bookmarks', { params }),
  addBookmark: (articleId) => api.post(`/profile/bookmarks/${articleId}`),
  removeBookmark: (articleId) => api.delete(`/profile/bookmarks/${articleId}`),
  getPurchases: (params) => api.get('/profile/purchases', { params })
};

export const payments = {
  createIntent: (articleId) => api.post('/payments/create-intent', { articleId }),
  confirm: (paymentIntentId) => api.post('/payments/confirm', { paymentIntentId }),
  getHistory: (params) => api.get('/payments/history', { params })
};

export const newsletter = {
  subscribe: (data) => api.post('/newsletter/subscribe', data),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  getSubscribers: (params) => api.get('/newsletter/subscribers', { params }),
  createCampaign: (data) => api.post('/newsletter/campaign', data),
  getCampaigns: (params) => api.get('/newsletter/campaigns', { params })
};

export const admin = {
  getStats: () => api.get('/admin/stats'),
  getArticles: (params) => api.get('/admin/articles', { params }),
  getUsers: (params) => api.get('/admin/users', { params })
};

export default api;