"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowDownRight, FiArrowUpRight, FiMenu, FiSearch, FiShoppingBag, FiX } from "react-icons/fi";

const products = [
  { name: "MILAN graphic tee", type: "oversized tee", price: "৳ 1,250", image: "/images/tee-grid.jpeg" },
  { name: "PLAN BLACK tee", type: "premium cotton", price: "৳ 1,250", image: "/images/model-front.jpeg" },
  { name: "MILAN — hanging", type: "limited edition", price: "৳ 1,250", image: "/images/tee-hanging.jpeg" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const add = () => { setCart((count) => count + 1); setCartOpen(true); };

  return (
    <main className="overflow-hidden">
      <div className="bg-ink px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[.22em] text-white sm:text-xs">Free delivery in Bangladesh on orders over ৳ 2,000</div>
      <header className="flex h-20 items-center justify-between border-b border-ink/20 px-5 md:px-10">
        <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><FiMenu className="text-lg" /> Menu</button>
        <a href="#top" className="absolute left-1/2 -translate-x-1/2 text-2xl font-black tracking-[-.13em] md:text-3xl">OOFY<span className="text-blue">®</span></a>
        <div className="flex items-center gap-4"><button className="hidden sm:block"><FiSearch /></button><button onClick={() => setCartOpen(true)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><FiShoppingBag className="text-lg" /> <span>Bag ({cart})</span></button></div>
      </header>

      <section id="top" className="relative min-h-[690px] bg-blue text-bone md:min-h-[750px]">
        <div className="grain absolute inset-0 opacity-25" />
        <div className="relative mx-auto flex min-h-[690px] max-w-[1440px] flex-col px-5 pt-10 md:min-h-[750px] md:px-10 md:pt-14">
          <p className="text-xs font-bold uppercase tracking-[.25em]">Drop 01 — 2026</p>
          <h1 className="mt-5 max-w-4xl font-display text-[17vw] leading-[.76] tracking-[-.1em] sm:text-[14vw] md:text-[11.3rem]">WEAR<br/><span className="outline-title">YOUR</span><br/>CONFIDENCE.</h1>
          <div className="mt-auto flex items-end justify-between pb-7 pt-12">
            <a href="#shop" className="group flex items-center gap-3 rounded-full bg-lime px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-bone">Shop collection <FiArrowDownRight className="text-lg transition group-hover:translate-y-1" /></a>
            <p className="hidden max-w-[180px] text-right text-xs font-bold leading-relaxed uppercase tracking-wider md:block">The everyday pieces you reach for first.</p>
          </div>
        </div>
        <div className="absolute bottom-0 right-[4%] h-[68%] w-[47%] max-w-[610px] overflow-hidden sm:right-[8%]">
          <Image src="/images/model-front.jpeg" alt="OOFY black tee" fill priority className="object-cover object-top mix-blend-multiply" />
        </div>
      </section>

      <section className="border-y border-ink bg-lime py-4 overflow-hidden"><div className="whitespace-nowrap text-xl font-black uppercase tracking-tight sm:text-3xl">OOFY — MADE TO MOVE — OOFY — MADE TO MOVE — OOFY — MADE TO MOVE —</div></section>

      <section id="shop" className="px-5 py-16 md:px-10 md:py-24">
        <div className="mb-10 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-blue">The first essential</p><h2 className="mt-2 text-4xl font-black uppercase tracking-[-.07em] md:text-6xl">The Plan Black</h2></div><a href="#" className="hidden border-b border-ink pb-1 text-xs font-bold uppercase tracking-widest md:block">View all pieces</a></div>
        <div className="grid gap-x-4 gap-y-10 md:grid-cols-3">
          {products.map((product, index) => <article key={product.name} className={index === 1 ? "md:mt-16" : ""}>
            <div className="group relative aspect-[.83] overflow-hidden bg-[#e4e0da]"><Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 bg-bone px-2 py-1 text-[10px] font-bold uppercase tracking-widest">0{index + 1}</span><button onClick={add} className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-lime text-lg opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100"><FiArrowUpRight /></button></div>
            <div className="mt-3 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide"><div><h3>{product.name}</h3><p className="mt-1 font-normal text-ink/60">{product.type}</p></div><p className="shrink-0">{product.price}</p></div>
          </article>)}
        </div>
      </section>

      <section className="grid border-t border-ink md:grid-cols-2">
        <div className="relative min-h-[530px] bg-ink p-6 text-bone md:p-10"><Image src="/images/model-back.jpeg" alt="Model in OOFY tee" fill className="object-cover opacity-70" /><div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" /><div className="relative flex h-full min-h-[480px] flex-col justify-end"><p className="text-xs font-bold uppercase tracking-[.22em]">Built different</p><h2 className="mt-3 max-w-md text-5xl font-black uppercase leading-[.86] tracking-[-.08em] md:text-7xl">A tee with a point of view.</h2></div></div>
        <div className="flex min-h-[530px] flex-col justify-between bg-bone p-6 md:p-10"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-blue">01 / Details</p><h2 className="mt-3 text-4xl font-black uppercase leading-[.88] tracking-[-.07em] md:text-6xl">More than<br/>just a fit.</h2></div><div className="grid grid-cols-2 gap-6 border-t border-ink pt-5 text-xs font-bold uppercase tracking-wider"><p>240 GSM<br/><span className="font-normal text-ink/60">heavyweight cotton</span></p><p>Relaxed cut<br/><span className="font-normal text-ink/60">built for everyday</span></p><p>Made locally<br/><span className="font-normal text-ink/60">Bangladesh</span></p><p>Limited drop<br/><span className="font-normal text-ink/60">made in small runs</span></p></div></div>
      </section>

      <section className="bg-blue px-5 py-16 text-bone md:px-10 md:py-24"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-bold uppercase tracking-[.25em]">OOFY / Bangladesh</p><h2 className="mt-5 text-5xl font-black uppercase leading-[.82] tracking-[-.09em] sm:text-7xl md:text-8xl">Own your<br/><span className="outline-title">everyday.</span></h2><a href="#shop" className="mt-9 inline-flex items-center gap-3 rounded-full border border-bone px-5 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-bone hover:text-ink">Get yours <FiArrowDownRight className="text-lg" /></a></div></section>

      <footer className="bg-ink px-5 pb-5 pt-12 text-bone md:px-10"><div className="flex flex-col justify-between gap-10 border-b border-bone/25 pb-10 md:flex-row"><div className="flex items-start gap-4"><Image src="/images/logo.jpeg" alt="OOFY logo" width={72} height={72} className="rounded-full" /><div><p className="text-5xl font-black tracking-[-.12em]">OOFY</p><p className="mt-4 max-w-[220px] text-xs font-bold uppercase leading-relaxed tracking-wider text-bone/65">Wear your confidence. Designed in Bangladesh.</p></div></div><div className="grid grid-cols-2 gap-x-16 gap-y-3 text-xs font-bold uppercase tracking-widest"><a href="#shop">Shop</a><a href="#">Instagram</a><a href="#">About</a><a href="#">Contact</a><a href="#">Size guide</a><a href="#">Shipping</a></div></div><div className="flex justify-between pt-5 text-[10px] font-bold uppercase tracking-widest text-bone/50"><span>© 2026 OOFY</span><span>Wear your confidence</span></div></footer>

      {menuOpen && <div className="fixed inset-0 z-50 bg-lime p-5 text-ink md:p-10"><div className="flex justify-between"><p className="text-2xl font-black tracking-[-.1em]">OOFY</p><button onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-ink"><FiX /></button></div><nav className="mt-20 flex flex-col gap-3 text-6xl font-black uppercase leading-none tracking-[-.09em] sm:text-8xl">{["Shop", "About", "Contact", "Admin"].map(item => <a onClick={() => setMenuOpen(false)} href={item === "Shop" ? "#shop" : item === "Admin" ? "/admin" : "#"} key={item}>{item}</a>)}</nav></div>}
      {cartOpen && <div className="fixed inset-0 z-50 bg-ink/30" onClick={() => setCartOpen(false)}><aside onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-full max-w-md flex-col bg-bone p-6 shadow-2xl"><div className="flex items-center justify-between border-b border-ink pb-5"><h2 className="text-xl font-black uppercase tracking-[-.06em]">Your bag ({cart})</h2><button onClick={() => setCartOpen(false)}><FiX className="text-xl" /></button></div><div className="flex flex-1 items-center justify-center text-center"><p className="text-xs font-bold uppercase tracking-widest text-ink/60">{cart ? "Your OOFY piece is reserved." : "Your bag is waiting for its first piece."}</p></div>{cart > 0 && <button className="bg-ink py-4 text-xs font-bold uppercase tracking-widest text-bone">Checkout — ৳ {cart * 1250}</button>}</aside></div>}
    </main>
  );
}
