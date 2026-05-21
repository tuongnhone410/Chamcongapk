
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, LogOut, Clock, DollarSign, Calendar, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  const { 
    activeSession, 
    sessions, 
    settings, 
    punchIn, 
    punchOut, 
    isLoaded 
  } = useAttendance();

  if (!isLoaded) return null;

  const now = new Date();
  const todayStr = now.toDateString();
  
  // Today's sessions
  const todaySessions = sessions.filter(s => new Date(s.checkIn).toDateString() === todayStr);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.totalMinutes, 0);
  const todaySalary = todaySessions.reduce((acc, s) => acc + s.salary, 0);

  // Pay period calculation
  const getPayPeriod = () => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    let startDate: Date;
    let endDate: Date;

    if (day >= settings.payday) {
      // We are in the current month's period
      startDate = new Date(year, month, settings.payday);
      endDate = new Date(year, month + 1, settings.payday - 1, 23, 59, 59);
    } else {
      // We are in the previous month's period
      startDate = new Date(year, month - 1, settings.payday);
      endDate = new Date(year, month, settings.payday - 1, 23, 59, 59);
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getPayPeriod();
  
  const periodSessions = sessions.filter(s => {
    const checkIn = new Date(s.checkIn);
    return checkIn >= startDate && checkIn <= endDate;
  });

  const periodMinutes = periodSessions.reduce((acc, s) => acc + s.totalMinutes, 0);
  const periodSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}g ${m}p`;
  };

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString('vi-VN')}${settings.currency}`;
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">TimeSnap</h1>
          <p className="text-muted-foreground text-sm">Trình Chấm Công Cá Nhân</p>
        </div>
        {activeSession && (
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold uppercase text-green-500">Đang làm việc</span>
          </div>
        )}
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center py-4">
        <Button 
          size="lg"
          onClick={activeSession ? punchOut : punchIn}
          variant={activeSession ? "destructive" : "default"}
          className="w-44 h-44 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex flex-col space-y-2 border-8 border-background"
        >
          {activeSession ? (
            <>
              <LogOut className="w-10 h-10" />
              <span className="text-lg font-bold uppercase tracking-widest">Kết Thúc</span>
            </>
          ) : (
            <>
              <LogIn className="w-10 h-10" />
              <span className="text-lg font-bold uppercase tracking-widest">Bắt Đầu</span>
            </>
          )}
        </Button>
        
        {activeSession && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Bắt đầu lúc</p>
            <p className="text-base font-bold">
              {new Date(activeSession.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Hôm nay</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-background px-2 py-1 rounded-full">
                {now.toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black font-headline">{formatHours(todayMinutes)}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Giờ làm</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{formatCurrency(todaySalary)}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Thu nhập</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-accent/10 text-accent">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Kỳ lương này</h3>
              </div>
              <span className="text-[10px] font-bold text-accent-foreground/60 bg-accent/10 px-2 py-1 rounded-full">
                Từ ngày {settings.payday}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black font-headline">{formatHours(periodMinutes)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng giờ kỳ này</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">{formatCurrency(periodSalary)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Dự kiến nhận</p>
                </div>
              </div>
              <div className="pt-2 border-t border-accent/10">
                <p className="text-[10px] text-muted-foreground italic">
                  Chu kỳ: {startDate.toLocaleDateString('vi-VN')} - {endDate.toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-muted text-muted-foreground">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mức lương</p>
              <p className="text-sm font-bold">{formatCurrency(settings.hourlyRate)}/giờ</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary" asChild>
            <a href="/settings">Thay đổi</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
