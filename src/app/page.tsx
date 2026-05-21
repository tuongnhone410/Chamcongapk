
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, DollarSign, Calendar, Calculator, TrendingUp, Target, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMemo } from 'react';

export default function Home() {
  const { 
    activeSession, 
    sessions, 
    settings, 
    punchIn, 
    punchOut, 
    isLoaded 
  } = useAttendance();

  // Thống kê 7 ngày gần nhất cho biểu đồ
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });

    return last7Days.map(dateStr => {
      const daySessions = sessions.filter(s => new Date(s.checkIn).toDateString() === dateStr);
      const totalSalary = daySessions.reduce((acc, s) => acc + s.salary, 0);
      const date = new Date(dateStr);
      return {
        name: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        salary: totalSalary,
      };
    });
  }, [sessions]);

  if (!isLoaded) return null;

  const now = new Date();
  const todayStr = now.toDateString();
  
  const todaySessions = sessions.filter(s => new Date(s.checkIn).toDateString() === todayStr);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.totalMinutes, 0);
  const todaySalary = todaySessions.reduce((acc, s) => acc + s.salary, 0);

  const getPayPeriod = () => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    let startDate: Date;
    let endDate: Date;

    if (day >= settings.payday) {
      startDate = new Date(year, month, settings.payday);
      endDate = new Date(year, month + 1, settings.payday - 1, 23, 59, 59);
    } else {
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

  const periodSalary = periodSessions.reduce((acc, s) => acc + s.salary, 0);
  const targetPercent = Math.min(Math.round((periodSalary / settings.monthlyTarget) * 100), 100);
  
  // Gợi ý thông minh
  const remainingAmount = Math.max(settings.monthlyTarget - periodSalary, 0);
  const hoursNeeded = remainingAmount > 0 ? (remainingAmount / settings.hourlyRate).toFixed(1) : 0;

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
      </div>

      {/* Thống kê mục tiêu */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Mục tiêu tháng này
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-black font-headline">{targetPercent}%</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Tiến độ thu nhập</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{formatCurrency(periodSalary)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mục tiêu: {formatCurrency(settings.monthlyTarget)}</p>
            </div>
          </div>
          <Progress value={targetPercent} className="h-2" />
          
          {remainingAmount > 0 ? (
            <div className="bg-primary/5 p-3 rounded-lg flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bạn đã đạt {targetPercent}% mục tiêu. Cần kiếm thêm <span className="font-bold text-primary">{formatCurrency(remainingAmount)}</span>, tương đương khoảng <span className="font-bold text-primary">{hoursNeeded} giờ</span> nữa để hoàn thành.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/10 p-3 rounded-lg flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
              <p className="text-xs text-green-600 font-medium">
                Tuyệt vời! Bạn đã vượt mục tiêu thu nhập của tháng này.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Biểu đồ xu hướng */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Xu hướng thu nhập (7 ngày)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-48 pt-4">
          <ChartContainer config={{ salary: { label: "Thu nhập", color: "hsl(var(--primary))" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <Bar 
                  dataKey="salary" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Hôm nay</p>
            <p className="text-lg font-black font-headline">{formatHours(todayMinutes)}</p>
            <p className="text-xs font-bold text-primary">{formatCurrency(todaySalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Lương giờ</p>
            <p className="text-lg font-black font-headline">{formatCurrency(settings.hourlyRate)}</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold" asChild>
              <a href="/settings">Thay đổi</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
