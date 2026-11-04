import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/lib/env';

const prisma = new PrismaClient();

async function main() {
  /* ---------------------------------------------------------------- */
  /*  Admin account                                                   */
  /* ---------------------------------------------------------------- */
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await prisma.admin.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { name: env.ADMIN_NAME, role: 'ADMIN', isActive: true },
    create: {
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin ready: ${env.ADMIN_EMAIL}`);

  /* ---------------------------------------------------------------- */
  /*  Default categories                                              */
  /* ---------------------------------------------------------------- */
  const categories = [
    { name: 'T-Shirts', slug: 't-shirts', description: 'Premium casual tees for everyday confidence.', sortOrder: 1 },
    { name: 'Shirts', slug: 'shirts', description: 'Casual and button-down shirts.', sortOrder: 2 },
    { name: 'Hoodies', slug: 'hoodies', description: 'Warm hoodies for cooler days.', sortOrder: 3 },
    { name: 'Handkerchiefs', slug: 'handkerchiefs', description: 'Classic cotton handkerchiefs.', sortOrder: 4 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  console.log('✅ Categories seeded');

  const tShirts = await prisma.category.findUnique({ where: { slug: 't-shirts' } });

  /* ---------------------------------------------------------------- */
  /*  Store settings                                                  */
  /* ---------------------------------------------------------------- */
  const settings = [
    { key: 'companyName', value: env.COMPANY_NAME },
    { key: 'companyEmail', value: env.COMPANY_EMAIL },
    { key: 'companyPhone', value: env.COMPANY_PHONE },
    { key: 'companyAddress', value: env.COMPANY_ADDRESS },
    { key: 'deliveryFeeDhaka', value: String(env.DELIVERY_FEE_DHAKA) },
    { key: 'deliveryFeeOutsideDhaka', value: String(env.DELIVERY_FEE_OUTSIDE_DHAKA) },
    { key: 'announcementText', value: 'Delivery available all over Bangladesh' },
    { key: 'codEnabled', value: 'true' },
    { key: 'bkashEnabled', value: String(env.BKASH_ENABLED) },
    { key: 'nagadEnabled', value: String(env.NAGAD_ENABLED) },
  ];
  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅ Store settings seeded');

  /* ---------------------------------------------------------------- */
  /*  Demo products                                                   */
  /* ---------------------------------------------------------------- */
  const demo = [
    {
      name: 'Classic Black Oversized Tee',
      slug: 'classic-black-oversized-tee',
      description: 'Relaxed oversized fit, soft black cotton, drop shoulder.',
      price: 450,
      sku: 'OOFY-TEE-001',
      categoryId: tShirts?.id ?? null,
      isFeatured: true,
      isNewArrival: true,
      sizes: [
        { size: 'M', stock: 20 },
        { size: 'L', stock: 20 },
        { size: 'XL', stock: 20 },
      ],
      images: [
        {
          url: 'https://placehold.co/800x800/111111/F5F2E9?text=Classic+Black+Oversized+Tee',
          alt: 'Classic Black Oversized Tee',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Milan Italy Graphic Tee',
      slug: 'milan-italy-graphic-tee',
      description: 'Large MILAN lettering with a black-and-white cathedral print and a small coordinates label on the chest.',
      price: 450,
      sku: 'OOFY-TEE-002',
      categoryId: tShirts?.id ?? null,
      isFeatured: false,
      isNewArrival: true,
      sizes: [
        { size: 'M', stock: 15 },
        { size: 'L', stock: 15 },
        { size: 'XL', stock: 15 },
      ],
      images: [
        {
          url: 'https://placehold.co/800x800/111111/F5F2E9?text=Milan+Italy+Graphic+Tee',
          alt: 'Milan Italy Graphic Tee',
          isPrimary: true,
        },
      ],
    },
  ];

  for (const p of demo) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`⏩ Skipping existing product: ${p.name}`);
      continue;
    }
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: String(p.price),
        sku: p.sku,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isActive: true,
        sizes: {
          create: p.sizes.map((s) => ({
            size: s.size,
            stock: s.stock,
            sku: `${p.sku}-${s.size}`,
          })),
        },
        images: {
          create: p.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`✅ Product created: ${p.name}`);
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
