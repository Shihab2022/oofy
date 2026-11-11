export type Variant = { id: string; size: string; color?: string | null; stock: number; price?: string | number | null };
export type Product = {
  id: string; name: string; slug: string; description?: string; shortDescription?: string;
  material?: string; fit?: string; careInstructions?: string; countryOfOrigin?: string;
  basePrice: string | number; discountPrice?: string | number | null;
  images: { url: string; alt?: string }[]; variants: Variant[];
};
export type CartItem = { product: Product; variant: Variant; quantity: number };
export const money = (value: string | number) => `৳ ${Number(value).toLocaleString("en-BD")}`;
export const productPrice = (product: Product, variant?: Variant) => variant?.price ?? product.discountPrice ?? product.basePrice;
