"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Trang chủ', icon: Home, href: '/' },
    { label: 'Lịch sử', icon: History, href: '/history' },
    { label: 'Cài đặt', icon: Settings, href: '/settings' },
  ];

  if (pathname === '/auth') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/98 border-t border-zinc-800/50 backdrop-blur-xl h-[calc(4rem+env(safe-area-inset-bottom))] flex items-center justify-around px-4 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-all duration-200 w-full h-full relative",
              isActive ? "text-primary" : "text-zinc-500 active:scale-90"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full blur-[2px]" />
            )}
            <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 fill-primary/10")} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter transition-all",
              isActive ? "opacity-100 translate-y-0" : "opacity-60"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}