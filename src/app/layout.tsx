
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AttendanceProvider } from '@/providers/AttendanceProvider';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'], 
  variable: '--font-inter',
  display: 'swap',
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Đảm bảo loading đã kết thúc trước khi quyết định
    if (!authLoading) {
      if (!user && pathname !== '/auth') {
        router.push('/auth');
      } else {
        setIsReady(true);
      }
    }
  }, [user, authLoading, pathname, router]);

  // Không chặn nếu đang ở trang Auth
  if (pathname === '/auth') return <>{children}</>;

  // Hiển thị spinner mượt mà nếu đang tải hoặc chưa sẵn sàng
  if (authLoading || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
          TimeSnap Pro
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} dark`}>
      <head>
        <title>TimeSnap Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#09090b" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
        <FirebaseClientProvider>
          <AuthGuard>
            <AttendanceProvider>
              <div className="min-h-screen bg-zinc-950">
                <main className="max-w-2xl mx-auto px-4 py-6">
                  {children}
                </main>
                <BottomNav />
              </div>
            </AttendanceProvider>
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
