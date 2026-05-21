
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Calculator, Skull, TrendingUp, AlertTriangle, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleMonthlySalaryChange = (val: string) => {
    const numVal = parseFloat(val) || 0;
    const calculatedHourly = Math.round(numVal / 208);
    
    updateSettings({
      ...settings,
      baseMonthlySalary: numVal,
      hourlyRate: calculatedHourly,
      insuranceSalary: settings.insuranceSalary || numVal 
    });
  };

  const handleNumberInput = (key: keyof typeof settings, val: string) => {
    updateSettings({
      ...settings,
      [key]: val === "" ? 0 : parseFloat(val)
    });
  };

  const getInputValue = (val: number) => (val === 0 ? "" : val.toString());

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold font-headline">Cấu Hình Lương</h1>
        <p className="text-muted-foreground text-sm">Thiết lập chi tiết dựa trên hợp đồng lao động</p>
      </header>

      {/* Quản lý phép năm */}
      <Card className="border-none shadow-sm border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-green-500" />
            <span>Quản Lý Phép Năm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Số ngày phép còn lại</p>
              <p className="text-2xl font-black text-green-600">{settings.annualLeaveBalance} ngày</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8"
                onClick={() => updateSettings({...settings, annualLeaveBalance: settings.annualLeaveBalance + 1})}
              >
                +1 ngày
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-destructive"
                onClick={() => updateSettings({...settings, annualLeaveBalance: Math.max(0, settings.annualLeaveBalance - 1)})}
              >
                Dùng 1 ngày
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Điều chỉnh trực tiếp số phép</Label>
            <Input 
              type="number" 
              value={getInputValue(settings.annualLeaveBalance)}
              onChange={(e) => handleNumberInput('annualLeaveBalance', e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Nghỉ phép năm không mất chuyên cần và không mất lương cơ bản.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Lương Cơ Bản & Hệ Số</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Lương cơ bản hàng tháng</Label>
            <div className="relative">
              <Input 
                type="number" 
                value={getInputValue(settings.baseMonthlySalary)}
                onChange={(e) => handleMonthlySalaryChange(e.target.value)}
                placeholder="Ví dụ: 5.730.000"
                className="pr-10"
              />
              <Calculator className="absolute right-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương / Giờ (OT)</Label>
              <Input 
                type="number" 
                value={getInputValue(settings.hourlyRate)}
                onChange={(e) => handleNumberInput('hourlyRate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày chốt lương</Label>
              <Select value={settings.payday.toString()} onValueChange={(val) => updateSettings({...settings, payday: parseInt(val)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Bảo Hiểm & Khấu Trừ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-primary font-bold">Mức lương đóng BH (SI Wage)</Label>
            <Input 
              type="number" 
              placeholder="Ví dụ: 6.017.000"
              value={getInputValue(settings.insuranceSalary)} 
              onChange={(e) => handleNumberInput('insuranceSalary', e.target.value)} 
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Đây là mức lương dùng để tính 10.5% bảo hiểm trong phiếu lương.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tỷ lệ đóng Bảo hiểm (BHXH, BHYT, BHTN) %</Label>
            <Input type="number" step="0.1" value={getInputValue(settings.insuranceRate)} onChange={(e) => handleNumberInput('insuranceRate', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đoàn phí</Label>
              <Input type="number" value={getInputValue(settings.unionFee)} onChange={(e) => handleNumberInput('unionFee', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Thuế TNCN</Label>
              <Input type="number" value={getInputValue(settings.incomeTax)} onChange={(e) => handleNumberInput('incomeTax', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Chuyên Cần & Nghỉ Không Phép</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiền chuyên cần gốc</Label>
              <Input type="number" value={getInputValue(settings.allowanceAttendanceBase)} onChange={(e) => handleNumberInput('allowanceAttendanceBase', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive font-bold">Số ngày nghỉ K.Phép</Label>
              <Input 
                type="number" 
                placeholder="0"
                className="border-destructive/50 focus-visible:ring-destructive"
                value={getInputValue(settings.unexcusedAbsences)} 
                onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)} 
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            * 1 ngày nghỉ K.P trừ 200k, từ 2 ngày trở lên trừ hết chuyên cần. Nghỉ phép năm sẽ không bị trừ ở đây.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Phụ Cấp & Tiền Cơm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiền cơm/ca</Label>
              <Input type="number" value={getInputValue(settings.allowanceLunchPerShift)} onChange={(e) => handleNumberInput('allowanceLunchPerShift', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cơm thêm (OT &ge; 2h)</Label>
              <Input type="number" value={getInputValue(settings.allowanceLunchOT)} onChange={(e) => handleNumberInput('allowanceLunchOT', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nhà ở</Label>
              <Input type="number" value={getInputValue(settings.allowanceHousing)} onChange={(e) => handleNumberInput('allowanceHousing', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-orange-600 font-bold">
                <Skull className="w-3 h-3" /> Độc hại
              </Label>
              <Input type="number" value={getInputValue(settings.allowanceToxic)} onChange={(e) => handleNumberInput('allowanceToxic', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-green-600 font-bold">
                <TrendingUp className="w-3 h-3" /> Doanh thu
              </Label>
              <Input type="number" value={getInputValue(settings.allowanceBonus)} onChange={(e) => handleNumberInput('allowanceBonus', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Xăng xe</Label>
              <Input type="number" value={getInputValue(settings.allowanceFuel)} onChange={(e) => handleNumberInput('allowanceFuel', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
