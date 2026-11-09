import { api } from '@/lib/api';
import type { Product, Category } from '@/types';

export async function getProducts(params?: Record<string, string | number>) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`);
  return data;
}

export async function getFeaturedProducts() {
  const { data } = await api.get('/products/featured');
  return data;
}

export async function getNewArrivals() {
  const { data } = await api.get('/products/new-arrivals');
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data;
}

export async function adminCreateProduct(body: any) {
  const { data } = await api.post('/admin/products', body);
  return data;
}

export async function adminUpdateProduct(id: string, body: any) {
  const { data } = await api.put(`/admin/products/${id}`, body);
  return data;
}

export async function adminDeleteProduct(id: string) {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
}

export async function adminGetProducts() {
  const { data } = await api.get('/admin/products');
  return data;
}