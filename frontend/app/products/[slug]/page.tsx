"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Product = { name: string; description?: string; shortDescription?: string; material?: string; fit?: string; careInstructions?: string; countryOfOrigin?: string; basePrice: string | number; discountPrice?: string | number; images: { url: string; alt?: string }[]; variants: { id: string; size: string; color?: string; stock: number }[] };
const money = (value: string | number) => `৳ ${Number(value).toLocaleString("en-BD")}`;

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { if (slug) fetch(`${API}/products/${slug}`).then(r => r.json().then(data => ({ ok: r.ok, data }))).then(({ ok, data }) => ok ? setProduct(data.data.product) : setError(data.message || "Product not found")).catch(() => setError("Could not load product.")); }, [slug]);
  if (error) return <main className="grid min-h-screen place-items-center bg-bone p-6 text-center"><div><h1 className="text-3xl font-black">{error}</h1><a href="/" className="mt-5 inline-block text-sm font-bold underline">Back to shop</a></div></main>;
  if (!product) return <main className="grid min-h-screen place-items-center bg-bone text-sm">Loading product…</main>;
  const image = product.images[selected] || product.images[0];
  return <main className="min-h-screen bg-bone"><header className="flex h-20 items-center justify-between border-b border-ink/15 px-5 md:px-10"><a href="/" className="text-xs font-bold uppercase tracking-widest">← Shop</a><p className="text-2xl font-black tracking-[-.13em]">OOFY®</p><a href="/#shop" className="text-xs font-bold uppercase tracking-widest">Collection</a></header><section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-2 md:px-10"><div><div className="aspect-[.82] overflow-hidden bg-black/5">{image && <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />}</div><div className="mt-3 grid grid-cols-4 gap-2">{product.images.map((item, index) => <button key={item.url} onClick={() => setSelected(index)} className={`aspect-square overflow-hidden border-2 ${selected === index ? "border-ink" : "border-transparent"}`}><img src={item.url} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div></div><article className="md:py-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-blue">OOFY essentials</p><h1 className="mt-3 text-5xl font-black uppercase leading-[.86] tracking-[-.08em]">{product.name}</h1><p className="mt-5 text-2xl font-bold">{money(product.discountPrice || product.basePrice)}</p><p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/70">{product.description || product.shortDescription}</p><div className="mt-8 grid grid-cols-2 gap-px bg-ink/15 text-xs"><Detail title="Material" value={product.material}/><Detail title="Fit" value={product.fit}/><Detail title="Origin" value={product.countryOfOrigin}/><Detail title="Care" value={product.careInstructions}/></div><div className="mt-8"><p className="text-xs font-bold uppercase tracking-widest">Available sizes</p><div className="mt-3 flex flex-wrap gap-2">{product.variants.map(v => <span key={v.id} className={`rounded border px-3 py-2 text-xs font-bold ${v.stock ? "border-ink" : "border-ink/15 text-ink/35 line-through"}`}>{v.size}{v.color ? ` · ${v.color}` : ""}</span>)}</div></div><a href="/#shop" className="mt-9 inline-block rounded-lg bg-ink px-5 py-4 text-xs font-bold uppercase tracking-widest text-bone">Choose size and add to bag</a></article></section></main>;
}
function Detail({ title, value }: { title: string; value?: string }) { if (!value) return null; return <div className="bg-bone p-4"><p className="font-bold uppercase tracking-wider">{title}</p><p className="mt-2 normal-case text-ink/65">{value}</p></div> }
