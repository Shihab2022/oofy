"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiCheck,
  FiChevronRight,
  FiEdit2,
  FiGrid,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiSliders,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Variant = {
  id?: string;
  size: string;
  color?: string | null;
  sku?: string | null;
  stock: number;
  price?: string | null;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  isPublished: boolean;
  isFeatured?: boolean;
  category?: { name: string };
  categoryId?: string;
  images: { url: string }[];
  variants: Variant[];
};
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  items: unknown[];
};
type Category = { id: string; name: string; slug: string; description?: string | null; isActive: boolean; _count?: { products: number } };

const demoProducts: Product[] = [
  {
    id: "demo-1",
    name: "MILAN graphic tee",
    slug: "milan-graphic-tee",
    basePrice: 1250,
    isPublished: true,
    isFeatured: true,
    category: { name: "T-Shirts" },
    images: [{ url: "/images/tee-grid.jpeg" }],
    variants: [
      { size: "M", color: "Black", stock: 12 },
      { size: "L", color: "Black", stock: 8 },
    ],
  },
  {
    id: "demo-2",
    name: "PLAN BLACK tee",
    slug: "plan-black-tee",
    basePrice: 1250,
    isPublished: true,
    category: { name: "T-Shirts" },
    images: [{ url: "/images/model-front.jpeg" }],
    variants: [{ size: "M", color: "Black", stock: 4 }],
  },
];

const money = (value: string | number) =>
  `৳ ${Number(value).toLocaleString("en-BD")}`;
const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [active, setActive] = useState("Overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const request = async (path: string, init: RequestInit = {}) => {
    const isForm =
      typeof FormData !== "undefined" && init.body instanceof FormData;
    const res = await fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(json.message || "Could not complete that action");
    return json;
  };
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [productData, orderData, categoryData] = await Promise.all([
        request("/admin/products"),
        request("/orders/admin?limit=50"),
        request("/categories/admin/all"),
      ]);
      setProducts(productData.data || []);
      setOrders(orderData.data?.orders || []);
      setCategories(categoryData.data || []);
    } catch (e) {
      setProducts(demoProducts);
      setNotice(
        "Showing local preview data — connect the backend to manage live records.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const saved = localStorage.getItem("oofy_admin_token");
    if (saved) setToken(saved);
  }, []);
  useEffect(() => {
    loadData();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token)
    return (
      <Login
        onLogin={(value) => {
          localStorage.setItem("oofy_admin_token", value);
          setToken(value);
        }}
      />
    );
  const stock = products.reduce(
    (sum, product) =>
      sum + product.variants.reduce((n, v) => n + Number(v.stock), 0),
    0,
  );
  const revenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const nav = [
    ["Overview", FiGrid],
    ["Products", FiPackage],
    ["Orders", FiShoppingBag],
    ["Inventory", FiBox],
    ["Customers", FiUsers],
    ["Categories", FiSliders],
    ["Store settings", FiSettings],
  ];
  const pageTitle = active === "Overview" ? "Good morning, OOFY." : active;

  const removeProduct = async (id: string) => {
    if (!confirm("Remove this product? This cannot be undone.")) return;
    try {
      await request(`/admin/products/${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== id));
      setNotice("Product removed.");
    } catch (e: any) {
      setNotice(e.message);
    }
  };
  const updateStatus = async (order: Order, status: string) => {
    try {
      await request(`/orders/admin/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders(orders.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch (e: any) {
      setNotice(e.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-[#151915]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#121512] p-5 text-white lg:flex">
        <a href="/" className="mb-12 text-3xl font-black tracking-[-.13em]">
          OOFY<span className="text-lime">®</span>
        </a>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">
          Commerce manager
        </p>
        <nav className="space-y-1">
          {nav.map(([label, Icon]: any) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === label ? "bg-lime text-ink" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-bold">OOFY Admin</p>
          <p className="mt-1 text-xs text-white/50">Store owner</p>
          <button
            onClick={() => {
              localStorage.removeItem("oofy_admin_token");
              setToken("");
            }}
            className="mt-4 flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white"
          >
            <FiLogOut /> Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-black/5 bg-[#f6f7f5]/95 px-5 backdrop-blur md:px-9">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-ink/45">
              Commerce manager
            </p>
            <h1 className="mt-1 text-xl font-black tracking-[-.05em]">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-ink/55 md:flex">
              <FiSearch /> Search
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              <FiPlus /> Add product
            </button>
          </div>
        </header>
        <section className="p-5 md:p-9">
          {notice && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-lime/60 bg-lime/25 px-4 py-3 text-sm">
              <span>{notice}</span>
              <button onClick={() => setNotice("")}>
                <FiX />
              </button>
            </div>
          )}
          {active === "Overview" && (
            <Overview
              products={products}
              orders={orders}
              revenue={revenue}
              stock={stock}
              onOrders={() => setActive("Orders")}
            />
          )}
          {active === "Products" && (
            <Products
              products={filtered}
              search={search}
              setSearch={setSearch}
              onEdit={(p: Product) => {
                setEditing(p);
                setShowEditor(true);
              }}
              onDelete={removeProduct}
              loading={loading}
            />
          )}
          {active === "Orders" && (
            <Orders orders={orders} updateStatus={updateStatus} />
          )}
          {active === "Inventory" && <Inventory products={products} />}
          {active === "Customers" && <Customers orders={orders} />}
        {active === "Categories" && <Categories categories={categories} request={request} refresh={loadData} setNotice={setNotice} />}
          {active === "Store settings" && (
            <Settings request={request} setNotice={setNotice} />
          )}
        </section>
      </div>
      {showEditor && (
        <ProductEditor
          product={editing}
          request={request}
          close={() => setShowEditor(false)}
          saved={(product: Product) => {
            setProducts(
              editing
                ? products.map((p) => (p.id === product.id ? product : p))
                : [product, ...products],
            );
            setShowEditor(false);
            setNotice(editing ? "Product updated." : "Product published.");
          }}
        />
      )}
    </main>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API}/admin/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Sign-in failed");
      onLogin(data.data.token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="grid min-h-screen bg-ink md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-blue p-12 text-bone md:flex">
        <p className="text-4xl font-black tracking-[-.13em]">OOFY®</p>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em]">
            Store control centre
          </p>
          <h1 className="mt-5 text-7xl font-black leading-[.8] tracking-[-.1em]">
            BUILD
            <br />
            THE
            <br />
            <span className="outline-title">DROP.</span>
          </h1>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest">
          Wear your confidence — Bangladesh
        </p>
      </section>
      <section className="flex items-center justify-center bg-[#f6f7f5] p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/60"
          >
            <FiArrowLeft /> Back to shop
          </a>
          <h2 className="mt-12 text-4xl font-black tracking-[-.08em]">
            Welcome back.
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Sign in to manage your OOFY store.
          </p>
          {error && (
            <p className="mt-5 rounded-lg bg-rose-100 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <label className="mt-8 block text-xs font-bold uppercase tracking-wider">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-blue"
              placeholder="admin@oofy.com"
            />
          </label>
          <label className="mt-5 block text-xs font-bold uppercase tracking-wider">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-blue"
              placeholder="••••••••"
            />
          </label>
          <button
            disabled={busy}
            className="mt-7 w-full rounded-xl bg-ink py-4 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Overview({ products, orders, revenue, stock, onOrders }: any) {
  const pending = orders.filter((o: Order) => o.status === "PENDING").length;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<FiShoppingBag />}
          label="Total sales"
          value={money(revenue)}
          note="All recorded orders"
        />
        <Metric
          icon={<FiTruck />}
          label="Orders to fulfill"
          value={pending}
          note="Needs attention"
          warn
        />
        <Metric
          icon={<FiPackage />}
          label="Products live"
          value={products.filter((p: Product) => p.isPublished).length}
          note={`${products.length} in catalog`}
        />
        <Metric
          icon={<FiBox />}
          label="Units in stock"
          value={stock}
          note="Across all variants"
        />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <section className="rounded-2xl border border-black/8 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black tracking-[-.04em]">Recent orders</h2>
              <p className="mt-1 text-xs text-ink/50">
                Keep fulfillment moving.
              </p>
            </div>
            <button onClick={onOrders} className="text-xs font-bold text-blue">
              View all <FiChevronRight className="inline" />
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {orders.slice(0, 5).map((o: Order) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-[#f7f8f6] p-3"
              >
                <div>
                  <p className="text-sm font-bold">{o.customerName}</p>
                  <p className="mt-1 text-xs text-ink/50">
                    {o.orderNumber} · {o.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{money(o.totalAmount)}</p>
                  <Badge status={o.status} />
                </div>
              </div>
            ))}
            {!orders.length && (
              <Empty text="Orders will appear here as customers check out." />
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-ink p-5 text-white">
          <FiBarChart2 className="text-2xl text-lime" />
          <h2 className="mt-10 text-3xl font-black leading-none tracking-[-.07em]">
            Your store,
            <br />
            at a glance.
          </h2>
          <div className="mt-8 border-t border-white/15 pt-4 text-sm text-white/60">
            <p>
              Publishing is enabled for{" "}
              {products.filter((p: Product) => p.isPublished).length} products.
            </p>
            <p className="mt-3">
              Low stock alert:{" "}
              {
                products.filter((p: Product) =>
                  p.variants.some((v) => v.stock < 5),
                ).length
              }{" "}
              products need a restock.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
function Metric({ icon, label, value, note, warn }: any) {
  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5">
      <div
        className={`grid h-9 w-9 place-items-center rounded-lg ${warn ? "bg-lime" : "bg-blue/10 text-blue"}`}
      >
        {icon}
      </div>
      <p className="mt-5 text-2xl font-black tracking-[-.06em]">{value}</p>
      <p className="mt-1 text-sm font-bold">{label}</p>
      <p className="mt-1 text-xs text-ink/45">{note}</p>
    </article>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-ink/45">
      {text}
    </p>
  );
}

function Products({
  products,
  search,
  setSearch,
  onEdit,
  onDelete,
  loading,
}: any) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white">
      <div className="flex flex-col justify-between gap-4 border-b border-black/8 p-5 md:flex-row">
        <div>
          <h2 className="font-black tracking-[-.04em]">Catalog</h2>
          <p className="mt-1 text-xs text-ink/50">
            Products, images, pricing, and visibility.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-ink/40">
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="w-full text-sm outline-none"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45">
            <tr>
              <th className="p-4">Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: Product) => (
              <tr key={p.id} className="border-t border-black/5 text-sm">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-10 overflow-hidden rounded-lg bg-black/5">
                      {p.images?.[0] && (
                        <img
                          src={p.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-ink/45">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="text-ink/60">
                  {p.category?.name || "Uncategorized"}
                </td>
                <td className="font-bold">{money(p.basePrice)}</td>
                <td>{p.variants.reduce((n, v) => n + Number(v.stock), 0)}</td>
                <td>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${p.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}
                  >
                    {p.isPublished ? "Live" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="rounded-lg p-2 hover:bg-black/5"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !products.length && (
              <tr>
                <td colSpan={6} className="p-5">
                  <Empty text="No products match your search." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Orders({ orders, updateStatus }: any) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/8 p-5">
        <h2 className="font-black tracking-[-.04em]">Order desk</h2>
        <p className="mt-1 text-xs text-ink/50">
          Confirm, pack, ship, and complete each order.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45">
            <tr>
              <th className="p-4">Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: Order) => (
              <tr key={o.id} className="border-t border-black/5 text-sm">
                <td className="p-4 font-bold">
                  {o.orderNumber}
                  <span className="mt-1 block text-xs font-normal text-ink/45">
                    {o.items.length} item(s)
                  </span>
                </td>
                <td>
                  {o.customerName}
                  <span className="mt-1 block text-xs text-ink/45">
                    {o.customerPhone}
                  </span>
                </td>
                <td className="text-ink/60">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="font-bold">{money(o.totalAmount)}</td>
                <td>
                  <Badge status={o.status} />
                </td>
                <td>
                  <select
                    aria-label="Update order status"
                    value={o.status}
                    onChange={(e) => updateStatus(o, e.target.value)}
                    className="rounded-lg border border-black/10 bg-white p-2 text-xs font-bold"
                  >
                    <option>PENDING</option>
                    <option>CONFIRMED</option>
                    <option>PROCESSING</option>
                    <option>SHIPPED</option>
                    <option>DELIVERED</option>
                    <option>CANCELLED</option>
                  </select>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="p-5">
                  <Empty text="No orders yet." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Inventory({ products }: { products: Product[] }) {
  const rows = products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5">
      <h2 className="font-black tracking-[-.04em]">Inventory</h2>
      <p className="mt-1 text-xs text-ink/50">
        Variant-level stock to keep your drop available.
      </p>
      <div className="mt-5 grid gap-3">
        {rows.map(({ p, v }, i) => (
          <div
            key={`${p.id}-${i}`}
            className="flex items-center justify-between rounded-xl bg-[#f7f8f6] p-4"
          >
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="mt-1 text-xs text-ink/50">
                {v.size}
                {v.color ? ` · ${v.color}` : ""}
                {v.sku ? ` · ${v.sku}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-black ${v.stock < 5 ? "text-rose-600" : ""}`}
              >
                {v.stock}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/45">
                units in stock
              </p>
            </div>
          </div>
        ))}
        {!rows.length && (
          <Empty text="Add sizes and stock when you create a product." />
        )}
      </div>
    </section>
  );
}
function Customers({ orders }: { orders: Order[] }) {
  const customers = Object.values(
    orders.reduce((all: any, o) => {
      const key = o.customerPhone;
      all[key] ||= { ...o, count: 0, spent: 0 };
      all[key].count++;
      all[key].spent += Number(o.totalAmount);
      return all;
    }, {}),
  );
  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5">
      <h2 className="font-black tracking-[-.04em]">Customers</h2>
      <p className="mt-1 text-xs text-ink/50">
        Customer history collected through orders.
      </p>
      <div className="mt-5 space-y-2">
        {(customers as any[]).map((c) => (
          <div
            key={c.customerPhone}
            className="flex justify-between rounded-xl bg-[#f7f8f6] p-4"
          >
            <div>
              <p className="font-bold">{c.customerName}</p>
              <p className="mt-1 text-xs text-ink/50">{c.customerPhone}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">{money(c.spent)}</p>
              <p className="mt-1 text-xs text-ink/50">{c.count} order(s)</p>
            </div>
          </div>
        ))}
        {!customers.length && (
          <Empty text="Customer records will build as orders arrive." />
        )}
      </div>
    </section>
  );
}
function Categories({ categories, request, refresh, setNotice }: { categories: Category[]; request: any; refresh: () => void; setNotice: (value: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const create = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try { await request("/categories/admin", { method: "POST", body: JSON.stringify({ name, slug, description, isActive: true }) }); setName(""); setDescription(""); setNotice("Category created."); refresh(); }
    catch (error: any) { setNotice(error.message || "Could not create category."); }
    finally { setSaving(false); }
  };
  const remove = async (category: Category) => { if (!confirm(`Delete ${category.name}? Products in this category must be moved first.`)) return; try { await request(`/categories/admin/${category.id}`, { method: "DELETE" }); setNotice("Category deleted."); refresh(); } catch (error: any) { setNotice(error.message || "Could not delete category."); } };
  return <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><form onSubmit={create} className="rounded-2xl border border-black/8 bg-white p-5"><h2 className="font-black tracking-[-.04em]">Create category</h2><p className="mt-1 text-xs text-ink/50">New categories become available in the product form automatically.</p><label className="mt-6 block text-xs font-bold uppercase tracking-wider">Name<input required value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 p-3 text-sm font-normal" placeholder="Hoodies" /></label><label className="mt-4 block text-xs font-bold uppercase tracking-wider">Description<textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-black/10 p-3 text-sm font-normal" placeholder="Optional category description" /></label><button disabled={saving} className="mt-5 rounded-xl bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">{saving ? "Creating…" : "Create category"}</button></form><section className="rounded-2xl border border-black/8 bg-white"><div className="border-b border-black/8 p-5"><h2 className="font-black tracking-[-.04em]">Categories</h2></div><div className="divide-y divide-black/5">{categories.map(category => <div key={category.id} className="flex items-center justify-between p-4"><div><p className="font-bold">{category.name}</p><p className="mt-1 text-xs text-ink/50">/{category.slug} · {category._count?.products || 0} product(s)</p></div><button onClick={() => remove(category)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><FiTrash2 /></button></div>)}{!categories.length && <Empty text="Create your first category." />}</div></section></div>;
}
function Settings({ request, setNotice }: any) {
  const [form, setForm] = useState({
    storeName: "OOFY",
    storeTagline: "Wear Your Confidence",
    contactEmail: "",
    deliveryCharge: "60",
    freeShippingThreshold: "2000",
    codEnabled: true,
  });
  useEffect(() => {
    request("/admin/settings")
      .then(
        (r: any) =>
          r.data &&
          setForm({
            ...form,
            ...r.data,
            deliveryCharge: String(r.data.deliveryCharge || 60),
            freeShippingThreshold: String(r.data.freeShippingThreshold || ""),
          }),
      )
      .catch(() => {});
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setNotice("Store settings saved.");
    } catch (err: any) {
      setNotice(err.message);
    }
  };
  return (
    <form
      onSubmit={save}
      className="max-w-2xl rounded-2xl border border-black/8 bg-white p-5"
    >
      <h2 className="font-black tracking-[-.04em]">Store settings</h2>
      <p className="mt-1 text-xs text-ink/50">
        Control the details that power checkout.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ["Store name", "storeName"],
          ["Store tagline", "storeTagline"],
          ["Contact email", "contactEmail"],
          ["Delivery charge (৳)", "deliveryCharge"],
          ["Free shipping above (৳)", "freeShippingThreshold"],
        ].map(([label, key]) => (
          <label
            key={key}
            className="text-xs font-bold uppercase tracking-wider"
          >
            {label}
            <input
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-3 text-sm font-normal outline-none focus:border-blue"
            />
          </label>
        ))}
      </div>
      <label className="mt-5 flex items-center gap-3 rounded-xl bg-[#f7f8f6] p-3 text-sm font-bold">
        <input
          type="checkbox"
          checked={form.codEnabled}
          onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })}
        />{" "}
        Cash on delivery enabled
      </label>
      <button className="mt-6 rounded-xl bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
        Save settings
      </button>
    </form>
  );
}
function ProductEditor({ product, request, close, saved }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    material: product?.material || "",
    fit: product?.fit || "",
    careInstructions: product?.careInstructions || "",
    countryOfOrigin: product?.countryOfOrigin || "Bangladesh",
    basePrice: product ? String(product.basePrice) : "",
    categoryId: product?.categoryId || "",
    image: "",
    published: product?.isPublished ?? true,
    featured: product?.isFeatured ?? false,
    variants: product?.variants?.length
      ? product.variants
      : ["XS", "S", "M", "L", "XL", "XXL"].map((size) => ({ size, color: "Black", stock: 0, sku: "" })),
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; alt?: string }[]>(product?.images || []);
  useEffect(() => { request("/categories/admin/all").then((data: any) => setCategories(data.data || [])).catch((error: Error) => setError(error.message)); }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name,
      slug:
        form.slug ||
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: form.description,
      shortDescription: form.shortDescription,
      material: form.material,
      fit: form.fit,
      careInstructions: form.careInstructions,
      countryOfOrigin: form.countryOfOrigin,
      basePrice: form.basePrice,
      categoryId: form.categoryId,
      isPublished: form.published,
      isFeatured: form.featured,
      images,
      variants: form.variants.map((v: Variant) => ({
        ...v,
        stock: Number(v.stock),
      })),
    };
    try {
      const data = await request(
        product ? `/admin/products/${product.id}` : "/admin/products",
        { method: product ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      saved(data.data);
    } catch (e: any) {
      setError(
        e.message ||
          "Could not save product. Choose a category from your backend first.",
      );
    }
  };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024)
      return setError("Image must be smaller than 5 MB.");
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const data = await request("/admin/uploads/image", {
        method: "POST",
        body,
      });
      setImages((current) => [...current, { url: data.data.url }]);
    } catch (e: any) {
      setError(e.message || "Cloudinary upload failed.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-ink/45 p-4 md:p-8">
      <form
        onSubmit={submit}
        className="mx-auto max-w-3xl rounded-2xl bg-[#f6f7f5] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 p-5">
          <div>
            <h2 className="font-black tracking-[-.04em]">
              {product ? "Edit product" : "Add a product"}
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              Publish a complete product with imagery and stock.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 hover:bg-black/5"
          >
            <FiX />
          </button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider">
            Product name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"
              placeholder="Essential black tee"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">
            URL slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"
              placeholder="essential-black-tee"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">
            Price (৳)
            <input
              required
              inputMode="decimal"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"
              placeholder="1250"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Category
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"><option value="">Choose a category</option>{categories.filter(c => c.isActive).map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
          </label>
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider">
              Product image URL
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"
                placeholder="https://..."
              />
            </label>
            <button type="button" onClick={() => { if (form.image.trim()) { setImages([...images, { url: form.image.trim() }]); setForm({ ...form, image: "" }); } }} className="mt-2 text-xs font-bold text-blue">Add image URL</button>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/20 bg-white px-3 py-2 text-xs font-bold">
              <FiPlus /> {uploading ? "Uploading…" : "Upload to Cloudinary"}
              <input
                disabled={uploading}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadImage(e.target.files?.[0])}
              />
            </label>
            <span className="ml-3 text-xs text-ink/45">
              JPG, PNG, or WebP up to 5 MB
            </span>
            <div className="mt-3 grid grid-cols-4 gap-2">{images.map((image, index) => <div className="relative" key={`${image.url}-${index}`}><img src={image.url} alt="Product" className="h-24 w-full rounded-lg object-cover"/><span className="absolute left-1 top-1 rounded bg-ink px-1 text-[9px] font-bold text-white">{index === 0 ? "CARD" : index + 1}</span><button type="button" onClick={() => setImages(images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-1 top-1 rounded bg-white p-1 text-rose-600"><FiX /></button></div>)}</div>
          </div>
          <label className="md:col-span-2 text-xs font-bold uppercase tracking-wider">
            Short product summary
            <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} maxLength={180} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal" placeholder="A concise line shown on collection cards" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">Material<input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal" placeholder="240 GSM cotton" /></label>
          <label className="text-xs font-bold uppercase tracking-wider">Fit<input value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal" placeholder="Oversized fit" /></label>
          <label className="text-xs font-bold uppercase tracking-wider">Country of origin<input value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal" /></label>
          <label className="text-xs font-bold uppercase tracking-wider">Care instructions<input value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal" placeholder="Cold wash inside out" /></label>
          <label className="md:col-span-2 text-xs font-bold uppercase tracking-wider">
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-normal"
              placeholder="Fabric, fit, and details…"
            />
          </label>
        </div>
        <div className="border-y border-black/8 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider">
              Sizes & inventory
            </p>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  variants: [
                    ...form.variants,
                    { size: "", color: "", stock: 0, sku: "" },
                  ],
                })
              }
              className="text-xs font-bold text-blue"
            >
              <FiPlus className="inline" /> Add size
            </button>
          </div>
          {form.variants.map((v: Variant, index: number) => (
            <div
              className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2"
              key={index}
            >
              {["size", "color", "stock"].map((k) => (
                <input
                  key={k}
                  required={k !== "color"}
                  value={(v as any)[k] ?? ""}
                  onChange={(e) => {
                    const variants = [...form.variants];
                    (variants[index] as any)[k] =
                      k === "stock" ? Number(e.target.value) : e.target.value;
                    setForm({ ...form, variants });
                  }}
                  placeholder={k}
                  className="min-w-0 rounded-lg border border-black/10 bg-white px-2 py-2 text-sm capitalize"
                />
              ))}
              <button
                type="button"
                aria-label="Remove size"
                onClick={() =>
                  setForm({
                    ...form,
                    variants: form.variants.filter(
                      (_: any, i: number) => i !== index,
                    ),
                  })
                }
                className="rounded-lg p-2 text-rose-500"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-5 p-5">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />{" "}
            Publish now
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />{" "}
            Feature on home
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="ml-auto rounded-xl bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
            <FiCheck className="mr-2 inline" /> Save product
          </button>
        </div>
      </form>
    </div>
  );
}
