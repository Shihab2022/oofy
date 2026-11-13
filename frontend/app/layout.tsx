import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./storefront.css";
import "./reference-overrides.css";

export const viewport: Viewport = {
  themeColor: "#121512",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://oofy.store"),
  title: {
    default: "OOFY® — Wear Your Confidence | Contemporary Streetwear Dhaka",
    template: "%s | OOFY®",
  },
  description:
    "Discover high-grade streetwear and contemporary fashion from OOFY Dhaka. Heavyweight french terry tees, oversized hoodies, relaxed cargo pants, and minimal atelier drops. Cash on delivery available nationwide across Bangladesh.",
  keywords: [
    "OOFY",
    "OOFY Bangladesh",
    "streetwear Dhaka",
    "oversized t-shirts Bangladesh",
    "heavyweight hoodies",
    "contemporary streetwear",
    "urban fashion Bangladesh",
    "cash on delivery clothing",
  ],
  authors: [{ name: "OOFY Atelier", url: "https://oofy.store" }],
  creator: "OOFY",
  publisher: "OOFY",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "https://oofy.store",
    siteName: "OOFY®",
    title: "OOFY® — Wear Your Confidence | Contemporary Streetwear Dhaka",
    description:
      "High-grade streetwear essentials made for daily wear. Heavyweight tees, oversized hoodies, relaxed tailoring. Cash on delivery nationwide in Bangladesh.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "OOFY — Wear Your Confidence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OOFY® — Wear Your Confidence",
    description:
      "Contemporary streetwear & luxury essentials from Dhaka, Bangladesh. Fast nationwide cash on delivery.",
    images: ["/icon.svg"],
    creator: "@oofybrand",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
