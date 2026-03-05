/// <reference types="vite/client" />
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

        if (isFormData) {
          if (config.headers) {
            delete (config.headers as any)['Content-Type'];
            delete (config.headers as any)['content-type'];
          }
        } else {
          config.headers = config.headers || {};
          if (!(config.headers as any)['Content-Type'] && !(config.headers as any)['content-type']) {
            (config.headers as any)['Content-Type'] = 'application/json';
          }
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token added to request:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ No token found in localStorage');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              localStorage.setItem('accessToken', response.data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  register = (data: { username: string; password: string }) =>
    this.client.post('/auth/register', data);

  login = (data: { username: string; password: string }) =>
    this.client.post('/auth/login', data);

  getProfile = () => this.client.get('/auth/profile');

  // Map endpoints
  getMaps = (params?: any) => this.client.get('/maps', { params });

  getPopularMaps = (limit?: number) =>
    this.client.get('/maps/popular', { params: { limit } });

  getRecentMaps = (limit?: number) =>
    this.client.get('/maps/recent', { params: { limit } });

  getMap = (id: number) => this.client.get(`/maps/${id}`);

  uploadMap = (formData: FormData) =>
    this.client.post('/maps', formData);

  deleteMap = (id: number) => this.client.delete(`/maps/${id}`);

  // Download endpoints
  downloadMap = (id: number) => this.client.post(`/maps/${id}/download`);

  getUserDownloads = (params?: any) =>
    this.client.get('/user/downloads', { params });

  // Rating endpoints
  createRating = (mapId: number, data: any) =>
    this.client.post(`/maps/${mapId}/ratings`, data);

  updateRating = (mapId: number, data: any) =>
    this.client.put(`/maps/${mapId}/ratings`, data);

  deleteRating = (mapId: number) => this.client.delete(`/maps/${mapId}/ratings`);

  getMapRatings = (mapId: number, params?: any) =>
    this.client.get(`/maps/${mapId}/ratings`, { params });

  getUserRating = (mapId: number) => this.client.get(`/maps/${mapId}/my-rating`);
}

export default new ApiClient();
