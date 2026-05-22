
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
  ArrowUpCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, XAxis, Bar } from "recharts";
import { useState, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSalaryDetailOpen, setIsSalaryDetailOpen] = useState(false);

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
  }, [sessions, isLoaded, settings.breakTimeDeduction]);

  const otherAllowancesTotal = useMemo(() => {
    const baseSubjectToAbsence = (settings.allowanceTechnical || 0) + (settings.allowanceResponsibility || 0) + (settings.allowancePosition || 0) + (settings.allowancePerformance || 0);
    const deduction = (baseSubjectToAbsence / 30) * (settings.unexcusedAbsences || 0);
    return (settings.allowanceHousing || 0) + (settings.allowanceFuel || 0) + (settings.allowancePhone || 0) + (settings.allowanceToxic || 0) + (settings.allowanceBonus || 0) + (settings.allowanceProduct || 0) + baseSubjectToAbsence - deduction;
  }, [settings]);

  const salaryInfo = useMemo(() => {
    if (!isLoaded) return null;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < settings.payday ? 1 : 0), settings.payday);
    const endDate = new Date(now.getFullYear(), now.getMonth() + (now.getDate() < settings.payday ? 0 : 1), settings.payday - 1, 23, 59, 59);
    return calculateFullSalary(sessions.filter(s => new Date(s.checkIn) >= startDate && new Date(s.checkIn) <= endDate));
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

  if (!isLoaded || !analyticsData || !salaryInfo) return null;

  const formatCurrency = (val: number) => `${Math.round(val || 0).toLocaleString('vi-VN')}₫`;

  return (
    <div className="space-y-6 pb-24 px-1 sm:px-0">
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black font-headline tracking-tighter text-white">TimeSnap</h1>
          <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Dashboard Pro</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-2xl flex items-center gap-2">
          <CalendarDays className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-black text-white">{new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center">
        {!activeSession ? (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-primary uppercase">{isHoliday ? `Ngày Lễ` : new Date().getDay() === 0 ? `Chủ Nhật` : `Ngày Thường`}</p>
            </div>
            <Button onClick={() => handleAction('in')} disabled={isProcessing} className="w-full rounded-[2rem] h-20 sm:h-24 text-xl sm:text-2xl font-black shadow-2xl gap-3 bg-primary hover:bg-primary/90 text-black">
              {isProcessing ? "ĐANG XỬ LÝ..." : <><PlayCircle className="w-8 h-8" /> VÀO CA</>}
            </Button>
          </div>
        ) : (
          <Card className="w-full border-zinc-800 shadow-2xl bg-zinc-950 rounded-[2rem] border-2">
            <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black uppercase text-green-500">LIVE</span></div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-black">x{activeSession.multiplier.toFixed(1)}</span>
            </div>
            <div className="p-6 text-center space-y-6">
              <div className="text-5xl sm:text-7xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">{elapsedTime}</div>
              <Button onClick={() => handleAction('out')} disabled={isProcessing} variant="destructive" className="w-full h-16 rounded-[2rem] text-xl font-black">
                {isProcessing ? "ĐANG GHI NHẬN..." : <><LogOut className="w-6 h-6 mr-2" /> RA CA</>}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 rounded-[2rem] border-zinc-800 p-5">
          <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">TỔNG GIỜ CÔNG THÁNG</p>
          <div className="text-3xl font-black text-white">{analyticsData.totalMonthHours}h</div>
        </Card>
        <Card className="bg-zinc-900 rounded-[2rem] border-zinc-800 p-5">
          <p className="text-[9px] uppercase font-black text-green-500 tracking-widest">NGÀY CÔNG (≥8h)</p>
          <div className="text-3xl font-black text-green-500">{analyticsData.standardDaysCount} ngày</div>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900 rounded-[2rem] overflow-hidden">
        <CardContent className="p-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.chartData}>
                <XAxis dataKey="date" hide />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-black opacity-80 text-black">THỰC LĨNH DỰ KIẾN (Tạm tính)</p>
            <p className="text-3xl font-black tracking-tighter text-black">{formatCurrency(salaryInfo.netSalary)}</p>
          </div>
          <Dialog open={isSalaryDetailOpen} onOpenChange={setIsSalaryDetailOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsSalaryDetailOpen(true)} size="icon" variant="secondary" className="rounded-2xl h-12 w-12 bg-black/20 hover:bg-black/30 border-none shadow-lg">
                <Calculator className="w-6 h-6 text-black" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-w-md w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-primary">Chi tiết lương dự kiến</DialogTitle>
                <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase">Phân tích các khoản thu nhập và khấu trừ</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" /> Các khoản thu nhập (+)
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Lương cơ bản (HĐ)</span>
                      <span className="font-bold">{formatCurrency(settings.baseMonthlySalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Lương OT (Theo phiên)</span>
                      <span className="font-bold text-green-500">{formatCurrency(salaryInfo.sessionSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Phụ cấp cơm</span>
                      <span className="font-bold">{formatCurrency(salaryInfo.lunchAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Tiền chuyên cần</span>
                      <span className="font-bold">{formatCurrency(salaryInfo.attendanceBonus)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Phụ cấp khác</span>
                      <span className="font-bold">{formatCurrency(otherAllowancesTotal)}</span>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="flex justify-between items-center text-sm font-black pt-1">
                      <span>TỔNG THU NHẬP (GROSS)</span>
                      <span className="text-primary">{formatCurrency(salaryInfo.grossIncome)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-red-500 flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4" /> Các khoản khấu trừ (-)
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Bảo hiểm ({settings.insuranceRate}%)</span>
                      <span className="font-bold text-red-500">-{formatCurrency(salaryInfo.insuranceAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Đoàn phí</span>
                      <span className="font-bold text-red-500">-{formatCurrency(settings.unionFee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Thuế TNCN (Tạm tính)</span>
                      <span className="font-bold text-red-500">-{formatCurrency(salaryInfo.incomeTaxAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-primary">THỰC LĨNH (NET)</span>
                    <span className="text-2xl font-black text-primary">{formatCurrency(salaryInfo.netSalary)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      </Card>
    </div>
  );
}
