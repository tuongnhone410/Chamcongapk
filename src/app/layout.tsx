
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TimeSnap - Chấm Công Cá Nhân',
  description: 'Theo dõi giờ làm việc và thu nhập ngoại tuyến.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-body antialiased min-h-screen bg-background text-foreground pb-20">
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
