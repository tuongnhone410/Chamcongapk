
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, TrendingUp, Wallet, Calculator, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Home() {
  const { 
    activeSession, 
    sessions, 
    settings, 
    punchIn, 
    punchOut, 
    isLoaded,
    calculateFullSalary
  } = useAttendance();

  if (!isLoaded) return null;

  const now = new Date();
  
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
    return `${(val || 0).toLocaleString('vi-VN')}${settings.currency}`;
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">TimeSnap</h1>
          <p className="text-muted-foreground text-sm">Chấm công chuyên nghiệp</p>
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center py-4 gap-6">
        <div className="flex flex-wrap justify-center gap-3">
          {!activeSession ? (
            <>
              <Button onClick={() => punchIn(1.0)} className="rounded-full px-6 shadow-sm">Ngày thường</Button>
              <Button onClick={() => punchIn(settings.sundayMultiplier)} variant="outline" className="rounded-full px-6 shadow-sm">Chủ Nhật</Button>
              <Button onClick={() => punchIn(settings.holidayMultiplier)} variant="secondary" className="rounded-full px-6 shadow-sm">Ngày Lễ</Button>
            </>
          ) : (
            <Button 
              onClick={punchOut} 
              variant="destructive" 
              className="w-40 h-40 rounded-full border-8 border-background shadow-xl flex flex-col gap-2 animate-pulse"
            >
              <LogOut className="w-8 h-8" />
              <span className="font-bold">KẾT THÚC</span>
              <span className="text-[10px] opacity-70">Hệ số x{activeSession.multiplier}</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-primary text-primary-foreground">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold opacity-70">Thực lĩnh dự kiến kỳ này</p>
              <p className="text-3xl font-black">{formatCurrency(salaryInfo.netSalary)}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Calculator className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 shadow-2xl border-none">
                <div className="space-y-2">
                  <h4 className="font-bold border-b pb-1 text-primary">Chi tiết bảng tính lương</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lương cơ bản (Tháng):</span> 
                    <span className="font-medium">{formatCurrency(settings.baseMonthlySalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lương tăng ca (Giờ):</span> 
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
                  <div className="border-t pt-1 flex justify-between text-sm font-bold">
                    <span>Tổng thu nhập (Gross):</span>
                    <span>{formatCurrency(salaryInfo.grossIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-destructive font-medium items-center gap-1">
                    <div className="flex items-center gap-1">
                      <span>Bảo hiểm ({settings.insuranceRate}%):</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">BHXH (8%) + BHYT (1.5%) + BHTN (1%)</p>
                            <p className="text-xs font-bold mt-1">Tính trên mức: {formatCurrency(settings.insuranceSalary)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span>-{formatCurrency(salaryInfo.insuranceAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-destructive font-medium">
                    <span>Đoàn phí & Thuế:</span> 
                    <span>-{formatCurrency((settings.unionFee || 0) + (settings.incomeTax || 0))}</span>
                  </div>
                  <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-lg text-primary">
                    <span>THỰC LĨNH:</span> 
                    <span>{formatCurrency(salaryInfo.netSalary)}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold">
              <span>Tiến độ mục tiêu ({formatCurrency(settings.monthlyTarget)})</span>
              <span>{targetPercent}%</span>
            </div>
            <Progress value={targetPercent} className="h-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-3 h-3 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Lương cơ bản</p>
            </div>
            <p className="text-sm font-black">{formatCurrency(settings.baseMonthlySalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Lương OT / Giờ</p>
            </div>
            <p className="text-sm font-black">{formatCurrency(settings.hourlyRate)}/h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
