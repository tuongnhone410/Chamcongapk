"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, 
  Calculator, 
  CalendarCheck, 
  AlertTriangle, 
  Award,
  Zap,
  Clock,
  PlayCircle,
  BarChart3,
  CalendarDays,
  Timer
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';

const chartConfig = {
  hours: {
    label: "Giờ công",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function Home() {
  const { 
    activeSession, 
    sessions, 
    settings, 
    punchIn, 
    punchOut, 
    isLoaded,
    calculateFullSalary,
    isHoliday
  } = useAttendance();

  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [sessionMinutes, setSessionMinutes] = useState<number>(0);

  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const start = new Date(activeSession.checkIn).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      setSessionMinutes(Math.floor(diffMs / 60000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const analyticsData = useMemo(() => {
    if (!isLoaded) return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSessions = sessions.filter(s => new Date(s.checkIn) >= startOfMonth && s.checkOut);
    const totalMonthMinutes = monthSessions.reduce((acc, s) => acc + (s.totalMinutes || 0), 0);
    const totalMonthHours = (totalMonthMinutes / 60).toFixed(1);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    const dailyMinutes: Record<string, number> = {};
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    sessions.filter(s => new Date(s.checkIn) >= weekAgo && s.checkOut).forEach(s => {
      const dateKey = new Date(s.checkIn).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dailyMinutes[dateKey] = (dailyMinutes[dateKey] || 0) + (s.totalMinutes || 0);
    });

    const chartData = last7Days.map(date => ({
      date,
      hours: parseFloat(((dailyMinutes[date] || 0) / 60).toFixed(1))
    }));

    return { totalMonthHours, chartData, monthSessionsCount: monthSessions.length };
  }, [sessions, isLoaded]);

  const salaryInfo = useMemo(() => {
    if (!isLoaded) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    let startDate, endDate;
    if (day >= settings.payday) {
      startDate = new Date(year, month, settings.payday);
      endDate = new Date(year, month + 1, settings.payday - 1, 23, 59, 59);
    } else {
      startDate = new Date(year, month - 1, settings.payday);
      endDate = new Date(year, month, settings.payday - 1, 23, 59, 59);
    }
    const periodSessions = sessions.filter(s => {
      const checkIn = new Date(s.checkIn);
      return checkIn >= startDate && checkIn <= endDate;
    });
    return calculateFullSalary(periodSessions);
  }, [sessions, settings, isLoaded, calculateFullSalary]);

  if (!isLoaded || !analyticsData || !salaryInfo) return null;

  const formatCurrency = (val: number) => `${Math.round(val || 0).toLocaleString('vi-VN')}₫`;
  
  // Logic hiển thị tiền OT "nhảy" theo thời gian thực (có trừ giờ nghỉ)
  const breakMinutes = settings.breakTimeDeduction * 60;
  const effectiveSessionMinutes = sessionMinutes > breakMinutes ? sessionMinutes - breakMinutes : sessionMinutes;

  const currentOTSalary = activeSession 
    ? (activeSession.multiplier === 1.0 
      ? (effectiveSessionMinutes > 510 ? ((effectiveSessionMinutes - 480) / 60) * settings.hourlyRate * settings.overtimeMultiplier : 0)
      : (effectiveSessionMinutes / 60) * settings.hourlyRate * activeSession.multiplier)
    : 0;

  const currentOTHours = activeSession && activeSession.multiplier === 1.0 && effectiveSessionMinutes > 510
    ? ((effectiveSessionMinutes - 480) / 60).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black font-headline tracking-tighter">TimeSnap</h1>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Dashboard Pro</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black text-white">{new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center">
        {!activeSession ? (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <p className="text-base font-black text-primary uppercase">
                {isHoliday ? `Ngày Lễ (x${settings.holidayMultiplier.toFixed(1)})` : new Date().getDay() === 0 ? `Chủ Nhật (x${settings.sundayMultiplier.toFixed(1)})` : `Ngày Thường (Tự động OT x${settings.overtimeMultiplier.toFixed(1)} sau 8h30p làm việc)`}
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Đã trừ {settings.breakTimeDeduction}h nghỉ hàng ngày</p>
            </div>
            <Button 
              onClick={() => punchIn()} 
              className="w-full rounded-[2rem] h-24 text-2xl font-black shadow-2xl gap-3 bg-primary hover:bg-primary/90 transition-all active:scale-95 border-b-4 border-black/20"
            >
              <PlayCircle className="w-8 h-8" />
              VÀO CA
            </Button>
          </div>
        ) : (
          <Card className="w-full border-zinc-800 shadow-2xl overflow-hidden bg-zinc-950 rounded-[2.5rem] border-2">
            <CardContent className="p-0">
              <div className="bg-zinc-900/80 p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-green-500">LIVE: ĐANG LÀM VIỆC</span>
                </div>
                <div className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full font-black">
                  Hệ số: x{activeSession.multiplier.toFixed(1)}
                </div>
              </div>
              
              <div className="p-8 text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">THỜI GIAN TRÔI QUA</p>
                  <div className="text-7xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">
                    {elapsedTime}
                  </div>
                  <div className="pt-4 flex flex-col gap-2 items-center">
                    <span className={cn(
                      "text-[10px] font-black px-4 py-2 rounded-full border uppercase tracking-widest",
                      effectiveSessionMinutes > 510 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {effectiveSessionMinutes > 510 ? `TRẠNG THÁI: ĐANG TÍNH OT ${settings.overtimeMultiplier}` : "TRẠNG THÁI: GIỜ HÀNH CHÍNH"}
                    </span>
                    {effectiveSessionMinutes > 510 && (
                      <p className="text-xs font-bold text-orange-500 animate-bounce">+{currentOTHours}h OT (Đã trừ {settings.breakTimeDeduction}h nghỉ)</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-zinc-900 py-6">
                  <div className="text-left">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">BẮT ĐẦU</p>
                    <p className="text-xl font-black text-white">{new Date(activeSession.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">TIỀN OT DỰ KIẾN</p>
                    <p className="text-xl font-black text-green-500">+{formatCurrency(currentOTSalary)}</p>
                  </div>
                </div>

                <Button 
                  onClick={punchOut} 
                  variant="destructive" 
                  className="w-full h-24 rounded-[2rem] shadow-xl text-2xl font-black group border-b-4 border-black/20"
                >
                  <LogOut className="w-7 h-7 mr-2" />
                  RA CA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-2xl bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800">
          <CardContent className="p-4 flex flex-col justify-between">
            <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-2">TỔNG GIỜ CÔNG THÁNG</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{analyticsData.totalMonthHours}</span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase">GIỜ</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800">
          <CardContent className="p-4 flex flex-col justify-between">
            <p className="text-[9px] uppercase font-black text-orange-500 tracking-widest mb-2">TỔNG GIỜ OT 1.5</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-orange-500">{(salaryInfo.totalOTMinutes / 60).toFixed(1)}</span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase">GIỜ</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900 shadow-xl rounded-[2rem] overflow-hidden border">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-zinc-400">
            <BarChart3 className="w-4 h-4 text-primary" />
            Giờ công 7 ngày qua
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="h-[180px] w-full mb-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar 
                    dataKey="hours" 
                    radius={[6, 6, 0, 0]} 
                    barSize={20}
                  >
                    {analyticsData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hours >= 8 ? "hsl(var(--primary))" : "#3f3f46"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="flex justify-between items-center px-2 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-sm" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Trên 8h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zinc-700 rounded-sm" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Dưới 8h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl overflow-hidden bg-primary text-primary-foreground rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black opacity-80 tracking-widest">THỰC LĨNH DỰ KIẾN (KỲ LƯƠNG)</p>
              <p className="text-5xl font-black tracking-tighter">{formatCurrency(salaryInfo.netSalary)}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12 rounded-2xl">
                  <Calculator className="w-7 h-7" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 shadow-2xl border-none p-5 rounded-3xl bg-zinc-950 text-white border-2 border-zinc-800">
                <div className="space-y-4">
                  <h4 className="font-black border-b border-zinc-800 pb-3 text-primary flex items-center gap-2 text-lg">
                    <Calculator className="w-5 h-5" />
                    CHI TIẾT LƯƠNG
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Lương cơ bản:</span> <span className="text-white">{formatCurrency(settings.baseMonthlySalary)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Lương OT (Đã trừ nghỉ):</span> <span className="text-green-500">+{formatCurrency(salaryInfo.sessionSalary)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-orange-400">
                      <span>Tổng giờ OT 1.5:</span> <span>{(salaryInfo.totalOTMinutes / 60).toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Phụ cấp/Cơm:</span> <span className="text-green-500">+{formatCurrency(salaryInfo.lunchAllowance + salaryInfo.otherAllowances)}</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2.5 flex justify-between text-sm font-black">
                      <span className="text-zinc-300">Tổng thu nhập:</span> <span className="text-primary">{formatCurrency(salaryInfo.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-red-500">
                      <span>Khấu trừ (BH+Thuế):</span> <span>-{formatCurrency(salaryInfo.insuranceAmount + salaryInfo.incomeTaxAmount + (settings.unionFee || 0))}</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
              <span>MỤC TIÊU: {formatCurrency(settings.monthlyTarget)}</span>
              <span>{Math.min(Math.round((salaryInfo.netSalary / (settings.monthlyTarget || 1)) * 100), 100)}%</span>
            </div>
            <Progress value={Math.min(Math.round((salaryInfo.netSalary / (settings.monthlyTarget || 1)) * 100), 100)} className="h-3 bg-white/20 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
