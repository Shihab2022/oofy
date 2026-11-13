"use client";

import { useEffect, useState } from "react";
import { FiMenu, FiShoppingBag, FiX, FiArrowRight } from "react-icons/fi";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

type Props = {
  cartCount?: number;
  onCart?: () => void;
  back?: boolean;
};

export function StoreHeader({ cartCount = 0, onCart, back = false }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{
    text: string;
    visible: boolean;
  }>({
    text: "FREE DELIVERY IN BANGLADESH ON ORDERS OVER ৳2,000 ✦ CASH ON DELIVERY AVAILABLE NATIONWIDE",
    visible: true,
  });

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const custom = res.data.customAnnouncement;
          const threshold = res.data.freeShippingThreshold;

          if (custom && custom.trim()) {
            setAnnouncement({ text: custom.trim(), visible: true });
          } else if (threshold !== null && threshold !== undefined && threshold !== "") {
            const num = Number(threshold);
            if (num === 0) {
              setAnnouncement({
                text: "100% FREE DELIVERY NATIONWIDE ON ALL ORDERS ✦ CASH ON DELIVERY AVAILABLE",
                visible: true,
              });
            } else if (num > 0) {
              setAnnouncement({
                text: `FREE DELIVERY IN BANGLADESH ON ORDERS OVER ৳${num.toLocaleString(
                  "en-BD"
                )} ✦ CASH ON DELIVERY AVAILABLE NATIONWIDE`,
                visible: true,
              });
            } else {
              setAnnouncement({
                text: "CASH ON DELIVERY AVAILABLE NATIONWIDE",
                visible: true,
              });
            }
          } else {
            // Admin has not set a free delivery range
            setAnnouncement({
              text: "CASH ON DELIVERY AVAILABLE NATIONWIDE",
              visible: true,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Top Announcement Bar (Controlled by Admin Settings) */}
      {announcement.visible && announcement.text && (
        <aside
          className="announcement-bar"
          role="region"
          aria-label="Store Announcement"
        >
          <div className="announcement-content">
            <span>{announcement.text}</span>
          </div>
        </aside>
      )}

      {/* Main Navigation Header */}
      <header className="store-header">
        <div className="header-side header-side-left">
          {back ? (
            <a href="/" className="header-link back-link">
              ← Return to Shop
            </a>
          ) : (
            <>
              <button
                className="mobile-menu-btn"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>

              <nav className="desktop-nav" aria-label="Main Navigation">
                <a href="#collection" className="nav-item">
                  Collection
                </a>
                <a href="#manifesto" className="nav-item">
                  Manifesto
                </a>
              </nav>
            </>
          )}
        </div>

        {/* Wordmark Logo */}
        <div className="header-center">
          <a href="/" className="brand-wordmark" aria-label="OOFY Home">
            OOFY<span className="trademark">®</span>
          </a>
        </div>

        {/* Header Right / Bag Button */}
        <div className="header-side header-side-right">
          <button
            type="button"
            onClick={onCart}
            className={`bag-trigger-btn ${cartCount > 0 ? "has-items" : ""}`}
            aria-label={`Shopping bag with ${cartCount} items`}
          >
            <FiShoppingBag className="bag-icon" />
            <span className="bag-text">Bag</span>
            <span className="bag-badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (No admin tab) */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-drawer"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-drawer-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <span className="drawer-title">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-close-btn"
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>
            <nav className="mobile-nav-links">
              <a
                href="#collection"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-link"
              >
                <span>Shop Collection</span>
                <FiArrowRight />
              </a>
              <a
                href="#manifesto"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-link"
              >
                <span>Manifesto & Atelier</span>
                <FiArrowRight />
              </a>
            </nav>
            <div className="mobile-drawer-footer">
              <p>Cash on Delivery Available</p>
              <small>OOFY® Dhaka, Bangladesh</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close dialog"
      onClick={onClick}
      className="icon-button"
    >
      <FiX />
    </button>
  );
}
