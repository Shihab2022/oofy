"use client";
import { useState } from "react";
import { Product } from "./types";
export function ProductGallery({ product }: { product: Product }) { const [selected, setSelected] = useState(0); const image = product.images[selected] || product.images[0]; return <div className="product-gallery"><div className="main-product-image">{image ? <img src={image.url} alt={image.alt || product.name}/> : <div className="image-fallback">OOFY</div>}</div>{product.images.length > 1 && <div className="product-thumbnails">{product.images.map((item, index) => <button key={`${item.url}-${index}`} onClick={() => setSelected(index)} className={index === selected ? "active" : ""}><img src={item.url} alt={`${product.name} view ${index + 1}`}/></button>)}</div>}</div>; }
