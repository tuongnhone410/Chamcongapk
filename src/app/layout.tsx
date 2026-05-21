
import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
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
