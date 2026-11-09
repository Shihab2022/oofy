import type { Metadata } from 'next';
import { AnnouncementBar } from '@/components/announcement-bar';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ToastRoot } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    template: '%s | OOFY',
    default: 'OOFY — Wear Your Confidence',
  },
  description:
    'Premium menswear from Bangladesh. Minimal, modern, streetwear-inspired confidence you can wear.',
  metadataBase: new URL('https://oofy.com'),
  openGraph: {
    siteName: 'OOFY',
    title: 'OOFY — Wear Your Confidence',
    description:
      'Premium menswear from Bangladesh. Minimal, modern, streetwear-inspired confidence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F5F2E9] text-[#111] antialiased">
        <ToastRoot />
        <AnnouncementBar />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}