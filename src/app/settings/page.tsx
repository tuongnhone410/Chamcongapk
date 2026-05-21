
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Calculator, Skull, TrendingUp, AlertTriangle, CalendarCheck, PlusCircle, MinusCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatMoneyDisplay = (val: number) => {
    if (val === 0) return "";
    return val.toLocaleString('vi-VN') + " đ";
  };

  const formatPercentDisplay = (val: number) => {
    if (val === 0) return "";
    return val.toString() + " %";
  };

  const handleMoneyInput = (key: keyof AppSettings, val: string) => {
    const numericValue = val.replace(/\D/g, "");
    const num = numericValue === "" ? 0 : parseInt(numericValue);
    
    if (key === 'baseMonthlySalary') {
      const calculatedHourly = Math.round(num / 208);
      updateSettings({
        ...settings,
        baseMonthlySalary: num,
        hourlyRate: calculatedHourly,
        insuranceSalary: settings.insuranceSalary || num 
      });
    } else {
      updateSettings({
        ...settings,
        [key]: num
      });
    }
  };

  const handlePercentInput = (key: keyof AppSettings, val: string) => {
    const numericValue = val.replace(/[^0-9.]/g, "");
    const num = numericValue === "" ? 0 : parseFloat(numericValue);
    updateSettings({
      ...settings,
      [key]: num
    });
  };

  const handleNumberInput = (key: keyof AppSettings, val: string) => {
    updateSettings({
      ...settings,
      [key]: val === "" ? 0 : parseFloat(val)
    });
  };

  const getNumberValue = (val: number) => (val === 0 ? "" : val.toString());

  const calculatedInsuranceMoney = Math.round((settings.insuranceSalary * settings.insuranceRate) / 100);

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
              value={getNumberValue(settings.annualLeaveBalance)}
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
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.baseMonthlySalary)}
                onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)}
                placeholder="Ví dụ: 5.730.000 đ"
                className="pr-10 font-medium"
              />
              <Calculator className="absolute right-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương / Giờ (OT)</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.hourlyRate)}
                onChange={(e) => handleMoneyInput('hourlyRate', e.target.value)}
                className="font-medium"
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
            <span>Bảo Hiểm & Thuế</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-primary font-bold">Mức lương đóng BH (SI Wage)</Label>
            <Input 
              type="text" 
              inputMode="numeric"
              placeholder="Ví dụ: 6.017.000 đ"
              value={formatMoneyDisplay(settings.insuranceSalary)} 
              onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)} 
              className="font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tỷ lệ đóng Bảo hiểm</Label>
              <Input 
                type="text" 
                inputMode="decimal"
                value={formatPercentDisplay(settings.insuranceRate)} 
                onChange={(e) => handlePercentInput('insuranceRate', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-bold">Tiền BH phải đóng (10.5%)</Label>
              <div className="h-10 flex items-center px-3 bg-muted/50 rounded-md border font-bold text-primary">
                {formatMoneyDisplay(calculatedInsuranceMoney)}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <div className="space-y-2 max-w-[50%]">
              <Label className="text-destructive font-bold">Tỷ lệ Thuế TNCN (%)</Label>
              <Input 
                type="text" 
                inputMode="decimal"
                placeholder="Ví dụ: 5 %"
                value={formatPercentDisplay(settings.incomeTaxRate)} 
                onChange={(e) => handlePercentInput('incomeTaxRate', e.target.value)} 
                className="font-medium border-destructive/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đoàn phí (Cố định)</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.unionFee)} 
                onChange={(e) => handleMoneyInput('unionFee', e.target.value)} 
                className="font-medium"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            * Thuế TNCN sẽ tự động tính dựa trên % bạn nhập nhân với tổng thu nhập (Gross).
          </p>
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
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceAttendanceBase)} 
                onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive font-bold">Số ngày nghỉ K.Phép</Label>
              <Input 
                type="number" 
                placeholder="0"
                className="border-destructive/50 focus-visible:ring-destructive"
                value={getNumberValue(settings.unexcusedAbsences)} 
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
                type="text" 
                inputMode="numeric"
                placeholder="2.300.000 - 3.000.000 đ"
                value={formatMoneyDisplay(settings.allowanceProduct)} 
                onChange={(e) => handleMoneyInput('allowanceProduct', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label>Tiền cơm/ca</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceLunchPerShift)} 
                onChange={(e) => handleMoneyInput('allowanceLunchPerShift', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label>Cơm thêm (OT &ge; 2h)</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceLunchOT)} 
                onChange={(e) => handleMoneyInput('allowanceLunchOT', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label>Nhà ở</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceHousing)} 
                onChange={(e) => handleMoneyInput('allowanceHousing', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-orange-600 font-bold">
                <Skull className="w-3 h-3" /> Độc hại
              </Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceToxic)} 
                onChange={(e) => handleMoneyInput('allowanceToxic', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-green-600 font-bold">
                <TrendingUp className="w-3 h-3" /> Doanh thu
              </Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceBonus)} 
                onChange={(e) => handleMoneyInput('allowanceBonus', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label>Xăng xe</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceFuel)} 
                onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} 
                className="font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
