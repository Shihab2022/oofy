export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  discountPrice: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }[];
  variants: {
    id: string;
    size: string;
    color: string | null;
    sku: string | null;
    stock: number;
    price: number | null;
    productId: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  _count?: { products: number };
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  district: string;
  area: string;
  orderNotes: string | null;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    size: string;
    color: string | null;
    productId: string;
    variantId: string | null;
    product: Product | null;
    variant: {
      id: string;
      size: string;
      color: string | null;
      stock: number;
    } | null;
  }[];
};

export type StoreSettings = {
  id: string;
  storeName: string;
  storeTagline: string;
  contactEmail: string;
  deliveryCharge: number;
  freeShippingThreshold: number | null;
  codEnabled: boolean;
  updatedAt: string;
};