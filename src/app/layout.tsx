
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AttendanceProvider } from '@/providers/AttendanceProvider';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && pathname !== '/auth') {
      router.push('/auth');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && pathname !== '/auth') {
    return null;
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
      <Head>
        <title>TimeSnap Pro</title>
        <meta name="description" content="Hệ thống chấm công bảo mật" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#09090b" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground pb-20 selection:bg-primary/30">
        <FirebaseClientProvider>
          <AuthGuard>
            <AttendanceProvider>
              <div className="min-h-screen bg-zinc-950">
                <main className="max-w-2xl mx-auto px-4 py-8">
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
