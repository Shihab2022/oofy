import { db } from '../src/config/db';

const IMG = (text: string, bg = '111111', fg = 'F5F2E9') =>
  `https://placehold.co/800x1000/${bg}/${fg}?text=${encodeURIComponent(text)}&font=bold`;

async function main() {
  console.log('🌱 Seeding database...');

  const categories = await Promise.all([
    db.category.upsert({
      where: { slug: 't-shirts' },
      update: {},
      create: {
        name: 'T-shirts',
        slug: 't-shirts',
        description: 'Premium cotton tees built for everyday confidence.',
        isActive: true,
      },
    }),
    db.category.upsert({
      where: { slug: 'shirts' },
      update: {},
      create: {
        name: 'Shirts',
        slug: 'shirts',
        description: 'Sharp, minimal shirts for a polished streetwear look.',
        isActive: true,
      },
    }),
    db.category.upsert({
      where: { slug: 'hoodies' },
      update: {},
      create: {
        name: 'Hoodies',
        slug: 'hoodies',
        description: 'Heavyweight hoodies for cooler days and confident nights.',
        isActive: true,
      },
    }),
    db.category.upsert({
      where: { slug: 'handkerchiefs' },
      update: {},
      create: {
        name: 'Handkerchiefs',
        slug: 'handkerchiefs',
        description: 'Finishing touches for your pocket.',
        isActive: true,
      },
    }),
  ]);

  const [tshirts, shirts, hoodies, handkerchiefs] = categories;
  const products = [
    {
      name: 'OOFY Classic Tee',
      slug: 'oofy-classic-tee',
      description:
        'The cornerstone of the OOFY wardrobe. Heavy-weight cotton, relaxed fit, minimal branding. Wear your confidence.',
      categoryId: tshirts.id,
      basePrice: 450,
      discountPrice: null,
      isFeatured: true,
      isNewArrival: true,
      isPublished: true,
      images: [
        { url: IMG('OOFY Classic Tee'), alt: 'OOFY Classic Tee front', position: 0 },
        { url: IMG('Classic Tee Back', '0B5D45', 'FFFFFF'), alt: 'OOFY Classic Tee back', position: 1 },
      ],
      variants: [
        { size: 'M', color: 'Black', sku: 'OOFY-CT-M-BLK', stock: 25, price: null },
        { size: 'L', color: 'Black', sku: 'OOFY-CT-L-BLK', stock: 25, price: null },
        { size: 'XL', color: 'Black', sku: 'OOFY-CT-XL-BLK', stock: 20, price: null },
        { size: 'M', color: 'Off-white', sku: 'OOFY-CT-M-OW', stock: 15, price: null },
        { size: 'L', color: 'Off-white', sku: 'OOFY-CT-L-OW', stock: 15, price: null },
      ],
    },
    {
      name: 'OOFY Essential Tee',
      slug: 'oofy-essential-tee',
      description:
        'Clean lines, premium comfort. An everyday essential for those who let their style speak quietly.',
      categoryId: tshirts.id,
      basePrice: 450,
      discountPrice: 390,
      isFeatured: false,
      isNewArrival: true,
      isPublished: true,
      images: [
        { url: IMG('OOFY Essential Tee'), alt: 'OOFY Essential Tee front', position: 0 },
      ],
      variants: [
        { size: 'M', color: 'Black', sku: 'OOFY-ET-M-BLK', stock: 30, price: null },
        { size: 'L', color: 'Black', sku: 'OOFY-ET-L-BLK', stock: 30, price: null },
        { size: 'XL', color: 'Black', sku: 'OOFY-ET-XL-BLK', stock: 20, price: null },
      ],
    },
    {
      name: 'OOFY Oxford Shirt',
      slug: 'oofy-oxford-shirt',
      description:
        'A sharp, minimal shirt that transitions effortlessly from day to night.',
      categoryId: shirts.id,
      basePrice: 1200,
      discountPrice: null,
      isFeatured: true,
      isNewArrival: false,
      isPublished: true,
      images: [
        { url: IMG('OOFY Oxford Shirt', '0B5D45', 'FFFFFF'), alt: 'OOFY Oxford Shirt', position: 0 },
      ],
      variants: [
        { size: 'M', color: 'White', sku: 'OOFY-OX-M-WHT', stock: 12, price: null },
        { size: 'L', color: 'White', sku: 'OOFY-OX-L-WHT', stock: 12, price: null },
        { size: 'XL', color: 'White', sku: 'OOFY-OX-XL-WHT', stock: 10, price: null },
      ],
    },
    {
      name: 'OOFY Heavyweight Hoodie',
      slug: 'oofy-heavyweight-hoodie',
      description:
        'Built for colder days. Oversized fit, premium fleece, bold minimal confidence.',
      categoryId: hoodies.id,
      basePrice: 1800,
      discountPrice: 1550,
      isFeatured: false,
      isNewArrival: false,
      isPublished: true,
      images: [
        { url: IMG('OOFY Heavyweight Hoodie'), alt: 'OOFY Heavyweight Hoodie', position: 0 },
      ],
      variants: [
        { size: 'M', color: 'Black', sku: 'OOFY-HH-M-BLK', stock: 18, price: null },
        { size: 'L', color: 'Black', sku: 'OOFY-HH-L-BLK', stock: 18, price: null },
        { size: 'XL', color: 'Black', sku: 'OOFY-HH-XL-BLK', stock: 15, price: null },
      ],
    },
    {
      name: 'OOFY Pocket Handkerchief',
      slug: 'oofy-pocket-handkerchief',
      description:
        'A small detail with a big impact. The finishing touch for your breast pocket.',
      categoryId: handkerchiefs.id,
      basePrice: 150,
      discountPrice: null,
      isFeatured: false,
      isNewArrival: false,
      isPublished: true,
      images: [
        { url: IMG('OOFY Handkerchief', 'F5F2E9', '111111'), alt: 'OOFY Pocket Handkerchief', position: 0 },
      ],
      variants: [
        { size: 'One Size', color: 'White', sku: 'OOFY-HK-OS-WHT', stock: 50, price: null },
      ],
    },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        discountPrice: p.discountPrice,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isPublished: p.isPublished,
        categoryId: p.categoryId,
        images: {
          create: p.images.map((img, i) => ({ url: img.url, alt: img.alt, position: i })),
        },
        variants: {
          create: p.variants.map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock: v.stock,
            price: v.price,
          })),
        },
      },
    });
  }

  await db.storeSettings.upsert({
    where: { id: 'oofy-store-settings' },
    update: {},
    create: {
      id: 'oofy-store-settings',
      storeName: 'OOFY',
      storeTagline: 'Wear Your Confidence',
      contactEmail: 'oofybrand@gmail.com',
      deliveryCharge: 60,
      freeShippingThreshold: 2000,
      codEnabled: true,
    },
  });

  await db.emailSettings.upsert({
    where: { id: 'oofy-email-settings' },
    update: {},
    create: {
      id: 'oofy-email-settings',
      smtpHost: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      smtpPort: Number(process.env.SMTP_PORT) || 2525,
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      fromEmail: process.env.SMTP_FROM || 'noreply@oofy.com',
      fromName: process.env.SMTP_FROM_NAME || 'OOFY',
      isActive: true,
    },
  });

  console.log('✅ Seed complete.');
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });