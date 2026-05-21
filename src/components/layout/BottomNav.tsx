
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
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 h-16 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-full h-full",
              isActive ? "text-primary scale-110" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
