
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, 
  TrendingUp, 
  Wallet, 
  Calculator, 
  Info, 
  CalendarCheck, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle,
  Award
} from 'lucide-react';
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
    updateSettings,
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
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
          Kỳ: {startDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - {endDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
        </div>
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center py-2 gap-6">
        <div className="flex flex-wrap justify-center gap-3">
          {!activeSession ? (
            <>
              <Button onClick={() => punchIn(1.0)} className="rounded-full px-6 shadow-sm h-12 text-base font-bold">Ngày thường</Button>
              <Button onClick={() => punchIn(settings.sundayMultiplier)} variant="outline" className="rounded-full px-6 shadow-sm h-12 text-base font-bold border-2">Chủ Nhật</Button>
              <Button onClick={() => punchIn(settings.holidayMultiplier)} variant="secondary" className="rounded-full px-6 shadow-sm h-12 text-base font-bold">Ngày Lễ</Button>
            </>
          ) : (
            <Button 
              onClick={punchOut} 
              variant="destructive" 
              className="w-44 h-44 rounded-full border-8 border-background shadow-2xl flex flex-col gap-2 animate-pulse"
            >
              <LogOut className="w-10 h-10" />
              <span className="font-black text-xl">KẾT THÚC</span>
              <span className="text-xs opacity-80 bg-black/20 px-2 py-0.5 rounded-full">Hệ số x{activeSession.multiplier}</span>
            </Button>
          )}
        </div>
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
              <span>Phép Năm</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-green-600">{settings.annualLeaveBalance}</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 rounded-full border-green-200"
                  onClick={() => updateSettings({...settings, annualLeaveBalance: Math.max(0, settings.annualLeaveBalance - 1)})}
                >
                  <MinusCircle className="w-4 h-4 text-green-600" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 rounded-full border-green-200"
                  onClick={() => updateSettings({...settings, annualLeaveBalance: settings.annualLeaveBalance + 1})}
                >
                  <PlusCircle className="w-4 h-4 text-green-600" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic leading-tight">Mỗi tháng làm việc đủ sẽ được tích lũy 1 ngày phép.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-l-orange-500 overflow-hidden">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>Nghỉ K.Phép</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-orange-600">{settings.unexcusedAbsences}</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 rounded-full border-orange-200"
                  onClick={() => updateSettings({...settings, unexcusedAbsences: Math.max(0, settings.unexcusedAbsences - 1)})}
                >
                  <MinusCircle className="w-4 h-4 text-orange-600" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 rounded-full border-orange-200"
                  onClick={() => updateSettings({...settings, unexcusedAbsences: settings.unexcusedAbsences + 1})}
                >
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className={salaryInfo.attendanceBonus > 0 ? "w-3.5 h-3.5 text-green-500" : "w-3.5 h-3.5 text-muted-foreground"} />
              <span className="text-[10px] font-bold">Chuyên cần: {formatCurrency(salaryInfo.attendanceBonus)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-muted/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-3 h-3 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Lương cơ bản</p>
            </div>
            <p className="text-sm font-black">{formatCurrency(settings.baseMonthlySalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/40">
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
