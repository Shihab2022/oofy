import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import "./reference-overrides.css";

export const metadata: Metadata = {
  title: "OOFY — Wear Your Confidence",
  description: "OOFY contemporary essentials.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
