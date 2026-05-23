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
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !authLoading) {
      if (!user && pathname !== '/auth') {
        router.push('/auth');
      } else {
        setIsReady(true);
      }
    }
  }, [user, authLoading, pathname, router, isMounted]);

  if (!isMounted) return null;

  if (pathname === '/auth') return <>{children}</>;

  if (authLoading || !isReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950">
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
      <body className="antialiased min-h-screen">
        <FirebaseClientProvider>
          <AuthGuard>
            <AttendanceProvider>
              <div id="main-scroll-area" className="pt-safe">
                <main className="max-w-2xl mx-auto w-full px-4 pt-4 content-wrapper">
                  {children}
                </main>
              </div>
              <BottomNav />
              <FirebaseErrorListener />
            </AttendanceProvider>
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
