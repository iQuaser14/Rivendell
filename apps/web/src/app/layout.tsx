import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Rivendell — Portfolio Manager',
  description: 'Institutional-grade personal portfolio tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
