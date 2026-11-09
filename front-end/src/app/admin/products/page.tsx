'use client';

import { useEffect, useState } from 'react';
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from '@/services/product.service';
import { getCategories } from '@/services/product.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';

type VariantRow = { size: string; color: string; stock: string; sku: string; price: string };

const defaultForm = () => ({
  name: '',
  slug: '',
  categoryId: '',
  basePrice: '',
  discountPrice: '',
  isFeatured: false,
  isNewArrival: false,
  isPublished: true,
  variants: [{ size: '', color: '', stock: '', sku: '', price: '' }],
  images: [{ url: '', alt: '' }],
});

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [p, c] = await Promise.all([adminGetProducts(), getCategories()]);
    setProducts(p.data || []);
    setCategories(c.data || []);
  };

  const addVariant = () =>
    setForm((f: any) => ({
      ...f,
      variants: [...f.variants, { size: '', color: '', stock: '', sku: '', price: '' }],
    }));

  const removeVariant = (i: number) =>
    setForm((f: any) => ({
      ...f,
      variants: f.variants.filter((_: any, idx: number) => idx !== i),
    }));

  const addImage = () =>
    setForm((f: any) => ({ ...f, images: [...f.images, { url: '', alt: '' }] }));

  const removeImage = (i: number) =>
    setForm((f: any) => ({ ...f, images: f.images.filter((_: any, idx: number) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        variants: form.variants.map((v: VariantRow) => ({
          size: v.size,
          color: v.color || null,
          sku: v.sku || null,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : null,
        })),
        images: form.images.map((img: any, i: number) => ({ url: img.url, alt: img.alt || form.name, position: i })),
        basePrice: Number(form.basePrice),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      };
      if (editing) {
        await adminUpdateProduct(editing, payload);
      } else {
        await adminCreateProduct(payload);
      }
      setOpen(false);
      setEditing(null);
      setForm(defaultForm());
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await adminDeleteProduct(deletingId);
      setDeletingId(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#111] mb-1">Products</h1>
          <p className="text-[#111]/60 text-sm">Manage your OOFY catalog.</p>
        </div>
        <Dialog open={open} onOpenChange={(open: boolean) => setOpen(open)}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogTitle className="font-black text-[#111] uppercase tracking-tight text-sm mb-4">
              {editing ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f: any) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f: any) => ({ ...f, categoryId: e.target.value }))}
                  className="h-10 w-full rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
                >
                  <option value="">Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base price (৳)</Label>
                  <Input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm((f: any) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount price (৳)</Label>
                  <Input
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) => setForm((f: any) => ({ ...f, discountPrice: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={() => setForm((f: any) => ({ ...f, isPublished: !f.isPublished }))}
                  className="accent-[#111]"
                />
                <Label htmlFor="isPublished">Published</Label>
                <input
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={() => setForm((f: any) => ({ ...f, isFeatured: !f.isFeatured }))}
                  className="accent-[#111] ml-6"
                />
                <Label htmlFor="isFeatured">Featured</Label>
                <input
                  id="isNewArrival"
                  checked={form.isNewArrival}
                  onChange={() => setForm((f: any) => ({ ...f, isNewArrival: !f.isNewArrival }))}
                  className="accent-[#111] ml-6"
                />
                <Label htmlFor="isNewArrival">New Arrival</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Variants (size · stock)</Label>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="h-7 px-2 text-[10px] border rounded text-[#111] hover:bg-[#111]/5"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {form.variants.map((v: VariantRow, i: number) => (
                    <div key={i} className="grid grid-cols-5 gap-2 text-xs">
                      <Input
                        value={v.size}
                        onChange={(e) => {
                          const nv = [...form.variants];
                          nv[i].size = e.target.value;
                          setForm((f: any) => ({ ...f, variants: nv }));
                        }}
                        placeholder="M"
                      />
                      <Input
                        value={v.color}
                        onChange={(e) => {
                          const nv = [...form.variants];
                          nv[i].color = e.target.value;
                          setForm((f: any) => ({ ...f, variants: nv }));
                        }}
                        placeholder="Black"
                      />
                      <Input
                        value={v.stock}
                        onChange={(e) => {
                          const nv = [...form.variants];
                          nv[i].stock = e.target.value;
                          setForm((f: any) => ({ ...f, variants: nv }));
                        }}
                        placeholder="0"
                      />
                      <Input
                        value={v.sku}
                        onChange={(e) => {
                          const nv = [...form.variants];
                          nv[i].sku = e.target.value;
                          setForm((f: any) => ({ ...f, variants: nv }));
                        }}
                        placeholder="SKU"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-[10px] text-[#111]/50 hover:text-[#111]"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Images (URLs)</Label>
                  <button
                    type="button"
                    onClick={addImage}
                    className="h-7 px-2 text-[10px] border rounded text-[#111] hover:bg-[#111]/5"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {form.images.map((img: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={img.url}
                        onChange={(e) => {
                          const ni = [...form.images];
                          ni[i].url = e.target.value;
                          setForm((f: any) => ({ ...f, images: ni }));
                        }}
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="text-[10px] text-[#111]/50 hover:text-[#111]"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editing ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {deletingId && (
          <Dialog open onOpenChange={(open: boolean) => setDeletingId(open ? null : deletingId)}>
            <DialogContent className="p-6">
              <DialogTitle className="font-black text-[#111] uppercase tracking-tight text-sm">
                Delete product?
              </DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
              <Separator className="my-4" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeletingId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleDelete} disabled={loading}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#111]/10">
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase text-center">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase text-center">Flags</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111]/10">
            {products.map((p) => (
              <tr key={p.id} className="last:border-0 hover:bg-[#111]/3 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-[#111]">{p.name}</div>
                  <div className="text-xs text-[#111]/50">{p.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#111]">{p.category?.name || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold text-[#111]">
                  ৳{Number(p.basePrice).toLocaleString()}
                  {p.discountPrice && (
                    <span className="text-[#111]/40 text-xs ml-1 line-through">
                      ৳{p.basePrice}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  {p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    p.isFeatured ? 'bg-[#111] text-[#F5F2E9] border-[#111]' : 'border-[#111]/20 text-[#111]/50'
                  }`}>
                    {p.isFeatured ? <span className="h-3 w-3 rounded-full bg-[#F5F2E9]" /> : ''} Featured
                  </span>{' '}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    p.isNewArrival ? 'bg-[#111] text-[#F5F2E9] border-[#111]' : 'border-[#111]/20 text-[#111]/50'
                  }`}>
                    {p.isNewArrival ? <span className="h-3 w-3 rounded-full bg-[#F5F2E9]" /> : ''} New
                  </span>{' '}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    p.isPublished ? 'bg-[#111] text-[#F5F2E9] border-[#111]' : 'border-[#111]/20 text-[#111]/50'
                  }`}>
                    {p.isPublished ? <span className="h-3 w-3 rounded-full bg-[#F5F2E9]" /> : ''} Live
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p.id);
                      setForm({
                        name: p.name,
                        slug: p.slug,
                        categoryId: p.categoryId,
                        basePrice: String(p.basePrice),
                        discountPrice: p.discountPrice ? String(p.discountPrice) : '',
                        isFeatured: p.isFeatured,
                        isNewArrival: p.isNewArrival,
                        isPublished: p.isPublished,
                        variants: p.variants.map((v: any) => ({
                          size: v.size,
                          color: v.color || '',
                          stock: String(v.stock),
                          sku: v.sku || '',
                          price: v.price ? String(v.price) : '',
                        })),
                        images: p.images.map((img: any) => ({ url: img.url, alt: img.alt || '' })),
                      });
                      setOpen(true);
                    }}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>{' '}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingId(p.id)}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#111]/50 text-sm">
                No products yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
