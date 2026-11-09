import { api } from '@/lib/api';

export async function getSettings() {
  const { data } = await api.get('/admin/settings');
  return data;
}

export async function createOrder(body: any) {
  const { data } = await api.post('/orders', body);
  return data;
}

export async function trackOrder(orderNumber: string) {
  const { data } = await api.get(`/orders/track/${encodeURIComponent(orderNumber)}`);
  return data;
}

export async function adminGetOrders(params?: Record<string, string>) {
  const { data } = await api.get('/orders/admin', { params });
  return data;
}

export async function adminGetOrder(id: string) {
  const { data } = await api.get(`/orders/admin/${id}`);
  return data;
}

export async function adminUpdateOrderStatus(id: string, status: string) {
  const { data } = await api.patch(`/orders/admin/${id}/status`, { status });
  return data;
}

export async function adminGetDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function adminGetAllProducts() {
  const { data } = await api.get('/admin/products');
  return data;
}

export async function sendContactMessage(body: any) {
  const { data } = await api.post('/contact', body);
  return data;
}