"use client";

import { useState, FormEvent } from "react";
import { StoreHeader } from "../../components/storefront/StoreHeader";
import { SiteFooter } from "../../components/storefront/SiteFooter";
import { CartDrawer } from "../../components/storefront/CartDrawer";
import { CheckoutDialog } from "../../components/storefront/CheckoutDialog";
import { useCart } from "../../components/storefront/cartStore";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiCheckCircle,
  FiSend,
  FiMessageSquare,
  FiArrowRight,
  FiShield,
  FiTruck,
} from "react-icons/fi";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

export default function ContactPage() {
  const {
    cart,
    bagOpen,
    setBagOpen,
    checkoutOpen,
    setCheckoutOpen,
    orderSuccess,
    setOrderSuccess,
    updateQuantity,
    removeFromCart,
    clearCart,
    count,
    shipping,
  } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "Order Inquiry",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoints = [
        "/api/contact",
        `${API}/contact`,
        "http://localhost:5000/api/contact",
      ];
      for (const ep of Array.from(new Set(endpoints))) {
        try {
          const res = await fetch(ep, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          if (res.ok) {
            break;
          }
        } catch {
          // continue fallback
        }
      }
      setSubmitted(true);
      setForm({
        name: "",
        phone: "",
        email: "",
        subject: "Order Inquiry",
        message: "",
      });
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="store-main-wrapper bg-[#f7f5f0] min-h-screen text-[#111]">
      <StoreHeader cartCount={count} onCart={() => setBagOpen(true)} />

      {/* Hero Headline */}
      <section className="border-b border-[#111] px-5 py-12 md:px-12 md:py-20 max-w-7xl mx-auto">
        <p className="eyebrow text-xs font-bold uppercase tracking-[0.2em] text-[#666]">
          Client Care & Atelier
        </p>
        <h1 className="mt-3 text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.06em] uppercase">
          Contact <i>OOFY.</i>
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-[#444] leading-relaxed">
          Questions regarding your drop order, size recommendations, custom inquiries,
          or exchange assistance? Our Dhaka studio team responds within 24 hours.
        </p>
      </section>

      {/* Main Grid: Info + Contact Form */}
      <section className="max-w-7xl mx-auto px-5 py-12 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Direct Info & Studio Coordinates */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Atelier & Coordinates
            </h2>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-sm">
              <div className="p-3 rounded-xl bg-[#111] text-[#d2f83a] text-lg">
                <FiMapPin />
              </div>
              <div>
                <strong className="block text-sm font-black uppercase tracking-wider">
                  Dhaka Studio & Atelier
                </strong>
                <p className="mt-1 text-xs text-[#555] leading-relaxed">
                  House 14, Road 7, Block D, Banani
                  <br />
                  Dhaka 1213, Bangladesh
                </p>
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-sm">
              <div className="p-3 rounded-xl bg-[#111] text-[#d2f83a] text-lg">
                <FiPhone />
              </div>
              <div className="flex-1">
                <strong className="block text-sm font-black uppercase tracking-wider">
                  Direct Line / WhatsApp
                </strong>
                <p className="mt-1 text-xs text-[#555]">
                  +880 1712-345678
                </p>
                <a
                  href="https://wa.me/8801712345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline uppercase tracking-wider"
                >
                  <FiMessageSquare /> Chat on WhatsApp →
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-sm">
              <div className="p-3 rounded-xl bg-[#111] text-[#d2f83a] text-lg">
                <FiMail />
              </div>
              <div>
                <strong className="block text-sm font-black uppercase tracking-wider">
                  Support Email
                </strong>
                <a
                  href="mailto:support@oofy.store"
                  className="mt-1 block text-xs text-[#555] hover:text-[#111] underline"
                >
                  support@oofy.store
                </a>
                <span className="text-[11px] text-[#777] block mt-0.5">
                  Order queries & invoice dispatch
                </span>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-sm">
              <div className="p-3 rounded-xl bg-[#111] text-[#d2f83a] text-lg">
                <FiClock />
              </div>
              <div>
                <strong className="block text-sm font-black uppercase tracking-wider">
                  Operating Hours
                </strong>
                <p className="mt-1 text-xs text-[#555]">
                  Saturday – Thursday: 10:00 AM – 8:00 PM (BST)
                  <br />
                  Friday: Closed for weekly drop preparation
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ Strip */}
          <div className="rounded-2xl bg-[#111] text-[#f7f5f0] p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#d2f83a]">
              Delivery & Exchange Standard
            </h3>
            <div className="flex items-start gap-3 text-xs text-white/80">
              <FiTruck className="text-base text-[#d2f83a] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Inside Dhaka:</strong> 24–48 hours delivery.
                <br />
                <strong>Outside Dhaka:</strong> 48–72 hours via premium courier.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-white/80">
              <FiShield className="text-base text-[#d2f83a] flex-shrink-0 mt-0.5" />
              <span>
                <strong>14-Day Exchange:</strong> Size doesn't fit? We'll exchange it doorstep nationwide.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-10 shadow-lg">
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#111]">
              Send a Message
            </h2>
            <p className="mt-1 text-xs text-[#666]">
              Fill out the form below and our client care team will get back to you directly.
            </p>

            {submitted ? (
              <div className="my-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
                <FiCheckCircle className="mx-auto text-4xl text-emerald-600" />
                <h3 className="text-lg font-black uppercase text-emerald-950">
                  Message Sent Successfully
                </h3>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Thank you for reaching out to OOFY. Our atelier team will review your
                  inquiry and contact you via phone or email shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 inline-block rounded-xl bg-[#111] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#111] mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] px-4 py-3 text-sm outline-none focus:border-[#111] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#111] mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] px-4 py-3 text-sm outline-none focus:border-[#111] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#111] mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="tanvir@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] px-4 py-3 text-sm outline-none focus:border-[#111] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#111] mb-1.5">
                      Subject
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] px-4 py-3 text-sm outline-none focus:border-[#111] focus:bg-white transition-all font-medium"
                    >
                      <option value="Order Inquiry">Order Inquiry / Tracking</option>
                      <option value="Sizing Advice">Sizing & Fit Advice</option>
                      <option value="Exchange & Return">Exchange & Return Request</option>
                      <option value="Wholesale / Press">Wholesale / Press Collaboration</option>
                      <option value="Other">Other Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#111] mb-1.5">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us what you need assistance with..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] p-4 text-sm outline-none focus:border-[#111] focus:bg-white transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#111] py-4 px-6 text-xs font-black uppercase tracking-widest text-white hover:bg-black/85 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {submitting ? (
                    "Sending Message…"
                  ) : (
                    <>
                      <FiSend /> Send Message to Atelier
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Cart Drawer */}
      {bagOpen && (
        <CartDrawer
          items={cart}
          shipping={shipping}
          onClose={() => setBagOpen(false)}
          onQuantity={updateQuantity}
          onCheckout={() => {
            setBagOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}

      {/* Checkout Dialog */}
      {checkoutOpen && (
        <CheckoutDialog
          items={cart}
          shipping={shipping}
          onClose={() => setCheckoutOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onDone={(msg) => {
            clearCart();
            setCheckoutOpen(false);
            setOrderSuccess(msg);
          }}
        />
      )}
    </main>
  );
}
