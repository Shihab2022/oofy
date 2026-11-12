"use client";
import { useEffect, useState } from "react";
import {
  CollectionIntro,
  Hero,
  Manifesto,
  ProductCollection,
  ServiceStrip,
} from "../components/storefront/HomeSections";
import { SiteFooter } from "../components/storefront/SiteFooter";
import { StoreHeader } from "../components/storefront/StoreHeader";
import { Product } from "../components/storefront/types";
const API = process.env.NEXT_PUBLIC_API_URL;
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch(`${API}/products?limit=100`)
      .then((r) => r.json())
      .then((catalog) => setProducts(catalog.data?.products || []))
      .catch(() => setNotice("The collection is temporarily unavailable."));
  }, []);
  return (
    <main>
      <StoreHeader />
      {notice && <div className="notice">{notice}</div>}
      <Hero />

      <ProductCollection products={products} />
      <CollectionIntro />
      <Manifesto />
      <ServiceStrip />
      <SiteFooter />
    </main>
  );
}
