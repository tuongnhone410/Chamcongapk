
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Calculator, Skull, TrendingUp, AlertTriangle, CalendarCheck, PlusCircle, MinusCircle, Package } from 'lucide-react';
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

      <Card className="border-none shadow-sm border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-green-500" />
            <span>Quản Lý Phép Năm (Tích Lũy)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Số ngày phép hiện có</p>
                <p className="text-3xl font-black text-green-600">{settings.annualLeaveBalance} <span className="text-sm font-normal">ngày</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="h-9 bg-green-600 hover:bg-green-700 gap-2 shadow-sm"
                  onClick={() => updateSettings({...settings, annualLeaveBalance: settings.annualLeaveBalance + 1})}
                >
                  <PlusCircle className="w-4 h-4" />
                  Tháng mới (+1)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 border-destructive text-destructive hover:bg-destructive/5 gap-2"
                  onClick={() => updateSettings({...settings, annualLeaveBalance: Math.max(0, settings.annualLeaveBalance - 1)})}
                >
                  <MinusCircle className="w-4 h-4" />
                  Đã dùng (-1)
                </Button>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded border border-green-100 dark:border-green-900/30">
              <p className="font-bold text-green-700 dark:text-green-400 mb-1 underline">Quy tắc hợp đồng:</p>
              <ul className="list-disc pl-3 space-y-0.5">
                <li>Tích lũy 1 ngày phép cho mỗi tháng làm việc.</li>
                <li>Nghỉ phép năm <strong>không mất chuyên cần</strong>.</li>
                <li>Nghỉ phép năm <strong>không bị trừ lương</strong> cơ bản.</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Điều chỉnh trực tiếp số dư</Label>
            <Input 
              type="number" 
              className="h-9"
              value={getInputValue(settings.annualLeaveBalance)}
              onChange={(e) => handleNumberInput('annualLeaveBalance', e.target.value)}
            />
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
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Package className="w-3 h-3" /> Tiền sản phẩm
              </Label>
              <Input 
                type="number" 
                placeholder="2.300.000 - 3.000.000"
                value={getInputValue(settings.allowanceProduct)} 
                onChange={(e) => handleNumberInput('allowanceProduct', e.target.value)} 
              />
            </div>
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
