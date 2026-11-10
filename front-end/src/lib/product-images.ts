const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  'oofy-classic-tee': '/images/products/classic-tee.jpeg',
  'oofy-essential-tee': '/images/products/essential-tee.jpeg',
  'oofy-oxford-shirt': '/images/products/oxford-shirt.jpeg',
  'oofy-heavyweight-hoodie': '/images/products/heavyweight-hoodie.jpeg',
  'oofy-pocket-handkerchief': '/images/products/pocket-handkerchief.jpeg',
};

const DEFAULT_PRODUCT_IMAGE = '/images/products/oofy-product.jpeg';

/** Use the supplied local product photos until an admin replaces seed placeholders. */
export function getProductImage(slug: string, imageUrl?: string | null) {
  if (!imageUrl || imageUrl.includes('placehold.co')) {
    return LOCAL_PRODUCT_IMAGES[slug] || DEFAULT_PRODUCT_IMAGE;
  }

  return imageUrl;
}
