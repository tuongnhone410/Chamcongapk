
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  LogOut, 
  TrendingUp, 
  Wallet, 
  Calculator, 
  CalendarCheck, 
  AlertTriangle, 
  Award,
  Zap,
  Clock,
  Timer,
  PlayCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { AppSettings } from '@/lib/types';
import { useState, useEffect } from 'react';

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
    getAutoMultiplier,
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

  if (!isLoaded) return null;

  const now = new Date();
  const autoMultiplier = getAutoMultiplier(now);
  
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

  const salaryInfo = calculateFullSalary(periodSessions);
  const targetPercent = Math.min(Math.round((salaryInfo.netSalary / (settings.monthlyTarget || 1)) * 100), 100);

  const formatCurrency = (val: number) => {
    return `${Math.round(val || 0).toLocaleString('vi-VN')}${settings.currency}`;
  };

  const handleNumberInput = (key: keyof AppSettings, val: string) => {
    const num = val === "" ? 0 : parseFloat(val);
    updateSettings({
      ...settings,
      [key]: num
    });
  };

  const getNumberValue = (val: number) => val === 0 ? "" : val.toString();

  const getAbsenceColorClasses = (count: number) => {
    if (count === 0) return { text: "text-green-600", border: "border-l-green-500", icon: "text-green-500", bg: "bg-green-50" };
    if (count === 1) return { text: "text-orange-600", border: "border-l-orange-500", icon: "text-orange-500", bg: "bg-orange-50" };
    return { text: "text-red-600", border: "border-l-red-600", icon: "text-red-600", bg: "bg-red-50" };
  };

  const absenceColors = getAbsenceColorClasses(settings.unexcusedAbsences);

  const calculateCurrentSessionSalary = () => {
    if (!activeSession) return 0;
    if (activeSession.multiplier !== 1.0) {
      return (sessionMinutes / 60) * settings.hourlyRate * activeSession.multiplier;
    } else {
      if (sessionMinutes <= 510) return 0; 
      return ((sessionMinutes - 480) / 60) * settings.hourlyRate * settings.overtimeMultiplier;
    }
  };

  const currentSalary = calculateCurrentSessionSalary();
  const isOvertime = sessionMinutes > 480;

  const getDayTypeName = () => {
    if (isHoliday) return "Ngày Lễ (x3.0)";
    if (now.getDay() === 0) return "Chủ Nhật (x2.0)";
    return "Ngày Thường (x1.0)";
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">TimeSnap</h1>
          <p className="text-muted-foreground text-sm">Chấm công chuyên nghiệp</p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
          Kỳ: {startDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - {endDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center py-2">
        {!activeSession ? (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hệ thống ghi nhận</p>
              <p className="text-lg font-black text-primary uppercase">{getDayTypeName()}</p>
            </div>
            <Button 
              onClick={() => punchIn()} 
              className="w-full rounded-2xl h-20 text-xl font-black shadow-xl gap-3 group bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <PlayCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
              BẮT ĐẦU VÀO CA
            </Button>
            <p className="text-[10px] text-center text-muted-foreground italic px-8">
              Hệ thống tự động tính lương theo lịch làm việc thực tế.
            </p>
          </div>
        ) : (
          <Card className="w-full border-2 border-zinc-800 shadow-2xl overflow-hidden bg-zinc-950 text-white">
            <CardContent className="p-0">
              <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-green-500">Đang trong ca làm</span>
                </div>
                <div className="text-[10px] bg-primary/20 text-primary-foreground px-2 py-0.5 rounded font-bold border border-primary/30">
                  Hệ số x{activeSession.multiplier}
                </div>
              </div>
              
              <div className="p-6 text-center space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Thời gian làm việc</p>
                  <div className="text-5xl font-black text-white font-mono tracking-tighter">
                    {elapsedTime}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {activeSession.multiplier === 1.0 ? (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        isOvertime ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      )}>
                        {isOvertime ? "TRẠNG THÁI: TĂNG CA (OT)" : "TRẠNG THÁI: GIỜ HÀNH CHÍNH"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        TRẠNG THÁI: TĂNG CA ĐẶC BIỆT
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-zinc-800 py-4">
                  <div className="text-left border-r border-zinc-800 pr-4">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Bắt đầu lúc</p>
                    <p className="text-sm font-bold text-zinc-200">{new Date(activeSession.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Lương OT tạm tính</p>
                    <p className="text-sm font-black text-green-400">+{formatCurrency(currentSalary)}</p>
                  </div>
                </div>

                <Button 
                  onClick={punchOut} 
                  variant="destructive" 
                  className="w-full h-16 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg font-black group"
                >
                  <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  KẾT THÚC CA LÀM
                </Button>
                <p className="text-[9px] text-zinc-500 italic">Nhấn kết thúc để lưu dữ liệu vào nhật ký chấm công</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-none shadow-lg overflow-hidden bg-primary text-primary-foreground">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold opacity-70 tracking-wider">Thực lĩnh dự kiến kỳ này</p>
              <p className="text-4xl font-black mt-1 tracking-tighter">{formatCurrency(salaryInfo.netSalary)}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12">
                  <Calculator className="w-6 h-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 shadow-2xl border-none p-4">
                <div className="space-y-3">
                  <h4 className="font-bold border-b pb-2 text-primary flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Chi tiết bảng tính lương
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lương cơ bản (Tháng):</span> 
                      <span className="font-medium">{formatCurrency(settings.baseMonthlySalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-bold">Tiền sản phẩm:</span> 
                      <span className="font-medium text-green-600">+{formatCurrency(salaryInfo.productSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lương tăng ca (OT):</span> 
                      <span className="font-medium text-green-600">+{formatCurrency(salaryInfo.sessionSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền cơm ({periodSessions.length} ca):</span> 
                      <span className="font-medium text-green-600">+{formatCurrency(salaryInfo.lunchAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chuyên cần (-{settings.unexcusedAbsences} ngày):</span> 
                      <span className="font-medium text-green-600">+{formatCurrency(salaryInfo.attendanceBonus)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phụ cấp khác:</span> 
                      <span className="font-medium text-green-600">+{formatCurrency(salaryInfo.otherAllowances)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-bold">
                      <span>Tổng thu nhập (Gross):</span>
                      <span>{formatCurrency(salaryInfo.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive font-medium">
                      <span>Bảo hiểm (10.5%):</span>
                      <span>-{formatCurrency(salaryInfo.insuranceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive font-medium">
                      <span>Thuế TNCN ({settings.incomeTaxRate}%):</span>
                      <span>-{formatCurrency(salaryInfo.incomeTaxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive font-medium">
                      <span>Đoàn phí:</span> 
                      <span>-{formatCurrency(settings.unionFee || 0)}</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-xl text-primary">
                    <span>THỰC LĨNH:</span> 
                    <span>{formatCurrency(salaryInfo.netSalary)}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold">
              <span>Mục tiêu: {formatCurrency(settings.monthlyTarget)}</span>
              <span>{targetPercent}%</span>
            </div>
            <Progress value={targetPercent} className="h-2.5 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm border-l-4 border-l-green-500 overflow-hidden">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-green-500" />
              <span>Phép Năm Còn Lại</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <Input 
              type="number"
              placeholder="0"
              className="h-10 font-black text-xl text-green-600 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none"
              value={getNumberValue(settings.annualLeaveBalance)}
              onChange={(e) => handleNumberInput('annualLeaveBalance', e.target.value)}
            />
            <p className="text-[9px] text-muted-foreground italic leading-tight mt-1">Nghỉ không mất lương & chuyên cần.</p>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-sm border-l-4 overflow-hidden transition-all duration-300", absenceColors.border)}>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <AlertTriangle className={cn("w-4 h-4", absenceColors.icon)} />
              <span>Số Ngày Nghỉ K.Phép</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <Input 
              type="number"
              placeholder="0"
              className={cn("h-10 font-black text-xl border-none bg-transparent focus-visible:ring-0 p-0 shadow-none", absenceColors.text)}
              value={getNumberValue(settings.unexcusedAbsences)}
              onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)}
            />
            <div className="flex items-center gap-1 mt-1">
              <Award className={cn("w-3 h-3", salaryInfo.attendanceBonus > 0 ? "text-green-500" : "text-muted-foreground")} />
              <span className="text-[9px] font-bold">Thưởng chuyên cần: {formatCurrency(salaryInfo.attendanceBonus)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-muted/40">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase font-bold leading-none">Lương tháng</p>
            </div>
            <p className="text-xs font-black truncate">{formatCurrency(settings.baseMonthlySalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/40">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase font-bold leading-none">Tăng ca / 1h</p>
            </div>
            <p className="text-xs font-black truncate">{formatCurrency(settings.hourlyRate)}/h</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/40">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase font-bold leading-none">OT (x1.5)</p>
            </div>
            <p className="text-xs font-black truncate">{formatCurrency(Math.round(settings.hourlyRate * 1.5))}/h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
