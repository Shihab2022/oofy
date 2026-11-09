import { getFeaturedProducts, getNewArrivals, getCategories } from '@/services/product.service';
import { ProductCarousel } from '@/components/product-carousel';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'OOFY — Wear Your Confidence',
  description:
    'Premimal menswear from Bangladesh. Minimal, modern streetwear-inspired confidence. Shop T-shirts, shirts, hoodies and more.',
  openGraph: {
    title: 'OOFY — Wear Your Confidence',
    type: 'website',
  },
};

async function getHeroImage() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/products/featured`, {
      cache: 'no-store',
    });
    const json = await res.json();
    return json.data?.[0]?.images?.[0]?.url;
  } catch {
    return undefined;
  }
}

export default async function HomePage() {
  const [featured, newArrivals, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getNewArrivals().catch(() => []),
    getCategories().catch(() => []),
  ]);

  const heroImage = await getHeroImage();

  return (
    <div className="relative">
      <section className="relative min-h-[85vh] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt="OOFY campaign"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              className="object-cover object-center"
              priority
            />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1600&fit=crop"
              alt="OOFY campaign"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              className="object-cover object-center"
              priority
            />
          )}
          <div className="absolute inset-0 bg-[#111]/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center h-full">
          <p className="text-[#0B5D45] font-black uppercase tracking-[0.3em] text-xs md:text-sm mb-4 animate-fade-in">
            New Collection · Drop 001
          </p>
          <h1 className="font-black text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#F5F2E9] mb-8">
            WEAR YOUR CONFIDENCE
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="bg-[#111] text-[#F5F2E9] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#0B5D45] transition-colors inline-block"
            >
              SHOP NOW
            </Link>
            <a
              href="/about"
              className="border border-[#111] text-[#111] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#111] hover:text-[#F5F2E5] transition-colors inline-block"
            >
              EXPLORE OOFY
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-12 uppercase">FEATURED COLLECTIONS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((cat: any) => (
            <a
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-square rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#111]/40 group-hover:bg-[#111]/20 transition-colors" />
              <span className="relative z-10 px-4 py-2 text-xs font-black uppercase leading-tight text-[#111]">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </section>

      <ProductCarousel
        title="New Arrivals"
        products={newArrivals}
        href="/shop?sort=newest"
      />

      <ProductCarousel
        title="Featured"
        products={featured}
        href="/shop?sort=popularity"
      />

      <section className="py-20 max-w-7xl mx-auto px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0B5D45]/5" />
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#111] mb-4 uppercase leading-tight">
              Built for Confidence
            </h2>
            <p className="text-[#111]/70 leading-relaxed mb-6">
              OOFY is a Bangladesh-born menswear label. Minimal silhouettes,
              premium fabrics, and a streetwear attitude — made for those who
              wear their confidence every day.
            </p>
            <Link href="/about" className="text-xs font-bold tracking-wider text-[#0B5D45] hover:underline uppercase">
              Learn more about OOFY
            </Link>
          </div>
          <div className="aspect-[4/5] rounded-xl border border-[#111]/10 bg-[#F5F2E9]/40 overflow-hidden">
            <Image
              src={heroImage || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1600&fit=crop'}
              alt="OOFY brand"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 90vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-8 uppercase">Join the OOFY list</h2>
        <p className="text-[#111]/70 mb-8 max-w-md mx-auto text-sm">
          Be the first to know about new drops and early access.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <input
            type="email"
            placeholder="you@example.com"
            className="flex-1 h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#111]"
          />
          <button className="bg-[#111] text-[#F5F2E9] px-6 py-2 text-xs font-bold uppercase hover:bg-[#0B5D45] transition-colors">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
