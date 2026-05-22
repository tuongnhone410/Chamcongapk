
"use client";

import { useState, useEffect } from 'react';

export function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className="text-center py-8">
      <div className="text-6xl font-black font-headline tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        {time.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })}
      </div>
      <div className="text-zinc-500 mt-2 text-xs font-black uppercase tracking-[0.2em] opacity-80">
        {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}
