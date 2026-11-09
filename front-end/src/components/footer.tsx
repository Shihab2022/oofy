export function Footer() {
  return (
    <footer className="border-t border-[#111]/10 bg-[#111] text-[#F5F2E9]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-3">OOFY</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Wear Your Confidence. Premium, minimal streetwear made for
              Bangladesh.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="/shop" className="hover:text-white transition-colors">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="/shop?category=t-shirts" className="hover:text-white transition-colors">
                  T-shirts
                </a>
              </li>
              <li>
                <a href="/shop?category=shirts" className="hover:text-white transition-colors">
                  Shirts
                </a>
              </li>
              <li>
                <a href="/shop?category=hoodies" className="hover:text-white transition-colors">
                  Hoodies
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  About OOFY
                </a>
              </li>
              <li>oofybrand@gmail.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow OOFY</h4>
            <div className="flex gap-3">
              <a href="#" className="opacity-80 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="opacity-80 hover:text-white transition-colors">
                Facebook
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#111]/30 pt-8 text-xs opacity-50 text-center">
          OOFY &middot; All rights reserved.
        </div>
      </div>
    </footer>
  );
}