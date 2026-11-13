"use client";

import { FiArrowUpRight } from "react-icons/fi";

export function SiteFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer-v2">
      <div className="footer-main-grid">
        <div className="footer-brand-col">
          <a href="/" className="footer-brand-logo">
            OOFY<span>®</span>
          </a>
          <p className="footer-tagline">
            Move with intent. Contemporary streetwear built with heavy fabrics,
            unforced fits, and deliberate detail.
          </p>
          <div className="footer-atelier-badge">
            <span>Atelier Dhaka</span>
            <span className="bullet">•</span>
            <span>Est. 2026</span>
          </div>
        </div>

        <div className="footer-nav-col">
          <p className="footer-col-title">Collection</p>
          <ul className="footer-links-list">
            <li>
              <a href="/products">All Drops & Pieces</a>
            </li>
            <li>
              <a href="/#collection">Seasonal Staples</a>
            </li>
            <li>
              <a href="/products?category=hoodies">Hoodies & Sweats</a>
            </li>
            <li>
              <a href="/products?category=t-shirts">Heavyweight Tees</a>
            </li>
          </ul>
        </div>

        <div className="footer-nav-col">
          <p className="footer-col-title">Client Care</p>
          <ul className="footer-links-list">
            <li>
              <a href="/contact">Contact Atelier & Support</a>
            </li>
            <li>
              <a href="/#manifesto">Returns & Exchanges (14 Days)</a>
            </li>
            <li>
              <a href="mailto:support@oofy.store">support@oofy.store</a>
            </li>
            <li>
              <a href="tel:+8801712345678">+880 1712-345678</a>
            </li>
          </ul>
        </div>

        <div className="footer-promise-col">
          <p className="footer-col-title">Our Promise</p>
          <p className="promise-text">
            Every garment is backed by our 14-day exchange guarantee. We only release
            items made to endure regular wear.
          </p>
          <div className="cod-badge-box">
            <strong>CASH ON DELIVERY</strong>
            <span>Doorstep package inspection across Bangladesh</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p className="footer-copyright">
          © {new Date().getFullYear()} OOFY®. All rights reserved. Crafted in Dhaka, Bangladesh.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className="scroll-top-btn"
          aria-label="Scroll to top"
        >
          Back to Top ↑
        </button>
      </div>
    </footer>
  );
}
