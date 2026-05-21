
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  LogOut, 
  Wallet, 
  Calculator, 
  CalendarCheck, 
  AlertTriangle, 
  Award,
  Zap,
  Clock,
  Timer,
  PlayCircle,
  BarChart3,
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from '@/lib/utils';
import { AppSettings } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';

const chartConfig = {
  salary: {
    label: "Thu nhập",
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
    updateSettings,
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

  const periodData = useMemo(() => {
    if (!isLoaded) return null;

    const now = new Date();
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

    const periodSessions = sessions.filter(s => {
      const checkIn = new Date(s.checkIn);
      return checkIn >= startDate && checkIn <= endDate;
    });

    // Group sessions by day for the chart
    const dailyData: Record<string, number> = {};
    periodSessions.forEach(s => {
      const dateKey = new Date(s.checkIn).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dailyData[dateKey] = (dailyData[dateKey] || 0) + s.salary;
    });

    const chartData = Object.entries(dailyData)
      .map(([date, salary]) => ({ date, salary }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA !== monthB ? monthA - monthB : dayA - dayB;
      });

    return { startDate, endDate, periodSessions, chartData };
  }, [sessions, settings.payday, isLoaded]);

  const salaryInfo = useMemo(() => {
    if (!periodData) return null;
    return calculateFullSalary(periodData.periodSessions);
  }, [periodData, calculateFullSalary]);

  if (!isLoaded || !periodData || !salaryInfo) return null;

  const targetPercent = Math.min(Math.round((salaryInfo.netSalary / (settings.monthlyTarget || 1)) * 100), 100);

  const formatCurrency = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('vi-VN')}₫`;
  };

  const currentSalary = (() => {
    if (!activeSession) return 0;
    if (activeSession.multiplier !== 1.0) {
      return (sessionMinutes / 60) * settings.hourlyRate * activeSession.multiplier;
    } else {
      if (sessionMinutes <= 510) return 0; 
      return ((sessionMinutes - 480) / 60) * settings.hourlyRate * settings.overtimeMultiplier;
    }
  })();

  const isOvertime = sessionMinutes > 480;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black font-headline tracking-tighter">TimeSnap</h1>
          <p className="text-zinc-500 text-xs font-medium">Chấm công chuyên nghiệp</p>
        </div>
        <div className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black border border-primary/30 uppercase tracking-wider">
          Kỳ: {periodData.startDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - {periodData.endDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center">
        {!activeSession ? (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hệ thống sẵn sàng</span>
              </div>
              <p className="text-base font-black text-primary uppercase mt-2">
                {isHoliday ? "Ngày Lễ (x3.0)" : new Date().getDay() === 0 ? "Chủ Nhật (x2.0)" : "Ngày Thường (Tự động OT x1.5)"}
              </p>
            </div>
            <Button 
              onClick={() => punchIn()} 
              className="w-full rounded-2xl h-24 text-2xl font-black shadow-2xl gap-3 group bg-primary hover:bg-primary/90 transition-all active:scale-95 border-b-4 border-primary-foreground/20"
            >
              <PlayCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
              VÀO CA
            </Button>
          </div>
        ) : (
          <Card className="w-full border-zinc-800 shadow-2xl overflow-hidden bg-zinc-950 rounded-[2rem] border-2">
            <CardContent className="p-0">
              <div className="bg-zinc-900/50 p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest text-green-500">ĐANG TRONG CA LÀM</span>
                </div>
                <div className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md font-black border border-zinc-700">
                  Hệ số x{activeSession.multiplier.toFixed(1)}
                </div>
              </div>
              
              <div className="p-8 text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">THỜI GIAN LÀM VIỆC</p>
                  <div className="text-6xl font-black text-white font-mono tracking-tighter leading-none">
                    {elapsedTime}
                  </div>
                  <div className="pt-2">
                    <span className={cn(
                      "text-[10px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest",
                      isOvertime ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {isOvertime ? "TRẠNG THÁI: TĂNG CA (OT)" : "TRẠNG THÁI: GIỜ HÀNH CHÍNH"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-zinc-900 py-6">
                  <div className="text-left border-r border-zinc-900 pr-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mb-1">BẮT ĐẦU LÚC</p>
                    <p className="text-xl font-black text-white">{new Date(activeSession.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right pl-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mb-1">LƯƠNG OT TẠM TÍNH</p>
                    <p className="text-xl font-black text-green-500">+{formatCurrency(currentSalary)}</p>
                  </div>
                </div>

                <Button 
                  onClick={punchOut} 
                  variant="destructive" 
                  className="w-full h-20 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-xl font-black group border-b-4 border-black/20"
                >
                  <LogOut className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  KẾT THÚC CA LÀM
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-primary text-primary-foreground rounded-[2rem] card-shadow">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black opacity-80 tracking-[0.15em]">THỰC LĨNH DỰ KIẾN KỲ NÀY</p>
              <p className="text-5xl font-black tracking-tighter">{formatCurrency(salaryInfo.netSalary)}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12 rounded-xl">
                  <Calculator className="w-7 h-7" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 shadow-2xl border-none p-5 rounded-3xl bg-zinc-900 text-white">
                <div className="space-y-4">
                  <h4 className="font-black border-b border-zinc-800 pb-3 text-primary flex items-center gap-2 text-lg uppercase tracking-tight">
                    <Calculator className="w-5 h-5" />
                    BẢNG TÍNH LƯƠNG
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Lương cơ bản (Tháng):</span> 
                      <span className="text-white">{formatCurrency(settings.baseMonthlySalary)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Lương tăng ca (OT):</span> 
                      <span className="text-green-500">+{formatCurrency(salaryInfo.sessionSalary)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Tiền cơm & Phụ cấp:</span> 
                      <span className="text-green-500">+{formatCurrency(salaryInfo.lunchAllowance + salaryInfo.otherAllowances)}</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2.5 flex justify-between text-sm font-black">
                      <span className="text-zinc-300">Tổng thu nhập:</span>
                      <span className="text-primary">{formatCurrency(salaryInfo.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-red-500">
                      <span>Khấu trừ (BH+Thuế+Đoàn):</span>
                      <span>-{formatCurrency(salaryInfo.insuranceAmount + salaryInfo.incomeTaxAmount + (settings.unionFee || 0))}</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-dashed border-zinc-700 pt-3 flex justify-between font-black text-2xl text-white">
                    <span>CÒN LẠI:</span> 
                    <span className="text-primary">{formatCurrency(salaryInfo.netSalary)}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
              <span>MỤC TIÊU: {formatCurrency(settings.monthlyTarget)}</span>
              <span>{targetPercent}%</span>
            </div>
            <Progress value={targetPercent} className="h-3 bg-white/20 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Biểu đồ xu hướng thu nhập */}
      <Card className="border-zinc-800 bg-zinc-900 shadow-xl rounded-[2rem] overflow-hidden border">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-zinc-400">
            <BarChart3 className="w-4 h-4 text-primary" />
            Biểu đồ thu nhập OT hàng ngày
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2 h-[200px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodData.chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar 
                  dataKey="salary" 
                  fill="var(--color-salary)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          {periodData.chartData.length === 0 && (
            <div className="flex items-center justify-center h-full -mt-4">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Chưa có dữ liệu cho kỳ này</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-xl bg-zinc-900 rounded-[1.5rem] overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-500">
              <CalendarCheck className="w-4 h-4 text-green-500" />
              Phép Năm Còn Lại
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{settings.annualLeaveBalance || 0}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Ngày</span>
            </div>
            <p className="text-[9px] text-zinc-600 font-medium mt-1">Nghỉ không mất lương & chuyên cần</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-zinc-900 rounded-[1.5rem] overflow-hidden border-l-4 border-l-orange-500">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-500">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Số Ngày Nghỉ K.Phép
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{settings.unexcusedAbsences || 0}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Ngày</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Award className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[9px] font-bold text-green-500">Thưởng: {formatCurrency(salaryInfo.attendanceBonus)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-md bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-zinc-500" />
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tight">LƯƠNG THÁNG</p>
            </div>
            <p className="text-xs font-black text-white">{formatCurrency(settings.baseMonthlySalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tight">TĂNG CA / 1H</p>
            </div>
            <p className="text-xs font-black text-white">{formatCurrency(settings.hourlyRate)}/h</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-primary uppercase font-black tracking-tight">OT (X1.5)</p>
            </div>
            <p className="text-xs font-black text-primary">{formatCurrency(Math.round(settings.hourlyRate * 1.5))}/h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
