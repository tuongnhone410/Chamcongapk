
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LogOut, 
  Calculator, 
  PlayCircle,
  CalendarDays,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, XAxis, Bar, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useState, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

const chartConfig = {
  hours: {
    label: "Giờ làm",
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSalaryDetailOpen, setIsSalaryDetailOpen] = useState(false);
  const [dayLabel, setDayLabel] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const label = isHoliday ? "Ngày Lễ" : now.getDay() === 0 ? "Chủ Nhật" : "Ngày Thường";
    setDayLabel(label);
  }, [isHoliday]);

  useEffect(() => {
    if (!activeSession) return;
    const updateTimer = () => {
      const start = new Date(activeSession.checkIn).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const standardDaysCount = monthSessions.filter(s => ((s.totalMinutes || 0) - breakMinutes) >= 480).length;
    
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

    return { 
      totalMonthHours, 
      chartData: last7Days.map(date => ({ date, hours: parseFloat(((dailyMinutes[date] || 0) / 60).toFixed(1)) })), 
      monthSessionsCount: monthSessions.length, 
      standardDaysCount 
    };
  }, [sessions, isLoaded, settings]);

  const otherAllowancesTotal = useMemo(() => {
    const baseSubjectToAbsence = (settings.allowanceTechnical || 0) + (settings.allowanceResponsibility || 0) + (settings.allowancePosition || 0) + (settings.allowancePerformance || 0);
    const deduction = (baseSubjectToAbsence / 30) * (settings.unexcusedAbsences || 0);
    return (settings.allowanceHousing || 0) + (settings.allowanceFuel || 0) + (settings.allowancePhone || 0) + (settings.allowanceToxic || 0) + (settings.allowanceBonus || 0) + (settings.allowanceProduct || 0) + baseSubjectToAbsence - deduction;
  }, [settings]);

  const salaryInfo = useMemo(() => {
    if (!isLoaded) return null;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < settings.payday ? 1 : 0), settings.payday);
    return calculateFullSalary(sessions.filter(s => new Date(s.checkIn) >= startDate));
  }, [sessions, settings, isLoaded, calculateFullSalary]);

  const handleAction = async (action: 'in' | 'out') => {
    setIsProcessing(true);
    try {
      if (action === 'in') await punchIn();
      else await punchOut();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded || !analyticsData || !salaryInfo) {
    return (
      <div className="space-y-6 pb-24 px-1 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-zinc-900 rounded-xl w-1/3" />
          <div className="h-8 bg-zinc-900 rounded-xl w-1/4" />
        </div>
        <div className="h-24 bg-zinc-900 rounded-[2rem] w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-zinc-900 rounded-[2rem]" />
          <div className="h-24 bg-zinc-900 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => `${Math.round(val || 0).toLocaleString('vi-VN')}₫`;

  return (
    <div className="flex flex-col min-h-0 space-y-6 pb-24 w-full max-w-full overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black font-headline tracking-tighter text-white truncate">TimeSnap</h1>
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest truncate">Dashboard Pro</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-2xl flex items-center gap-2 shrink-0">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black text-white whitespace-nowrap">
            {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </header>

      <DigitalClock />

      <section className="w-full">
        {!activeSession ? (
          <div className="w-full space-y-4">
            <div className="text-center">
              <p className="text-[11px] font-black text-primary uppercase tracking-widest">{dayLabel}</p>
            </div>
            <Button 
              onClick={() => handleAction('in')} 
              disabled={isProcessing} 
              className="w-full rounded-[2rem] h-20 sm:h-24 text-xl sm:text-2xl font-black shadow-2xl gap-3 bg-primary hover:bg-primary/90 text-black active:scale-[0.98] transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <><PlayCircle className="w-8 h-8" /> VÀO CA</>}
            </Button>
          </div>
        ) : (
          <Card className="w-full border-zinc-800 shadow-2xl bg-zinc-950 rounded-[2rem] border-2 overflow-hidden">
            <div className="bg-zinc-900/80 px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-green-500 tracking-tighter">ĐANG LÀM VIỆC</span>
              </div>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-black uppercase">
                HỆ SỐ x{activeSession.multiplier.toFixed(1)}
              </span>
            </div>
            <div className="p-6 text-center space-y-6">
              <div className="text-5xl sm:text-7xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">
                {elapsedTime}
              </div>
              <Button 
                onClick={() => handleAction('out')} 
                disabled={isProcessing} 
                variant="destructive" 
                className="w-full h-16 rounded-[2rem] text-xl font-black active:scale-[0.98] transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <><LogOut className="w-6 h-6 mr-2" /> RA CA</>}
              </Button>
            </div>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 w-full">
        <Card className="bg-zinc-900 rounded-[1.5rem] border-zinc-800 p-4 min-w-0">
          <p className="text-[8px] sm:text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1 truncate">GIỜ CÔNG THÁNG</p>
          <div className="text-2xl sm:text-3xl font-black text-white truncate">{analyticsData.totalMonthHours}h</div>
        </Card>
        <Card className="bg-zinc-900 rounded-[1.5rem] border-zinc-800 p-4 min-w-0">
          <p className="text-[8px] sm:text-[9px] uppercase font-black text-green-500 tracking-widest mb-1 truncate">NGÀY CÔNG (≥8h)</p>
          <div className="text-2xl sm:text-3xl font-black text-green-500 truncate">{analyticsData.standardDaysCount}</div>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900 rounded-[2rem] overflow-hidden w-full">
        <CardContent className="p-5">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center mb-5">Biểu đồ 7 ngày gần nhất</p>
          <ChartContainer config={chartConfig} className="h-[180px] w-full max-w-full">
            <BarChart data={analyticsData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar 
                dataKey="hours" 
                fill="var(--color-hours)" 
                radius={[4, 4, 0, 0]} 
                barSize={24}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground rounded-[2rem] p-5 shadow-xl relative overflow-hidden w-full">
        <div className="flex justify-between items-center relative z-10 gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] uppercase font-black opacity-80 text-black tracking-widest truncate">THỰC LĨNH DỰ KIẾN (NET)</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tighter text-black truncate">{formatCurrency(salaryInfo.netSalary)}</p>
          </div>
          <Dialog open={isSalaryDetailOpen} onOpenChange={setIsSalaryDetailOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="secondary" className="rounded-2xl h-11 w-11 bg-black/20 hover:bg-black/30 border-none shrink-0">
                <Calculator className="w-6 h-6 text-black" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] w-[92vw] max-w-md p-6 max-h-[85vh] overflow-y-auto outline-none">
              <DialogHeader>
                <DialogTitle className="text-lg font-black uppercase tracking-tighter text-primary">Phân tích lương</DialogTitle>
                <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-tight">Chi tiết thu nhập & Khấu trừ</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2">
                    <ArrowUpCircle className="w-3.5 h-3.5" /> Thu nhập (+)
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Lương cơ bản</span>
                      <span className="font-bold shrink-0">{formatCurrency(settings.baseMonthlySalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Lương OT</span>
                      <span className="font-bold text-green-500 shrink-0">{formatCurrency(salaryInfo.sessionSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Phụ cấp cơm</span>
                      <span className="font-bold text-green-500 shrink-0">{formatCurrency(salaryInfo.lunchAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Chuyên cần</span>
                      <span className="font-bold text-green-500 shrink-0">{formatCurrency(salaryInfo.attendanceBonus)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Phụ cấp khác</span>
                      <span className="font-bold text-green-500 shrink-0">{formatCurrency(otherAllowancesTotal)}</span>
                    </div>
                    <Separator className="bg-zinc-800/50" />
                    <div className="flex justify-between items-center text-xs font-black pt-1">
                      <span className="uppercase">TỔNG THU NHẬP</span>
                      <span className="text-primary">{formatCurrency(salaryInfo.grossIncome)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-red-500 flex items-center gap-2">
                    <ArrowDownCircle className="w-3.5 h-3.5" /> Khấu trừ (-)
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Bảo hiểm ({settings.insuranceRate}%)</span>
                      <span className="font-bold text-red-500 shrink-0">-{formatCurrency(salaryInfo.insuranceAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="text-zinc-500 truncate">Đoàn phí</span>
                      <span className="font-bold text-red-500 shrink-0">-{formatCurrency(settings.unionFee)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest shrink-0">THỰC LĨNH (NET)</span>
                    <span className="text-xl sm:text-2xl font-black text-primary truncate">{formatCurrency(salaryInfo.netSalary)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </Card>
    </div>
  );
}
