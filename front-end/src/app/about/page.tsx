import Image from 'next/image';

export const metadata = {
  title: 'About OOFY',
  description: 'The story behind OOFY — Wear Your Confidence. Premium menswear from Bangladesh.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="mb-16">
        <span className="text-[#0B5D45] font-black uppercase tracking-[0.3em] text-xs mb-4 block">About OOFY</span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#111] leading-tight mb-6">
          Wear Your Confidence
        </h1>
        <p className="text-[#111]/70 leading-relaxed text-lg mb-6">
          OOFY is a Bangladesh-born menswear label built for those who wear their
          confidence every day. Minimal silhouettes, premium fabrics, and a
          streetwear attitude — without the noise.
        </p>
        <p className="text-[#111]/70 leading-relaxed text-lg mb-6">
          We believe clothes should feel as good as they look. Every OOFY piece is
          designed to be simple, sharp, and effortless — from your everyday tee to
          the shirt you wear when it matters most.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div className="aspect-[4/5] rounded-xl border border-[#111]/10 bg-[#F5F2E9]/40 overflow-hidden">
          <Image
            src="https://placehold.co/800x1000/111111/F5F2E9?text=OOFY+About"
            alt="OOFY brand story"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 90vw, 40vw"
          />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#111] mb-4 uppercase">Our Philosophy</h2>
          <ul className="space-y-6 text-[#111]/70 leading-relaxed">
            <li>
              <span className="font-bold text-[#111] mr-2">Minimal.</span>
              No unnecessary decoration. Clean lines that last.
            </li>
            <li>
              <span className="font-bold text-[#111] mr-2">Premium.</span>
              Quality fabrics and honest construction at fair prices.
            </li>
            <li>
              <span className="font-bold text-[#111] mr-2">Youthful.</span>
              Streetwear-inspired cuts for the next generation.
            </li>
            <li>
              <span className="font-bold text-[#111] mr-2">Confident.</span>
              Wear it like you mean it.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-[#111]/10 pt-12">
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-8 uppercase">Made in Bangladesh</h2>
        <p className="text-[#111]/70 leading-relaxed mb-6">
          Designed and served from Bangladesh, with delivery across the country and
          Cash on Delivery so you can shop with confidence.
        </p>
        <p className="text-[#111]/70 leading-relaxed">
          Questions? Write to us at <a href="mailto:oofybrand@gmail.com" className="text-[#0B5D45] underline">oofybrand@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}