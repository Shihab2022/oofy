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
  FiPercent,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiSliders,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
  FiStar,
  FiClock,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiFilter,
  FiTag,
  FiCalendar,
  FiRefreshCw,
  FiTrendingUp,
  FiAlertTriangle,
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
  discountPrice?: string | number | null;
  isPublished: boolean;
  isFeatured?: boolean;
  isFreeDelivery?: boolean;
  isScheduled?: boolean;
  scheduledAt?: string | null;
  isCurrentlyLive?: boolean;
  careInstructions?: string | null;
  description?: string;
  shortDescription?: string | null;
  material?: string | null;
  fit?: string | null;
  countryOfOrigin?: string | null;
  category?: { name: string; id?: string };
  categoryId?: string;
  images: { url: string; alt?: string }[];
  variants: Variant[];
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district?: string;
  totalAmount: string | number;
  subtotal?: string | number;
  deliveryCharge?: string | number;
  status: string;
  createdAt: string;
  items: unknown[];
  paymentMethod?: string;
  orderNotes?: string | null;
  payments?: { method: string; transactionId?: string | null }[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  _count?: { products: number };
};

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
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  // Modern Toast & Modal Confirm States (Item 4)
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" | "info" }[]
  >([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now();
    setToasts((curr) => [...curr, { id, message, type }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, 3800);
  };

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      ...options,
    });
  };

  const nav = [
    ["Overview", FiGrid],
    ["Products", FiPackage],
    ["Promotions", FiPercent],
    ["Orders", FiShoppingBag],
    ["Inventory", FiBox],
    ["Customers", FiUsers],
    ["Categories", FiSliders],
    ["Store settings", FiSettings],
  ];

  // URL Tab Route Synchronization (Item 10)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam =
        params.get("tab") || window.location.hash.replace("#", "");
      if (tabParam) {
        const found = nav.find(
          ([label]: any) =>
            label.toLowerCase().replace(/\s+/g, "-") ===
              tabParam.toLowerCase() ||
            label.toLowerCase() === tabParam.toLowerCase()
        );
        if (found) setActive(found[0]);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTab = (tabName: string) => {
    setActive(tabName);
    if (typeof window !== "undefined") {
      const slug = tabName.toLowerCase().replace(/\s+/g, "-");
      const url = new URL(window.location.href);
      url.searchParams.set("tab", slug);
      window.history.replaceState({}, "", url.toString());
    }
  };

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
        request("/orders/admin?limit=100"),
        request("/categories/admin/all"),
      ]);
      setProducts(productData.data || []);
      setOrders(orderData.data?.orders || []);
      setCategories(categoryData.data || []);
    } catch {
      setProducts(demoProducts);
      showToast(
        "Showing preview data — connect backend for live database.",
        "info"
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
    0
  );

  const revenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const pageTitle = active === "Overview" ? "Good morning, OOFY." : active;

  const removeProduct = (id: string, name: string) => {
    showConfirm({
      title: "Delete Product?",
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete Product",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await request(`/admin/products/${id}`, { method: "DELETE" });
          setProducts(products.filter((p) => p.id !== id));
          showToast(`"${name}" removed successfully.`, "success");
        } catch (e: any) {
          showToast(e.message || "Failed to delete product.", "error");
        }
      },
    });
  };

  const updateStatus = async (order: Order, status: string) => {
    try {
      await request(`/orders/admin/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders(orders.map((o) => (o.id === order.id ? { ...o, status } : o)));
      showToast(`Order #${order.orderNumber} updated to ${status}.`, "success");
    } catch (e: any) {
      showToast(e.message || "Status update failed.", "error");
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-[#151915]">
      {/* Toast Notification Container (Item 4) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 shadow-2xl border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-3 ${
              t.type === "success"
                ? "bg-[#121512] text-white border-lime/40"
                : t.type === "error"
                ? "bg-rose-900 text-white border-rose-500/50"
                : "bg-white text-ink border-black/10"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && (
                <FiCheckCircle className="text-lime text-base flex-shrink-0" />
              )}
              {t.type === "error" && (
                <FiAlertCircle className="text-rose-400 text-base flex-shrink-0" />
              )}
              {t.type === "info" && (
                <FiClock className="text-sky-500 text-base flex-shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() =>
                setToasts((curr) => curr.filter((item) => item.id !== t.id))
              }
              className="p-1 text-white/50 hover:text-white"
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal (Item 4 - Zero native confirm alerts) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-black/10">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  confirmModal.isDestructive
                    ? "bg-rose-100 text-rose-600"
                    : "bg-lime/20 text-ink"
                }`}
              >
                <FiAlertTriangle className="text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black tracking-tight text-ink">
                  {confirmModal.title}
                </h3>
                <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-black/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all ${
                  confirmModal.isDestructive
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-ink hover:bg-black/80"
                }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
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
              onClick={() => changeTab(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                active === label
                  ? "bg-lime text-ink font-bold"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
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

      {/* Main Workspace */}
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
            <button
              onClick={() => {
                setEditing(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80 transition-all shadow-sm"
            >
              <FiPlus /> Add product
            </button>
          </div>
        </header>

        <section className="p-5 md:p-9">
          {active === "Overview" && (
            <Overview
              products={products}
              orders={orders}
              revenue={revenue}
              stock={stock}
              onOrders={() => changeTab("Orders")}
              onPromotions={() => changeTab("Promotions")}
              onInventory={() => changeTab("Inventory")}
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
              request={request}
              refresh={loadData}
              showToast={showToast}
              onGoToPromotions={() => changeTab("Promotions")}
            />
          )}

          {active === "Promotions" && (
            <Promotions
              products={products}
              categories={categories}
              request={request}
              refresh={loadData}
              showToast={showToast}
              showConfirm={showConfirm}
              onEdit={(p: Product) => {
                setEditing(p);
                setShowEditor(true);
              }}
            />
          )}

          {active === "Orders" && (
            <Orders orders={orders} updateStatus={updateStatus} />
          )}

          {active === "Inventory" && (
            <Inventory
              products={products}
              categories={categories}
              onEditProduct={(p: Product) => {
                setEditing(p);
                setShowEditor(true);
              }}
            />
          )}

          {active === "Customers" && <Customers orders={orders} />}

          {active === "Categories" && (
            <Categories
              categories={categories}
              request={request}
              refresh={loadData}
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}

          {active === "Store settings" && (
            <Settings request={request} showToast={showToast} />
          )}
        </section>
      </div>

      {/* Full-Page Product Studio Editor (Item 1, 2, 7) */}
      {showEditor && (
        <ProductEditor
          product={editing}
          request={request}
          close={() => setShowEditor(false)}
          showToast={showToast}
          saved={(product: Product) => {
            setProducts(
              editing
                ? products.map((p) => (p.id === product.id ? product : p))
                : [product, ...products]
            );
            setShowEditor(false);
            showToast(
              editing
                ? `"${product.name}" updated successfully.`
                : `"${product.name}" saved to catalog.`,
              "success"
            );
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

/* -------------------------------------------------------------------------- */
/*                       OVERVIEW WITH PROPER GRAPH (Item 9)                  */
/* -------------------------------------------------------------------------- */
function Overview({
  products,
  orders,
  revenue,
  stock,
  onOrders,
  onPromotions,
  onInventory,
}: any) {
  const pendingOrders = orders.filter((o: Order) => o.status === "PENDING");
  const confirmedOrders = orders.filter((o: Order) => o.status === "CONFIRMED");
  const deliveredOrders = orders.filter((o: Order) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o: Order) => o.status === "CANCELLED");

  const discountedCount = products.filter(
    (p: Product) =>
      p.discountPrice && Number(p.discountPrice) < Number(p.basePrice)
  ).length;

  const outOfStockCount = products.filter(
    (p: Product) =>
      p.variants.reduce((n, v) => n + Number(v.stock), 0) === 0
  ).length;

  const validOrders = orders.filter((o: Order) => o.status !== "CANCELLED");
  const avgOrderValue =
    validOrders.length > 0 ? Math.round(revenue / validOrders.length) : 0;

  // 7-day revenue trend dataset
  const last7Days = useMemo(() => {
    const days: { label: string; dateStr: string; total: number; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayOrders = orders.filter((o: Order) => {
        if (o.status === "CANCELLED") return false;
        return o.createdAt && o.createdAt.startsWith(dateStr);
      });

      const dayTotal = dayOrders.reduce(
        (sum: number, o: Order) => sum + Number(o.totalAmount || 0),
        0
      );

      days.push({ label, dateStr, total: dayTotal, count: dayOrders.length });
    }
    return days;
  }, [orders]);

  const maxDayRevenue = Math.max(
    ...last7Days.map((d) => d.total),
    1000
  );

  return (
    <div className="space-y-8">
      {/* 1. Top Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<FiShoppingBag />}
          label="Total Revenue"
          value={money(revenue)}
          note={`${orders.length} total store orders`}
        />
        <Metric
          icon={<FiTrendingUp />}
          label="Avg. Order Value"
          value={money(avgOrderValue)}
          note="Per confirmed purchase"
        />
        <Metric
          icon={<FiClock />}
          label="Pending Fulfillment"
          value={pendingOrders.length}
          warn={pendingOrders.length > 0}
          note="Requires packing & courier"
          action={pendingOrders.length > 0 ? onOrders : undefined}
          actionLabel="View desk →"
        />
        <Metric
          icon={<FiBox />}
          label="Catalog Inventory"
          value={`${stock.toLocaleString()} units`}
          warn={outOfStockCount > 0}
          note={
            outOfStockCount > 0
              ? `${outOfStockCount} styles out of stock`
              : "Healthy variant stock"
          }
          action={onInventory}
          actionLabel="Inventory →"
        />
      </div>

      {/* 2. Visual Analytics Section: Revenue Graph & Order Status Pipeline */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Revenue Performance Graph (SVG Chart) */}
        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-4">
            <div>
              <h2 className="text-base font-black tracking-tight text-ink flex items-center gap-2">
                <FiBarChart2 className="text-lime text-lg" />
                Sales & Revenue Velocity
              </h2>
              <p className="mt-0.5 text-xs text-ink/50">
                Gross transaction trajectory across Bangladesh over the past 7 days.
              </p>
            </div>
            <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-black text-ink">
              Live Tracker
            </span>
          </div>

          {/* SVG Visual Chart */}
          <div className="mt-6">
            <div className="h-56 w-full flex items-end gap-2 sm:gap-4 pt-6 pb-2">
              {last7Days.map((d, idx) => {
                const heightPercent = Math.max(
                  Math.round((d.total / maxDayRevenue) * 100),
                  8
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-ink text-white text-[11px] font-bold rounded-lg px-2.5 py-1.5 shadow-xl pointer-events-none whitespace-nowrap">
                      <span>{money(d.total)}</span>
                      <span className="text-[9px] text-white/60 font-normal">
                        {d.count} order(s)
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 group-hover:brightness-95 ${
                        d.total > 0
                          ? "bg-ink group-hover:bg-lime"
                          : "bg-black/10"
                      }`}
                    />

                    {/* Day Label */}
                    <span className="mt-2 text-[11px] font-bold text-ink/50 group-hover:text-ink">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-ink/50">
              <span>Peak Day: {money(maxDayRevenue)}</span>
              <span>Past 7 Days Aggregate</span>
            </div>
          </div>
        </div>

        {/* Order Status Pipeline */}
        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black tracking-tight text-ink flex items-center gap-2">
              <FiSliders className="text-sky-600" />
              Fulfillment Pipeline
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              Order processing breakdown.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  label: "Pending Review",
                  count: pendingOrders.length,
                  color: "bg-amber-500",
                },
                {
                  label: "Confirmed & Packing",
                  count: confirmedOrders.length,
                  color: "bg-sky-500",
                },
                {
                  label: "Delivered & Settled",
                  count: deliveredOrders.length,
                  color: "bg-emerald-500",
                },
                {
                  label: "Cancelled",
                  count: cancelledOrders.length,
                  color: "bg-rose-400",
                },
              ].map((item) => {
                const pct =
                  orders.length > 0
                    ? Math.round((item.count / orders.length) * 100)
                    : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-ink/75">{item.label}</span>
                      <span className="text-ink">
                        {item.count}{" "}
                        <span className="text-ink/40 font-normal">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-black/5 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${item.color} transition-all`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onOrders}
            className="mt-6 w-full rounded-xl bg-[#f7f8f6] py-3 text-xs font-bold text-ink hover:bg-black/5 transition-all flex items-center justify-center gap-1.5"
          >
            Open Order Desk <FiChevronRight />
          </button>
        </div>
      </div>

      {/* 3. Recent Orders Preview Table */}
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div>
            <h2 className="font-black tracking-[-.04em] text-base text-ink">
              Recent Transactions
            </h2>
            <p className="mt-0.5 text-xs text-ink/50">
              Latest incoming orders recorded across Bangladesh.
            </p>
          </div>
          <button
            onClick={onOrders}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink hover:underline"
          >
            All Orders <FiChevronRight />
          </button>
        </div>
        <div className="divide-y divide-black/5">
          {orders.slice(0, 6).map((o: Order) => (
            <div
              key={o.id}
              className="flex items-center justify-between py-3.5 text-sm hover:bg-black/[0.01] px-2 rounded-lg transition-colors"
            >
              <div>
                <p className="font-bold flex items-center gap-2">
                  #{o.orderNumber}
                  <span className="text-xs font-normal text-ink/40">
                    {o.district || "Dhaka"}
                  </span>
                </p>
                <p className="text-xs text-ink/45 mt-0.5">
                  {o.customerName} · {o.customerPhone}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-ink">{money(o.totalAmount)}</span>
                <Badge status={o.status} />
              </div>
            </div>
          ))}
          {!orders.length && <Empty text="No orders recorded yet." />}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note, warn, action, actionLabel }: any) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-ink/45">
          <span className="text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
          <span className="text-lg">{icon}</span>
        </div>
        <p
          className={`mt-4 text-3xl font-black tracking-tight ${
            warn ? "text-amber-600" : "text-ink"
          }`}
        >
          {value}
        </p>
      </div>
      <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
        {note && <p className="text-xs text-ink/50">{note}</p>}
        {action && (
          <button
            onClick={action}
            className="text-xs font-bold text-ink hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        statusStyle[status] || "bg-black/5 text-ink/60"
      }`}
    >
      {status}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 py-10 text-center text-sm text-ink/40">
      {text}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CATALOG VIEW                                */
/* -------------------------------------------------------------------------- */
function Products({
  products,
  search,
  setSearch,
  onEdit,
  onDelete,
  loading,
  request,
  refresh,
  showToast,
  onGoToPromotions,
}: any) {
  const toggleFeatured = async (p: Product) => {
    try {
      const next = !p.isFeatured;
      await request("/admin/products/toggle-featured", {
        method: "POST",
        body: JSON.stringify({ id: p.id, isFeatured: next }),
      });
      showToast(
        next
          ? `"${p.name}" pinned to Home spotlight.`
          : `"${p.name}" unpinned from Home spotlight.`,
        "success"
      );
      if (refresh) await refresh();
    } catch (e: any) {
      showToast(e.message || "Failed to toggle featured status", "error");
    }
  };

  return (
    <section className="rounded-2xl border border-black/8 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-black/8 p-5 md:flex-row md:items-center">
        <div>
          <h2 className="font-black tracking-[-.04em]">Catalog</h2>
          <p className="mt-1 text-xs text-ink/50">
            Products, imagery, spotlight feature, scheduled drops, and stock.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGoToPromotions}
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-black/80 transition-all"
          >
            <FiPercent className="text-sm text-lime" />
            Promotions & Free Delivery
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-ink/40 bg-white">
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="w-full text-sm outline-none"
            />
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45">
            <tr>
              <th className="p-4">Product</th>
              <th>Category</th>
              <th>Price & Discount</th>
              <th>Delivery</th>
              <th>Spotlight</th>
              <th>Stock</th>
              <th>Publish Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: Product) => {
              const hasDiscount =
                p.discountPrice &&
                Number(p.discountPrice) < Number(p.basePrice);
              const discountPct = hasDiscount
                ? Math.round(
                    ((Number(p.basePrice) - Number(p.discountPrice)) /
                      Number(p.basePrice)) *
                      100
                  )
                : 0;
              const isFreeDelivery =
                p.isFreeDelivery ||
                p.careInstructions?.includes("[FREE_DELIVERY]") ||
                p.description?.includes("[FREE_DELIVERY]");

              // Scheduled Drop status check (Item 1)
              const isScheduled =
                p.isScheduled &&
                p.scheduledAt &&
                new Date(p.scheduledAt).getTime() > Date.now();

              return (
                <tr
                  key={p.id}
                  className="border-t border-black/5 text-sm hover:bg-black/[0.015]"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-10 overflow-hidden rounded-lg bg-black/5 flex-shrink-0">
                        {p.images?.[0] && (
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold flex items-center gap-1.5">
                          {p.name}
                          {p.isFeatured && (
                            <span className="inline-flex items-center text-[10px] text-amber-500 font-bold">
                              ★
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink/45">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-ink/60">
                    {p.category?.name || "Uncategorized"}
                  </td>
                  <td>
                    {hasDiscount ? (
                      <div>
                        <span className="font-black text-rose-600">
                          {money(p.discountPrice!)}
                        </span>
                        <span className="ml-1.5 text-xs text-ink/40 line-through">
                          {money(p.basePrice)}
                        </span>
                        <span className="ml-2 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700">
                          -{discountPct}%
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold">{money(p.basePrice)}</span>
                    )}
                  </td>
                  <td>
                    {isFreeDelivery ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800">
                        <FiTruck className="text-xs" /> Free Delivery
                      </span>
                    ) : (
                      <span className="text-xs text-ink/40">Standard</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      title={
                        p.isFeatured
                          ? "Featured on Home (Click to unpin)"
                          : "Pin to Home spotlight"
                      }
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                        p.isFeatured
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-black/5 text-ink/40 hover:bg-black/10"
                      }`}
                    >
                      <FiStar
                        className={
                          p.isFeatured
                            ? "fill-amber-500 text-amber-500"
                            : "text-ink/40"
                        }
                      />
                      <span>{p.isFeatured ? "Featured" : "Normal"}</span>
                    </button>
                  </td>
                  <td>
                    {p.variants.reduce((n, v) => n + Number(v.stock), 0)}
                  </td>
                  <td>
                    {isScheduled ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black text-violet-800 uppercase tracking-wide">
                          <FiClock className="text-xs" /> Scheduled Drop
                        </span>
                        <span className="text-[10px] text-violet-900/70 mt-0.5 font-mono">
                          {new Date(p.scheduledAt!).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          p.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {p.isPublished ? "Live" : "Draft"}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(p)}
                        className="rounded-lg p-2 hover:bg-black/5"
                        title="Edit product"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => onDelete(p.id, p.name)}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        title="Delete product"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && !products.length && (
              <tr>
                <td colSpan={8} className="p-5">
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

/* -------------------------------------------------------------------------- */
/*                     PROMOTIONS & FREE DELIVERY TAB                         */
/* -------------------------------------------------------------------------- */
function Promotions({
  products,
  categories,
  request,
  refresh,
  showToast,
  showConfirm,
  onEdit,
}: {
  products: Product[];
  categories: Category[];
  request: any;
  refresh: () => void;
  showToast: (val: string, type?: "success" | "error" | "info") => void;
  showConfirm: any;
  onEdit: (p: Product) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promoSearch, setPromoSearch] = useState("");
  const [promoCategory, setPromoCategory] = useState("ALL");
  const [filterType, setFilterType] = useState<
    "ALL" | "DISCOUNTED" | "NO_DISCOUNT" | "FREE_DELIVERY" | "FEATURED"
  >("ALL");

  const [bulkPctInput, setBulkPctInput] = useState("15");
  const [busy, setBusy] = useState(false);

  // Delivery threshold state
  const [thresholdInput, setThresholdInput] = useState("2000");
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    request("/admin/settings")
      .then((res: any) => {
        if (res.data?.freeShippingThreshold !== undefined) {
          setThresholdInput(String(res.data.freeShippingThreshold || ""));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const discountedProducts = products.filter(
    (p) => p.discountPrice && Number(p.discountPrice) < Number(p.basePrice)
  );

  const freeDeliveryProducts = products.filter(
    (p) =>
      p.isFreeDelivery ||
      p.careInstructions?.includes("[FREE_DELIVERY]") ||
      p.description?.includes("[FREE_DELIVERY]")
  );

  const featuredProducts = products.filter((p) => p.isFeatured);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(promoSearch.toLowerCase());
      const matchesCat =
        promoCategory === "ALL" || p.categoryId === promoCategory;

      const hasDiscount =
        p.discountPrice && Number(p.discountPrice) < Number(p.basePrice);
      const isFree =
        p.isFreeDelivery ||
        p.careInstructions?.includes("[FREE_DELIVERY]") ||
        p.description?.includes("[FREE_DELIVERY]");

      if (!matchesSearch || !matchesCat) return false;

      if (filterType === "DISCOUNTED") return hasDiscount;
      if (filterType === "NO_DISCOUNT") return !hasDiscount;
      if (filterType === "FREE_DELIVERY") return isFree;
      if (filterType === "FEATURED") return p.isFeatured;

      return true;
    });
  }, [products, promoSearch, promoCategory, filterType]);

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((p) => p.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyDiscountToSelected = async (customPct?: number) => {
    const pct = customPct !== undefined ? customPct : Number(bulkPctInput);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      showToast("Please enter a valid percentage between 1% and 99%.", "error");
      return;
    }
    if (selectedIds.length === 0) {
      showToast("Please select at least one product using checkboxes.", "info");
      return;
    }

    setBusy(true);
    try {
      const res = await request("/admin/products/bulk-discount", {
        method: "POST",
        body: JSON.stringify({
          productIds: selectedIds,
          discountPercent: pct,
        }),
      });
      showToast(
        res.message ||
          `Applied ${pct}% discount to ${selectedIds.length} products.`,
        "success"
      );
      setSelectedIds([]);
      await refresh();
    } catch (e: any) {
      showToast(e.message || "Failed to apply discount", "error");
    } finally {
      setBusy(false);
    }
  };

  const clearDiscountsFromSelected = () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one product.", "info");
      return;
    }

    showConfirm({
      title: "Remove Discounts?",
      message: `Remove promotional discounts from ${selectedIds.length} selected product(s)?`,
      confirmText: "Remove Discounts",
      isDestructive: false,
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await request("/admin/products/bulk-discount", {
            method: "POST",
            body: JSON.stringify({
              productIds: selectedIds,
              clearAll: true,
            }),
          });
          showToast(
            res.message ||
              `Discounts cleared from ${selectedIds.length} products.`,
            "success"
          );
          setSelectedIds([]);
          await refresh();
        } catch (e: any) {
          showToast(e.message || "Failed to clear discounts", "error");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const updateFreeDeliverySelected = async (enable: boolean) => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one product.", "info");
      return;
    }

    setBusy(true);
    try {
      const res = await request("/admin/products/bulk-free-delivery", {
        method: "POST",
        body: JSON.stringify({
          productIds: selectedIds,
          enable,
        }),
      });
      showToast(
        res.message ||
          (enable
            ? `Free delivery enabled on ${selectedIds.length} items.`
            : `Free delivery removed from ${selectedIds.length} items.`),
        "success"
      );
      setSelectedIds([]);
      await refresh();
    } catch (e: any) {
      showToast(e.message || "Failed to update free delivery", "error");
    } finally {
      setBusy(false);
    }
  };

  const applySitewideDiscount = () => {
    const pct = Number(bulkPctInput);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      showToast("Please enter a valid percentage between 1% and 99%.", "error");
      return;
    }

    showConfirm({
      title: "Launch Sitewide Sale?",
      message: `Apply ${pct}% discount to ALL ${products.length} products across your store?`,
      confirmText: `Apply ${pct}% Sitewide`,
      isDestructive: false,
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await request("/admin/products/bulk-discount", {
            method: "POST",
            body: JSON.stringify({ discountPercent: pct }),
          });
          showToast(
            res.message || `Applied ${pct}% discount sitewide!`,
            "success"
          );
          await refresh();
        } catch (e: any) {
          showToast(e.message || "Failed to apply sitewide discount", "error");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const clearAllDiscountsSitewide = () => {
    showConfirm({
      title: "Clear All Storewide Discounts?",
      message:
        "Are you sure you want to remove discounts from ALL products? All items will return to their regular base retail pricing.",
      confirmText: "Clear All Discounts",
      isDestructive: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await request("/admin/products/bulk-discount", {
            method: "POST",
            body: JSON.stringify({ clearAll: true }),
          });
          showToast(
            res.message || "All storewide discounts cleared.",
            "success"
          );
          await refresh();
        } catch (e: any) {
          showToast(e.message || "Failed to clear discounts", "error");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const toggleSitewideFreeDelivery = (enable: boolean) => {
    showConfirm({
      title: enable ? "Enable Free Delivery on All?" : "Remove Free Delivery?",
      message: enable
        ? "Enable Free Delivery badge and zero shipping on ALL catalog products?"
        : "Remove Free Delivery badge from ALL catalog products?",
      confirmText: enable ? "Enable on All" : "Remove Free Delivery",
      isDestructive: !enable,
      onConfirm: async () => {
        setBusy(true);
        try {
          const res = await request("/admin/products/bulk-free-delivery", {
            method: "POST",
            body: JSON.stringify(
              enable ? { enableAll: true } : { clearAll: true }
            ),
          });
          showToast(
            res.message ||
              (enable
                ? "Free delivery enabled on all products."
                : "Free delivery removed from all products."),
            "success"
          );
          await refresh();
        } catch (e: any) {
          showToast(e.message || "Failed to update free delivery", "error");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          freeShippingThreshold: thresholdInput,
        }),
      });
      showToast(
        thresholdInput === "0"
          ? "Storewide Free Delivery enabled on ALL orders!"
          : `Free shipping threshold updated to ৳${thresholdInput}.`,
        "success"
      );
    } catch (e: any) {
      showToast(e.message || "Failed to save threshold", "error");
    } finally {
      setSavingThreshold(false);
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      const next = !p.isFeatured;
      await request("/admin/products/toggle-featured", {
        method: "POST",
        body: JSON.stringify({ id: p.id, isFeatured: next }),
      });
      showToast(
        next
          ? `"${p.name}" pinned to Home spotlight.`
          : `"${p.name}" unpinned from Home spotlight.`,
        "success"
      );
      await refresh();
    } catch (e: any) {
      showToast(e.message || "Failed to toggle featured status", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Discount Status Card */}
        <div
          className={`rounded-2xl border p-5 shadow-sm transition-all ${
            discountedProducts.length === 0
              ? "border-amber-200 bg-amber-50/60"
              : "border-rose-200 bg-rose-50/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink/70">
              <FiPercent
                className={
                  discountedProducts.length === 0
                    ? "text-amber-500"
                    : "text-rose-600"
                }
              />
              Catalog Discounts
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                discountedProducts.length === 0
                  ? "bg-amber-200 text-amber-900"
                  : "bg-rose-200 text-rose-900"
              }`}
            >
              {discountedProducts.length === 0 ? "Inactive" : "Active"}
            </span>
          </div>

          <div className="mt-3">
            {discountedProducts.length === 0 ? (
              <div>
                <p className="text-sm font-bold text-amber-950">
                  No active discounts applied
                </p>
                <p className="mt-1 text-xs text-amber-800/80">
                  All products are currently selling at standard retail price.
                  Select products below to launch a sale.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-black text-rose-700">
                  {discountedProducts.length} Product(s) on Sale
                </p>
                <p className="mt-1 text-xs text-rose-800">
                  {Math.round(
                    (discountedProducts.length / (products.length || 1)) * 100
                  )}
                  % of total catalog items have an active discounted price.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={clearAllDiscountsSitewide}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 underline hover:text-rose-900"
                >
                  <FiX /> Clear all discounts sitewide
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Free Delivery Status Card */}
        <div
          className={`rounded-2xl border p-5 shadow-sm transition-all ${
            freeDeliveryProducts.length === 0
              ? "border-stone-200 bg-stone-50"
              : "border-emerald-200 bg-emerald-50/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink/70">
              <FiTruck
                className={
                  freeDeliveryProducts.length === 0
                    ? "text-stone-400"
                    : "text-emerald-600"
                }
              />
              Free Delivery Status
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                freeDeliveryProducts.length === 0
                  ? "bg-stone-200 text-stone-700"
                  : "bg-emerald-200 text-emerald-900"
              }`}
            >
              {freeDeliveryProducts.length === 0 ? "Not Active" : "Enabled"}
            </span>
          </div>

          <div className="mt-3">
            {freeDeliveryProducts.length === 0 ? (
              <div>
                <p className="text-sm font-bold text-stone-800">
                  Free delivery is not implemented on individual products
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  Standard delivery charge is applied to carts unless the order
                  meets the minimum spending threshold.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-black text-emerald-800">
                  {freeDeliveryProducts.length} Free Shipping Item(s)
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Customers pay ৳0 delivery when ordering these specific
                  products.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleSitewideFreeDelivery(false)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  <FiX /> Remove free delivery from all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Free Shipping Minimum Threshold Card */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-900">
              <FiShoppingBag className="text-sky-600" />
              Free Delivery Threshold
            </span>
            <span className="rounded-full bg-sky-200 px-2 py-0.5 text-[10px] font-black uppercase text-sky-900">
              Rule
            </span>
          </div>

          <p className="mt-2 text-xs text-sky-800">
            Automatically grant 100% free delivery when cart subtotal reaches
            this amount:
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-sky-900/50">
                ৳
              </span>
              <input
                type="number"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="2000"
                className="w-full rounded-xl border border-sky-300 bg-white py-2 pl-7 pr-3 text-sm font-bold text-sky-950 outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="button"
              disabled={savingThreshold}
              onClick={saveThreshold}
              className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {savingThreshold ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-sky-900/70">
            <span>Set to 0 for nationwide 100% free delivery.</span>
            <button
              type="button"
              onClick={() => {
                setThresholdInput("0");
              }}
              className="font-bold underline hover:text-sky-950"
            >
              Set ৳0 (All Free)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Products Multi-Select Manager Table */}
      <section className="rounded-2xl border border-black/8 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-black/8 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-black tracking-[-.03em] text-ink text-base">
              Manage Discounts & Delivery by Product
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              Select specific products (e.g. 10, 50, or 100 products out of
              thousands) to apply or clear promotions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs text-ink/60">
              <FiSearch />
              <input
                type="text"
                placeholder="Search catalog…"
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                className="bg-transparent outline-none w-36 sm:w-44"
              />
            </div>

            <select
              value={promoCategory}
              onChange={(e) => setPromoCategory(e.target.value)}
              className="rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs font-bold text-ink outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs font-bold text-ink outline-none"
            >
              <option value="ALL">All Status ({products.length})</option>
              <option value="DISCOUNTED">
                Discounted On Sale ({discountedProducts.length})
              </option>
              <option value="NO_DISCOUNT">
                Full Price Regular (
                {products.length - discountedProducts.length})
              </option>
              <option value="FREE_DELIVERY">
                Free Delivery ({freeDeliveryProducts.length})
              </option>
              <option value="FEATURED">
                Featured Spotlight ({featuredProducts.length})
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8f9f7] px-5 py-3 border-b border-black/5 text-xs font-bold">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredProducts.length > 0 &&
                  filteredProducts.every((p) => selectedIds.includes(p.id))
                }
                onChange={toggleSelectAllVisible}
                className="h-4 w-4 rounded accent-ink cursor-pointer"
              />
              <span>Select All Visible ({filteredProducts.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <span className="rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-black text-ink">
                {selectedIds.length} item(s) selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear Selection
              </button>
            ) : (
              <span className="text-ink/40 font-normal">
                Check boxes below to apply bulk changes to specific products.
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#f2f3f0] text-[10px] uppercase tracking-wider text-ink/45">
              <tr>
                <th className="p-4 w-10"></th>
                <th>Product</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Current Deal</th>
                <th>Free Delivery</th>
                <th>Home Spotlight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const hasDiscount =
                  p.discountPrice &&
                  Number(p.discountPrice) < Number(p.basePrice);
                const discountPct = hasDiscount
                  ? Math.round(
                      ((Number(p.basePrice) - Number(p.discountPrice)) /
                        Number(p.basePrice)) *
                        100
                    )
                  : 0;
                const isFree =
                  p.isFreeDelivery ||
                  p.careInstructions?.includes("[FREE_DELIVERY]") ||
                  p.description?.includes("[FREE_DELIVERY]");

                return (
                  <tr
                    key={p.id}
                    className={`border-t border-black/5 text-sm transition-colors ${
                      isSelected ? "bg-lime/10" : "hover:bg-black/[0.015]"
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(p.id)}
                        className="h-4 w-4 rounded accent-ink cursor-pointer"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-9 overflow-hidden rounded-lg bg-black/5 flex-shrink-0">
                          {p.images?.[0] && (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-bold flex items-center gap-1.5">
                            {p.name}
                            {p.isFeatured && (
                              <span className="text-amber-500 text-xs font-bold">
                                ★
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-ink/40">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink/60 text-xs font-semibold">
                      {p.category?.name || "Uncategorized"}
                    </td>
                    <td className="font-bold text-ink">
                      {money(p.basePrice)}
                    </td>
                    <td>
                      {hasDiscount ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-rose-600">
                            {money(p.discountPrice!)}
                          </span>
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700">
                            -{discountPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 font-medium">
                          No discount
                        </span>
                      )}
                    </td>
                    <td>
                      {isFree ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          <FiTruck className="text-xs" /> Free
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Standard</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(p)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                          p.isFeatured
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-black/5 text-ink/40 hover:bg-black/10"
                        }`}
                      >
                        <FiStar
                          className={
                            p.isFeatured
                              ? "fill-amber-500 text-amber-500"
                              : "text-ink/40"
                          }
                        />
                        <span>{p.isFeatured ? "Featured" : "Spotlight"}</span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="rounded-lg p-1.5 text-xs font-bold text-ink/60 hover:bg-black/5 hover:text-ink"
                        title="Edit product in studio"
                      >
                        <FiEdit2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-ink/50 text-sm"
                  >
                    No products match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Sticky Bottom Bulk Action Bar for Selected Products */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-6 z-30 mx-auto max-w-4xl rounded-2xl bg-ink p-4 text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-ink">
                {selectedIds.length} Selected
              </span>
              <p className="text-xs text-white/70">
                Choose promotion actions for your selected items:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/15">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={bulkPctInput}
                  onChange={(e) => setBulkPctInput(e.target.value)}
                  className="w-14 bg-white px-2 py-1 text-xs font-bold text-ink rounded-lg outline-none"
                  placeholder="20"
                />
                <span className="text-xs font-bold text-white/70">%</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => applyDiscountToSelected()}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  Apply %
                </button>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={clearDiscountsFromSelected}
                className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
              >
                Clear Discount
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => updateFreeDeliverySelected(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <FiTruck /> Free Delivery
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => updateFreeDeliverySelected(false)}
                className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Remove Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sitewide Global Campaigns Section */}
      <section className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <h3 className="font-black tracking-[-.03em] text-ink text-base">
          Storewide Bulk Campaigns (All Products)
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          Apply a promotional rule to every single item across your entire store
          in one click.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Sitewide Discount Box */}
          <div className="rounded-xl border border-black/10 bg-[#fbfbf9] p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              All-Product Storewide Sale
            </h4>
            <p className="mt-1 text-xs text-ink/60">
              Applies a percentage discount calculated from each product's base
              price across the entire catalog.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="90"
                value={bulkPctInput}
                onChange={(e) => setBulkPctInput(e.target.value)}
                className="w-20 rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-ink outline-none"
                placeholder="20%"
              />
              <button
                type="button"
                disabled={busy}
                onClick={applySitewideDiscount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Apply to ALL Products
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={clearAllDiscountsSitewide}
                className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                Clear All
              </button>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-ink/40">Presets:</span>
              {[10, 15, 20, 25, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setBulkPctInput(String(pct))}
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                    bulkPctInput === String(pct)
                      ? "border-rose-600 bg-rose-50 text-rose-700"
                      : "border-black/10 bg-white text-ink/70 hover:bg-black/5"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Sitewide Free Delivery Box */}
          <div className="rounded-xl border border-black/10 bg-[#fbfbf9] p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Free Delivery Across All Catalog Items
            </h4>
            <p className="mt-1 text-xs text-ink/60">
              Flags all products with the Free Delivery badge and eliminates the
              delivery fee on checkout.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => toggleSitewideFreeDelivery(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <FiTruck /> Enable on All
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => toggleSitewideFreeDelivery(false)}
                className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink/70 hover:bg-black/5 disabled:opacity-50"
              >
                Disable on All
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ORDERS VIEW                                 */
/* -------------------------------------------------------------------------- */
function Orders({ orders, updateStatus }: any) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white shadow-sm">
      <div className="border-b border-black/8 p-5">
        <h2 className="font-black tracking-[-.04em]">Order desk</h2>
        <p className="mt-1 text-xs text-ink/50">
          Confirm, pack, ship, and complete each customer order.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45">
            <tr>
              <th className="p-4">Order</th>
              <th>Customer</th>
              <th>Payment</th>
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
                    {o.items.length} item(s) · {o.district || "Dhaka"}
                  </span>
                </td>
                <td>
                  {o.customerName}
                  <span className="mt-1 block text-xs text-ink/45">
                    {o.customerPhone}
                  </span>
                </td>
                <td>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      o.paymentMethod === "BKASH"
                        ? "bg-[#E2136E]/10 text-[#E2136E]"
                        : o.paymentMethod === "NAGAD"
                        ? "bg-[#F7941D]/10 text-[#F7941D]"
                        : "bg-black/5 text-ink/75"
                    }`}
                  >
                    {o.paymentMethod || "COD"}
                  </span>
                  {o.orderNotes && (
                    <span
                      className="mt-0.5 block max-w-[160px] truncate text-[10px] font-mono text-ink/50"
                      title={o.orderNotes}
                    >
                      {o.orderNotes}
                    </span>
                  )}
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
                <td colSpan={7} className="p-5">
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

/* -------------------------------------------------------------------------- */
/*            INVENTORY TAB WITH ADVANCED FILTER & SORT (Item 8)             */
/* -------------------------------------------------------------------------- */
function Inventory({
  products,
  categories,
  onEditProduct,
}: {
  products: Product[];
  categories: Category[];
  onEditProduct: (p: Product) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<
    "ALL" | "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK"
  >("ALL");
  const [sizeFilter, setSizeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<
    "STOCK_ASC" | "STOCK_DESC" | "NAME_ASC" | "NAME_DESC"
  >("STOCK_ASC");

  // Flatten products into variant rows
  const allRows = useMemo(() => {
    return products.flatMap((p) =>
      p.variants.map((v) => ({
        product: p,
        variant: v,
        key: `${p.id}-${v.id || v.size}-${v.color || "def"}`,
      }))
    );
  }, [products]);

  // Available unique sizes for filter
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => {
      if (r.variant.size) set.add(r.variant.size.toUpperCase());
    });
    return Array.from(set).sort();
  }, [allRows]);

  // Summary Metrics
  const totalStockUnits = allRows.reduce(
    (sum, r) => sum + (Number(r.variant.stock) || 0),
    0
  );
  const outOfStockVariants = allRows.filter((r) => Number(r.variant.stock) === 0);
  const lowStockVariants = allRows.filter(
    (r) => Number(r.variant.stock) > 0 && Number(r.variant.stock) < 5
  );

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let result = allRows.filter((r) => {
      const matchSearch =
        r.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.variant.sku &&
          r.variant.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.variant.color &&
          r.variant.color.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        categoryFilter === "ALL" || r.product.categoryId === categoryFilter;

      const matchSize =
        sizeFilter === "ALL" ||
        r.variant.size.toUpperCase() === sizeFilter.toUpperCase();

      const st = Number(r.variant.stock) || 0;
      let matchStock = true;
      if (stockFilter === "OUT_OF_STOCK") matchStock = st === 0;
      if (stockFilter === "LOW_STOCK") matchStock = st > 0 && st < 5;
      if (stockFilter === "IN_STOCK") matchStock = st >= 5;

      return matchSearch && matchCategory && matchSize && matchStock;
    });

    // Sort
    result.sort((a, b) => {
      const stockA = Number(a.variant.stock) || 0;
      const stockB = Number(b.variant.stock) || 0;
      if (sortBy === "STOCK_ASC") return stockA - stockB;
      if (sortBy === "STOCK_DESC") return stockB - stockA;
      if (sortBy === "NAME_ASC") return a.product.name.localeCompare(b.product.name);
      if (sortBy === "NAME_DESC") return b.product.name.localeCompare(a.product.name);
      return 0;
    });

    return result;
  }, [allRows, searchTerm, categoryFilter, sizeFilter, stockFilter, sortBy]);

  return (
    <section className="space-y-6">
      {/* 1. Inventory Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Total Inventory
          </span>
          <p className="mt-3 text-3xl font-black text-ink">
            {totalStockUnits.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-ink/50">Units currently on hand</p>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Tracked SKUs
          </span>
          <p className="mt-3 text-3xl font-black text-ink">{allRows.length}</p>
          <p className="mt-1 text-xs text-ink/50">Across {products.length} styles</p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-sm transition-all ${
            lowStockVariants.length > 0
              ? "border-amber-200 bg-amber-50/70"
              : "border-black/8 bg-white"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Low Stock (&lt; 5 Units)
          </span>
          <p className="mt-3 text-3xl font-black text-amber-900">
            {lowStockVariants.length}
          </p>
          <p className="mt-1 text-xs text-amber-800">Needs reordering soon</p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-sm transition-all ${
            outOfStockVariants.length > 0
              ? "border-rose-200 bg-rose-50/70"
              : "border-black/8 bg-white"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
            Out of Stock (0 Units)
          </span>
          <p className="mt-3 text-3xl font-black text-rose-900">
            {outOfStockVariants.length}
          </p>
          <p className="mt-1 text-xs text-rose-800">Requires restock batch</p>
        </div>
      </div>

      {/* 2. Inventory Filter & Controls Bar */}
      <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-black tracking-[-.04em] text-base text-ink">
              Variant Inventory Matrix
            </h2>
            <p className="mt-0.5 text-xs text-ink/50">
              Filter by stock status, size, and category with real-time sorting.
            </p>
          </div>

          <span className="text-xs font-bold text-ink/60">
            Showing {processedRows.length} of {allRows.length} variant rows
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs text-ink/60">
            <FiSearch />
            <input
              type="text"
              placeholder="Search product / SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs font-bold text-ink outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Level Filter */}
          <select
            value={stockFilter}
            onChange={(e: any) => setStockFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs font-bold text-ink outline-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW_STOCK">
              Low Stock (&lt; 5 Units) ({lowStockVariants.length})
            </option>
            <option value="OUT_OF_STOCK">
              Out of Stock (0 Units) ({outOfStockVariants.length})
            </option>
            <option value="IN_STOCK">Well Stocked (≥ 5 Units)</option>
          </select>

          {/* Size Filter */}
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs font-bold text-ink outline-none"
          >
            <option value="ALL">All Sizes</option>
            {availableSizes.map((s) => (
              <option key={s} value={s}>
                Size {s}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-xl border border-black/10 bg-ink px-3 py-2 text-xs font-bold text-white outline-none"
          >
            <option value="STOCK_ASC">Stock: Low to High (Restock First)</option>
            <option value="STOCK_DESC">Stock: High to Low</option>
            <option value="NAME_ASC">Name: A to Z</option>
            <option value="NAME_DESC">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* 3. Detailed Inventory Table */}
      <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45">
              <tr>
                <th className="p-4">Product Style</th>
                <th>Category</th>
                <th>Size</th>
                <th>Colorway</th>
                <th>SKU</th>
                <th>Stock Status</th>
                <th className="text-right p-4">Units</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {processedRows.map(({ product, variant, key }) => {
                const count = Number(variant.stock) || 0;
                return (
                  <tr
                    key={key}
                    className="hover:bg-black/[0.015] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-9 rounded-lg bg-black/5 overflow-hidden flex-shrink-0">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{product.name}</p>
                          <p className="text-xs text-ink/40">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-ink/60 font-medium">
                      {product.category?.name || "Uncategorized"}
                    </td>
                    <td>
                      <span className="inline-block rounded-md bg-black/5 px-2.5 py-1 text-xs font-black text-ink">
                        {variant.size}
                      </span>
                    </td>
                    <td className="text-xs text-ink/75 font-semibold">
                      {variant.color || "Standard"}
                    </td>
                    <td className="text-xs font-mono text-ink/45">
                      {variant.sku || "—"}
                    </td>
                    <td>
                      {count === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-700">
                          Out of Stock
                        </span>
                      ) : count < 5 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="text-right p-4">
                      <span
                        className={`text-base font-black ${
                          count === 0
                            ? "text-rose-600"
                            : count < 5
                            ? "text-amber-600"
                            : "text-ink"
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="rounded-lg p-2 text-ink/50 hover:bg-black/5 hover:text-ink"
                        title="Edit product stock in studio"
                      >
                        <FiEdit2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {processedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-ink/50 text-sm"
                  >
                    No variant inventory matches your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CUSTOMERS VIEW                               */
/* -------------------------------------------------------------------------- */
function Customers({ orders }: { orders: Order[] }) {
  const customers = Object.values(
    orders.reduce((all: any, o) => {
      const key = o.customerPhone;
      all[key] ||= { ...o, count: 0, spent: 0 };
      all[key].count++;
      all[key].spent += Number(o.totalAmount);
      return all;
    }, {})
  );
  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
      <h2 className="font-black tracking-[-.04em]">Customers</h2>
      <p className="mt-1 text-xs text-ink/50">
        Customer history collected through orders across Bangladesh.
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

/* -------------------------------------------------------------------------- */
/*                              CATEGORIES VIEW                               */
/* -------------------------------------------------------------------------- */
function Categories({
  categories,
  request,
  refresh,
  showToast,
  showConfirm,
}: {
  categories: Category[];
  request: any;
  refresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  showConfirm: any;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    try {
      await request("/categories/admin", {
        method: "POST",
        body: JSON.stringify({ name, slug, description, isActive: true }),
      });
      setName("");
      setDescription("");
      showToast("Category created successfully.", "success");
      refresh();
    } catch (error: any) {
      showToast(error.message || "Could not create category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = (category: Category) => {
    showConfirm({
      title: `Delete Category "${category.name}"?`,
      message:
        "Products in this category must be reassigned. Are you sure you want to proceed?",
      confirmText: "Delete Category",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await request(`/categories/admin/${category.id}`, {
            method: "DELETE",
          });
          showToast("Category deleted.", "success");
          refresh();
        } catch (error: any) {
          showToast(error.message || "Could not delete category.", "error");
        }
      },
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <form
        onSubmit={create}
        className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"
      >
        <h2 className="font-black tracking-[-.04em]">Create category</h2>
        <p className="mt-1 text-xs text-ink/50">
          New categories become available in the product form automatically.
        </p>
        <label className="mt-6 block text-xs font-bold uppercase tracking-wider">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 p-3 text-sm font-normal outline-none focus:border-ink"
            placeholder="Hoodies"
          />
        </label>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wider">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-24 w-full rounded-xl border border-black/10 p-3 text-sm font-normal outline-none focus:border-ink"
            placeholder="Optional category description"
          />
        </label>
        <button
          disabled={saving}
          className="mt-5 rounded-xl bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create category"}
        </button>
      </form>
      <section className="rounded-2xl border border-black/8 bg-white shadow-sm">
        <div className="border-b border-black/8 p-5">
          <h2 className="font-black tracking-[-.04em]">Categories</h2>
        </div>
        <div className="divide-y divide-black/5">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-bold">{category.name}</p>
                <p className="mt-1 text-xs text-ink/50">
                  /{category.slug} · {category._count?.products || 0} product(s)
                </p>
              </div>
              <button
                onClick={() => remove(category)}
                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          {!categories.length && <Empty text="Create your first category." />}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                   STORE SETTINGS (Item 3 & Item 5)                         */
/* -------------------------------------------------------------------------- */
function Settings({
  request,
  showToast,
}: {
  request: any;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [form, setForm] = useState({
    storeName: "OOFY",
    storeTagline: "Wear Your Confidence",
    contactEmail: "oofybrand@gmail.com",
    deliveryChargeInsideDhaka: "60",
    deliveryChargeOutsideDhaka: "100",
    freeShippingThreshold: "2000",
    customAnnouncement: "",
    codEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request("/admin/settings")
      .then((r: any) => {
        if (r.data) {
          setForm({
            storeName: r.data.storeName || "OOFY",
            storeTagline: r.data.storeTagline || "Wear Your Confidence",
            contactEmail: r.data.contactEmail || "oofybrand@gmail.com",
            deliveryChargeInsideDhaka: String(
              r.data.deliveryChargeInsideDhaka ?? r.data.deliveryCharge ?? 60
            ),
            deliveryChargeOutsideDhaka: String(
              r.data.deliveryChargeOutsideDhaka ?? 100
            ),
            freeShippingThreshold:
              r.data.freeShippingThreshold !== null &&
              r.data.freeShippingThreshold !== undefined
                ? String(r.data.freeShippingThreshold)
                : "2000",
            customAnnouncement: r.data.customAnnouncement || "",
            codEnabled: r.data.codEnabled ?? true,
          });
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      showToast("Store settings saved successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-.04em] text-ink">
            Store Settings & Rules
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Configure Dhaka vs Outside Dhaka shipping rates, minimum free delivery
            threshold, and announcement marquee.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80 disabled:opacity-50 transition-all shadow-sm"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Card 1: Brand Profile */}
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
          <FiBox className="text-base text-ink/60" />
          Brand Profile & Identity
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          Displayed across receipts, storefront titles, and checkout headers.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider">
            Store Name
            <input
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-normal outline-none focus:border-ink"
              placeholder="OOFY"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider">
            Brand Tagline
            <input
              value={form.storeTagline}
              onChange={(e) =>
                setForm({ ...form, storeTagline: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-normal outline-none focus:border-ink"
              placeholder="Wear Your Confidence"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">
            Support Email
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-normal outline-none focus:border-ink"
              placeholder="support@oofy.com"
            />
          </label>
        </div>
      </div>

      {/* Card 2: Location-Based Delivery Charges (Item 3) */}
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
          <FiTruck className="text-base text-emerald-600" />
          Location Delivery Charges & Free Shipping Rules
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          Manage separate delivery fees for Dhaka and Outside Dhaka districts.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-bold uppercase tracking-wider">
            Inside Dhaka Delivery (৳)
            <input
              type="number"
              min="0"
              value={form.deliveryChargeInsideDhaka}
              onChange={(e) =>
                setForm({ ...form, deliveryChargeInsideDhaka: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ink"
              placeholder="60"
            />
            <span className="mt-1.5 block text-[11px] text-ink/45 font-normal">
              Applied when customer selects Dhaka district.
            </span>
          </label>

          <label className="text-xs font-bold uppercase tracking-wider">
            Outside Dhaka Delivery (৳)
            <input
              type="number"
              min="0"
              value={form.deliveryChargeOutsideDhaka}
              onChange={(e) =>
                setForm({ ...form, deliveryChargeOutsideDhaka: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ink"
              placeholder="100"
            />
            <span className="mt-1.5 block text-[11px] text-ink/45 font-normal">
              Applied for all other 63 districts in Bangladesh.
            </span>
          </label>

          <label className="text-xs font-bold uppercase tracking-wider">
            Free Shipping Threshold (৳)
            <input
              type="number"
              min="0"
              value={form.freeShippingThreshold}
              onChange={(e) =>
                setForm({ ...form, freeShippingThreshold: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ink"
              placeholder="2000"
            />
            <span className="mt-1.5 block text-[11px] text-ink/45 font-normal">
              Orders at or above this subtotal ship 100% free.
            </span>
          </label>
        </div>

        {/* Storewide Free Delivery Toggle */}
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={
                form.deliveryChargeInsideDhaka === "0" &&
                form.deliveryChargeOutsideDhaka === "0"
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setForm({
                    ...form,
                    deliveryChargeInsideDhaka: "0",
                    deliveryChargeOutsideDhaka: "0",
                    freeShippingThreshold: "0",
                  });
                } else {
                  setForm({
                    ...form,
                    deliveryChargeInsideDhaka: "60",
                    deliveryChargeOutsideDhaka: "100",
                    freeShippingThreshold: "2000",
                  });
                }
              }}
              className="h-5 w-5 rounded accent-emerald-600 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-emerald-950 block">
                Free Delivery on ALL Orders (Storewide ৳0 Shipping)
              </span>
              <span className="text-xs text-emerald-800">
                Zeros delivery fee across all districts regardless of order size.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Card 3: Top Announcement Bar Marquee (Item 5) */}
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
          <FiTag className="text-base text-ink/60" />
          Storefront Top Announcement Bar
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          The ticker shown at the top of the homepage. Leave blank to automatically
          generate based on your Free Shipping Threshold.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Custom Marquee Announcement Text
            <input
              value={form.customAnnouncement}
              onChange={(e) =>
                setForm({ ...form, customAnnouncement: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-normal outline-none focus:border-ink"
              placeholder="e.g. SPECIAL WINTER DROP ✦ 15% OFF ON SELECTED HOODIES"
            />
          </label>

          {/* Live Preview Box */}
          <div className="rounded-xl border border-black/5 bg-[#121512] p-3 text-white text-center text-xs font-bold tracking-wider uppercase">
            <span className="text-white/40 mr-2 text-[10px]">Preview:</span>
            <span>
              {form.customAnnouncement.trim()
                ? form.customAnnouncement.trim()
                : form.freeShippingThreshold &&
                  Number(form.freeShippingThreshold) > 0
                ? `FREE DELIVERY IN BANGLADESH ON ORDERS OVER ৳${Number(
                    form.freeShippingThreshold
                  ).toLocaleString("en-BD")} ✦ CASH ON DELIVERY AVAILABLE NATIONWIDE`
                : form.freeShippingThreshold === "0"
                ? "100% FREE DELIVERY NATIONWIDE ON ALL ORDERS ✦ CASH ON DELIVERY AVAILABLE"
                : "CASH ON DELIVERY AVAILABLE NATIONWIDE"}
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Payment Methods */}
      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
          <FiShoppingBag className="text-base text-ink/60" />
          Payment Methods
        </h3>
        <p className="mt-1 text-xs text-ink/50">
          Accepted payment methods displayed at customer checkout.
        </p>

        <div className="mt-5 space-y-3">
          <label className="flex items-center justify-between rounded-xl bg-[#f7f8f6] p-4 text-sm font-bold cursor-pointer">
            <div>
              <span className="block text-ink">Cash on Delivery (COD)</span>
              <span className="text-xs text-ink/50 font-normal">
                Customer pays in cash upon parcel delivery to courier agent.
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.codEnabled}
              onChange={(e) =>
                setForm({ ...form, codEnabled: e.target.checked })
              }
              className="h-5 w-5 rounded accent-ink cursor-pointer"
            />
          </label>

          <div className="rounded-xl border border-black/8 bg-[#fdfdfc] p-4 text-xs text-ink/70">
            <span className="font-bold block text-ink mb-1">
              bKash & Nagad Payments
            </span>
            Direct Send Money numbers and transaction verification are
            automatically presented to customers during the checkout dialog.
          </div>
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                 PRODUCT STUDIO EDITOR (Item 1, 2, 7)                       */
/* -------------------------------------------------------------------------- */
function ProductEditor({ product, request, close, showToast, saved }: any) {
  const [categories, setCategories] = useState<Category[]>([]);

  // Check if product is currently scheduled (Item 1)
  const isInitiallyScheduled = Boolean(
    product?.isScheduled ||
      (product?.scheduledAt &&
        new Date(product.scheduledAt).getTime() > Date.now())
  );

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    material: product?.material || "",
    fit: product?.fit || "",
    careInstructions: (product?.careInstructions || "")
      .replace(/\[FREE_DELIVERY\]/g, "")
      .replace(/\[SCHEDULED:[^\]]+\]/g, "")
      .trim(),
    countryOfOrigin: product?.countryOfOrigin || "Bangladesh",
    basePrice: product ? String(product.basePrice) : "",
    discountPrice: product?.discountPrice ? String(product.discountPrice) : "",
    isFreeDelivery: Boolean(
      product?.isFreeDelivery ||
        product?.careInstructions?.includes("[FREE_DELIVERY]") ||
        product?.description?.includes("[FREE_DELIVERY]")
    ),
    categoryId: product?.categoryId || "",
    imageInputUrl: "",
    published: product?.isPublished ?? true,
    featured: product?.isFeatured ?? false,
    variants: product?.variants?.length
      ? product.variants
      : [
          { size: "S", color: "Black", stock: 10, sku: "" },
          { size: "M", color: "Black", stock: 15, sku: "" },
          { size: "L", color: "Black", stock: 15, sku: "" },
          { size: "XL", color: "Black", stock: 10, sku: "" },
        ],
  });

  // Scheduling State (Item 1)
  const [publishMode, setPublishMode] = useState<"NOW" | "SCHEDULED">(
    isInitiallyScheduled ? "SCHEDULED" : "NOW"
  );

  const [scheduledDate, setScheduledDate] = useState(() => {
    if (product?.scheduledAt) {
      const d = new Date(product.scheduledAt);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : "";
    }
    const later = new Date(Date.now() + 48 * 3600 * 1000);
    return later.toISOString().slice(0, 16);
  });

  const [images, setImages] = useState<{ url: string; alt?: string }[]>(
    product?.images || []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    request("/categories/admin/all")
      .then((data: any) => setCategories(data.data || []))
      .catch((error: Error) => setError(error.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived automatic slug (Item 6)
  const autoSlug = useMemo(() => {
    return (
      form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "new-drop"
    );
  }, [form.name]);

  // Multiple Image Upload Handler (Item 7)
  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    const fileArray = Array.from(files);
    const newImages: { url: string; alt?: string }[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file.type.startsWith("image/")) {
        showToast(`"${file.name}" is not an image.`, "error");
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds 8 MB limit.`, "error");
        continue;
      }

      setUploadProgressText(
        `Uploading ${i + 1} of ${fileArray.length} photos…`
      );

      try {
        const body = new FormData();
        body.append("image", file);
        const data = await request("/admin/uploads/image", {
          method: "POST",
          body,
        });
        if (data.data?.url) {
          newImages.push({ url: data.data.url });
        }
      } catch (err: any) {
        showToast(err.message || `Failed to upload "${file.name}".`, "error");
      }
    }

    if (newImages.length > 0) {
      setImages((curr) => [...curr, ...newImages]);
      showToast(`Added ${newImages.length} image(s).`, "success");
    }
    setUploading(false);
    setUploadProgressText("");
  };

  const makeCardCover = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const remaining = images.filter((_, idx) => idx !== index);
    setImages([target, ...remaining]);
    showToast("Main card cover updated.", "success");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const setPresetSchedule = (hours: number) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    setScheduledDate(d.toISOString().slice(0, 16));
    setPublishMode("SCHEDULED");
  };

  // Quick Size Adders (Item 2 - Sizes & Stock UI Fix)
  const addSizePreset = (sizeLabel: string) => {
    const exists = form.variants.some(
      (v) => v.size.toUpperCase() === sizeLabel.toUpperCase()
    );
    if (exists) {
      showToast(`Size ${sizeLabel} is already in the list.`, "info");
      return;
    }
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { size: sizeLabel, color: "Black", stock: 10, sku: "" },
      ],
    });
  };

  const addStandardBatch = () => {
    const std = ["S", "M", "L", "XL", "XXL"];
    const existingSizes = new Set(form.variants.map((v) => v.size.toUpperCase()));
    const toAdd = std
      .filter((s) => !existingSizes.has(s))
      .map((size) => ({ size, color: "Black", stock: 10, sku: "" }));

    if (toAdd.length === 0) {
      showToast("Standard sizes (S-XXL) already present.", "info");
      return;
    }

    setForm({
      ...form,
      variants: [...form.variants, ...toAdd],
    });
    showToast(`Added ${toAdd.length} standard sizes.`, "success");
  };

  // Submit Handler
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const isScheduledDrop =
      publishMode === "SCHEDULED" && Boolean(scheduledDate);
    const scheduledIso = isScheduledDrop
      ? new Date(scheduledDate).toISOString()
      : null;

    const payload = {
      name: form.name,
      slug: autoSlug,
      description: form.description,
      shortDescription: form.shortDescription,
      material: form.material,
      fit: form.fit,
      careInstructions: form.careInstructions,
      countryOfOrigin: form.countryOfOrigin,
      basePrice: form.basePrice,
      discountPrice: form.discountPrice.trim()
        ? form.discountPrice.trim()
        : null,
      isFreeDelivery: form.isFreeDelivery,
      categoryId: form.categoryId,
      isPublished: publishMode === "NOW" ? form.published : false,
      isFeatured: form.featured,
      publishNow: publishMode === "NOW",
      scheduledAt: scheduledIso,
      images,
      variants: form.variants.map((v: Variant) => ({
        ...v,
        stock: Number(v.stock),
      })),
    };

    try {
      const data = await request(
        product ? `/admin/products/${product.id}` : "/admin/products",
        { method: product ? "PUT" : "POST", body: JSON.stringify(payload) }
      );
      saved(data.data);
    } catch (e: any) {
      setError(
        e.message ||
          "Could not save product. Please ensure a category is selected."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalStock = form.variants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8f9fa] text-[#151915]">
      {/* Studio Header Sticky Bar */}
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/8 bg-white/95 px-6 backdrop-blur md:px-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={close}
            className="flex items-center gap-2 rounded-xl border border-black/10 px-3.5 py-2 text-xs font-bold text-ink hover:bg-black/5 transition-all"
          >
            <FiArrowLeft /> Exit Studio
          </button>
          <div className="hidden sm:block">
            <h1 className="text-base font-black tracking-tight text-ink flex items-center gap-2">
              {product
                ? `Editing: ${form.name || "Untitled Drop"}`
                : "Product Studio — New Drop"}
              {publishMode === "SCHEDULED" ? (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black text-violet-800 uppercase flex items-center gap-1">
                  <FiClock /> Scheduled Drop
                </span>
              ) : form.published ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                  Ready to Publish
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-black text-stone-700 uppercase">
                  Draft
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink/70 hover:bg-black/5"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={submit}
            className="flex items-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80 disabled:opacity-50 transition-all shadow-md"
          >
            {saving ? (
              <span>Saving Drop…</span>
            ) : (
              <>
                <FiCheck />
                {publishMode === "SCHEDULED"
                  ? "Schedule Drop"
                  : "Publish Product"}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Body (2-Column Studio Layout) */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-12">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
          {/* Left / Primary Column (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Card 1: Core Information */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink">
                1. Core Drop Information
              </h3>
              <p className="mt-1 text-xs text-ink/50">
                Primary naming, category alignment, and product story.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Product Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ink focus:bg-white"
                    placeholder="e.g. OVERSIZED HEAVYWEIGHT BOX TEE"
                  />
                  <span className="mt-1.5 block text-[11px] text-ink/40 font-mono">
                    Generated Storefront URL: /products/{autoSlug}
                  </span>
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider">
                  Category *
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ink focus:bg-white"
                  >
                    <option value="">Choose a Category</option>
                    {categories
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider">
                  Short Collection Summary (1 Line)
                  <input
                    value={form.shortDescription}
                    onChange={(e) =>
                      setForm({ ...form, shortDescription: e.target.value })
                    }
                    maxLength={180}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal text-ink outline-none focus:border-ink focus:bg-white"
                    placeholder="Concise highlight shown on product collection cards"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider">
                  Full Product Story & Details
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal text-ink outline-none focus:border-ink focus:bg-white"
                    placeholder="Detailed craftsmanship, fabric weight, styling advice, and story…"
                  />
                </label>
              </div>
            </div>

            {/* Card 2: Sizes & Stock Inventory (Item 2 Redesign) */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ink">
                    2. Sizes & Stock Inventory
                  </h3>
                  <p className="mt-1 text-xs text-ink/50">
                    Each size has dedicated variant stock and SKU tracking.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-lime px-3 py-1 text-xs font-black text-ink">
                    Total: {totalStock} units
                  </span>
                </div>
              </div>

              {/* Quick Size Presets Bar */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 bg-[#fbfbf9] p-3 rounded-xl border border-black/5">
                <span className="text-[11px] font-bold text-ink/40 mr-1">
                  Quick Add:
                </span>
                {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => addSizePreset(sz)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-black/5 hover:border-black/30 transition-all"
                  >
                    + {sz}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addStandardBatch}
                  className="rounded-lg bg-black/5 px-3 py-1 text-xs font-bold text-ink hover:bg-black/10 ml-auto"
                >
                  + Add S-XXL Set
                </button>
              </div>

              {/* Beautiful Aligned Table */}
              <div className="mt-4 overflow-hidden rounded-xl border border-black/8">
                <table className="w-full text-left">
                  <thead className="bg-[#f7f8f6] text-[10px] uppercase tracking-wider text-ink/45 border-b border-black/8">
                    <tr>
                      <th className="py-2.5 px-3 w-24">Size</th>
                      <th className="py-2.5 px-3">Colorway</th>
                      <th className="py-2.5 px-3 w-32">Units in Stock</th>
                      <th className="py-2.5 px-3 w-32">SKU (Opt)</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 bg-white">
                    {form.variants.map((v: Variant, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-black/[0.015] transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <input
                            required
                            value={v.size}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[index].size = e.target.value.toUpperCase();
                              setForm({ ...form, variants: next });
                            }}
                            placeholder="M"
                            className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-black uppercase text-ink outline-none focus:border-ink"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            value={v.color || ""}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[index].color = e.target.value;
                              setForm({ ...form, variants: next });
                            }}
                            placeholder="Black"
                            className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-ink"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => {
                                const next = [...form.variants];
                                next[index].stock =
                                  Number(e.target.value) || 0;
                                setForm({ ...form, variants: next });
                              }}
                              placeholder="0"
                              className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-ink"
                            />
                            {Number(v.stock) === 0 && (
                              <span
                                className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0"
                                title="Out of stock"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            value={v.sku || ""}
                            onChange={(e) => {
                              const next = [...form.variants];
                              next[index].sku = e.target.value;
                              setForm({ ...form, variants: next });
                            }}
                            placeholder="OOFY-TEE-01"
                            className="w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-mono text-ink/70 outline-none focus:border-ink"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                variants: form.variants.filter(
                                  (_, i) => i !== index
                                ),
                              })
                            }
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Remove size"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {form.variants.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-xs text-ink/40"
                        >
                          No sizes added. Use the Quick Add buttons above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 3: Specifications & Origin */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink">
                3. Specifications & Care
              </h3>
              <p className="mt-1 text-xs text-ink/50">
                Garment specifications, fabric weight, and washing directions.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-wider">
                  Material
                  <input
                    value={form.material}
                    onChange={(e) =>
                      setForm({ ...form, material: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal outline-none focus:border-ink focus:bg-white"
                    placeholder="240 GSM Combed Cotton"
                  />
                </label>

                <label className="text-xs font-bold uppercase tracking-wider">
                  Fit Profile
                  <input
                    value={form.fit}
                    onChange={(e) => setForm({ ...form, fit: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal outline-none focus:border-ink focus:bg-white"
                    placeholder="Boxy Oversized"
                  />
                </label>

                <label className="text-xs font-bold uppercase tracking-wider">
                  Country of Origin
                  <input
                    value={form.countryOfOrigin}
                    onChange={(e) =>
                      setForm({ ...form, countryOfOrigin: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal outline-none focus:border-ink focus:bg-white"
                    placeholder="Bangladesh"
                  />
                </label>

                <label className="text-xs font-bold uppercase tracking-wider">
                  Care Instructions
                  <input
                    value={form.careInstructions}
                    onChange={(e) =>
                      setForm({ ...form, careInstructions: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-sm font-normal outline-none focus:border-ink focus:bg-white"
                    placeholder="Cold wash inside out"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right / Sidebar Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Card 4: Imagery Studio (Item 7) */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <FiUploadCloud className="text-base text-blue" />
                    Imagery Studio
                  </h3>
                  <p className="mt-1 text-xs text-ink/50">
                    Upload multiple images. Image 1 is the main card cover.
                  </p>
                </div>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-bold text-ink">
                  {images.length} photos
                </span>
              </div>

              {/* Upload Dropzone */}
              <div className="mt-4">
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/15 bg-[#fbfbf9] p-6 text-center cursor-pointer hover:border-black/30 hover:bg-[#f6f7f5] transition-all">
                  <FiUploadCloud className="text-3xl text-ink/40 mb-2" />
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    {uploading ? uploadProgressText : "Upload Multiple Images"}
                  </span>
                  <span className="mt-1 text-[11px] text-ink/40">
                    Select 1 or more JPG, PNG, WebP photos (up to 8 MB each)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => handleMultipleFiles(e.target.files)}
                    className="hidden"
                  />
                </label>

                {/* Direct URL Input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={form.imageInputUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageInputUrl: e.target.value })
                    }
                    placeholder="Or paste direct image URL…"
                    className="flex-1 rounded-xl border border-black/10 bg-[#fbfbf9] px-3 py-2 text-xs outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (form.imageInputUrl.trim()) {
                        setImages([
                          ...images,
                          { url: form.imageInputUrl.trim() },
                        ]);
                        setForm({ ...form, imageInputUrl: "" });
                      }
                    }}
                    className="rounded-xl bg-black/5 px-3 py-2 text-xs font-bold text-ink hover:bg-black/10"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Photos Gallery Grid */}
              <div className="mt-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
                  Uploaded Photos:
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img, idx) => {
                    const isCover = idx === 0;
                    return (
                      <div
                        key={`${img.url}-${idx}`}
                        className={`group relative overflow-hidden rounded-xl border bg-black/5 transition-all ${
                          isCover
                            ? "border-2 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-black/10 hover:border-black/30"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt="Product preview"
                          className="h-28 w-full object-cover"
                        />

                        {isCover ? (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-md">
                            ★ Card Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makeCardCover(idx)}
                            className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600"
                            title="Make this photo the main card cover"
                          >
                            Set Cover
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute right-1.5 top-1.5 rounded bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {images.length === 0 && (
                  <p className="text-xs text-ink/40 text-center py-4 border border-dashed rounded-xl">
                    No images uploaded yet.
                  </p>
                )}
              </div>
            </div>

            {/* Card 5: Pricing & Deals */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                <FiTag className="text-base text-rose-500" />
                Pricing & Deals
              </h3>
              <p className="mt-1 text-xs text-ink/50">
                Regular retail price and promotional discount.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Regular Base Price (৳) *
                  <input
                    required
                    inputMode="decimal"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm({ ...form, basePrice: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-base font-bold text-ink outline-none focus:border-ink focus:bg-white"
                    placeholder="1250"
                  />
                </label>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Discount Sale Price (৳)</span>
                    {form.basePrice &&
                      form.discountPrice &&
                      Number(form.discountPrice) < Number(form.basePrice) && (
                        <span className="text-[11px] font-black text-rose-600">
                          {Math.round(
                            ((Number(form.basePrice) -
                              Number(form.discountPrice)) /
                              Number(form.basePrice)) *
                              100
                          )}
                          % OFF (Save ৳
                          {Number(form.basePrice) - Number(form.discountPrice)})
                        </span>
                      )}
                  </label>
                  <input
                    inputMode="decimal"
                    value={form.discountPrice}
                    onChange={(e) =>
                      setForm({ ...form, discountPrice: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbfbf9] px-4 py-3 text-base font-bold text-rose-600 outline-none focus:border-ink focus:bg-white"
                    placeholder="e.g. 990 (Leave blank for full price)"
                  />

                  {/* Preset Discount Chips */}
                  {form.basePrice && Number(form.basePrice) > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {[10, 15, 20, 25, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const disc = Math.round(
                              Number(form.basePrice) * (1 - pct / 100)
                            );
                            setForm({ ...form, discountPrice: String(disc) });
                          }}
                          className="rounded border border-black/10 bg-white px-2 py-1 text-[10px] font-bold text-ink hover:bg-black/5"
                        >
                          {pct}% OFF
                        </button>
                      ))}
                      {form.discountPrice && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, discountPrice: "" })}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 6: Delivery & Spotlight Toggles */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink">
                4. Highlights & Badges
              </h3>

              {/* Free Delivery Switch */}
              <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFreeDelivery}
                  onChange={(e) =>
                    setForm({ ...form, isFreeDelivery: e.target.checked })
                  }
                  className="h-5 w-5 rounded accent-emerald-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                    <FiTruck className="text-sm text-emerald-600" />
                    Free Delivery on this Product
                  </span>
                  <span className="text-[11px] text-emerald-800 block mt-0.5">
                    Renders the FREE DELIVERY badge and zeros shipping at
                    checkout.
                  </span>
                </div>
              </label>

              {/* Home Spotlight Switch */}
              <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                  className="h-5 w-5 rounded accent-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                    <FiStar className="text-sm text-amber-500 fill-amber-500" />
                    Feature on Home Spotlight
                  </span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    Pins this drop into the Home Lookbook and Featured
                    collection.
                  </span>
                </div>
              </label>
            </div>

            {/* Card 7: Launch & Scheduled Publishing (Item 1) */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                <FiClock className="text-base text-violet-600" />
                Launch & Publishing Schedule
              </h3>
              <p className="mt-1 text-xs text-ink/50">
                Publish immediately or schedule an automated drop time.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPublishMode("NOW")}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all ${
                    publishMode === "NOW"
                      ? "border-ink bg-ink text-white"
                      : "border-black/10 bg-[#fbfbf9] text-ink/70 hover:bg-black/5"
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode("SCHEDULED")}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all ${
                    publishMode === "SCHEDULED"
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-black/10 bg-[#fbfbf9] text-ink/70 hover:bg-black/5"
                  }`}
                >
                  Schedule Drop
                </button>
              </div>

              {publishMode === "SCHEDULED" && (
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-4">
                  <span className="text-xs font-bold text-violet-950 block">
                    Choose Scheduled Drop Time:
                  </span>

                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-950 outline-none"
                  />

                  {/* Preset Schedule Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-violet-900/60">
                      Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => setPresetSchedule(24)}
                      className="rounded border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-900 hover:bg-violet-100"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetSchedule(48)}
                      className="rounded border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-900 hover:bg-violet-100"
                    >
                      +48 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetSchedule(72)}
                      className="rounded border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-900 hover:bg-violet-100"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetSchedule(168)}
                      className="rounded border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-900 hover:bg-violet-100"
                    >
                      +1 Week
                    </button>
                  </div>

                  <p className="mt-2.5 text-[11px] text-violet-900/80">
                    Product will automatically go live on the storefront when
                    this timestamp arrives. When page is reloaded after this
                    time, it will show as Published.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
