import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    const lsToken = localStorage.getItem('oofy_token');
    const cookieToken = Cookies.get('token');
    token = lsToken ?? cookieToken ?? null;
  }
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { Cookies };
