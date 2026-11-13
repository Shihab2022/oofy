export type Variant = {
  id: string;
  size: string;
  color?: string | null;
  stock: number;
  price?: string | number | null;
  sku?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  _count?: {
    products: number;
  };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  material?: string;
  fit?: string;
  careInstructions?: string;
  countryOfOrigin?: string;
  basePrice: string | number;
  discountPrice?: string | number | null;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isPublished?: boolean;
  isFreeDelivery?: boolean;
  categoryId?: string;
  category?: Category | null;
  images: { id?: string; url: string; alt?: string; position?: number }[];
  variants: Variant[];
};

export type CartItem = {
  product: Product;
  variant: Variant;
  quantity: number;
};

export const money = (value: string | number) => {
  const num = Number(value);
  if (isNaN(num)) return "৳ 0";
  return `৳ ${num.toLocaleString("en-BD")}`;
};

export const productPrice = (product: Product, variant?: Variant) => {
  return variant?.price ?? product.discountPrice ?? product.basePrice;
};

export const isFreeDeliveryProduct = (product?: Product | null): boolean => {
  if (!product) return false;
  return Boolean(
    product.isFreeDelivery ||
    product.careInstructions?.includes("[FREE_DELIVERY]") ||
    product.description?.includes("[FREE_DELIVERY]") ||
    product.shortDescription?.includes("[FREE_DELIVERY]")
  );
};
