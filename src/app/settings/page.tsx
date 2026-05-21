
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Calculator, Skull, TrendingUp, AlertTriangle, CalendarCheck, PlusCircle, MinusCircle, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

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

  const getNumberValue = (val: number) => val === 0 ? "" : val.toString();

  const calculatedInsuranceMoney = Math.round((settings.insuranceSalary * settings.insuranceRate) / 100);

  // Logic màu sắc cho nghỉ không phép
  const getAbsenceColorClasses = (count: number) => {
    if (count === 0) return { text: "text-green-600", border: "border-l-green-500", input: "border-green-200 focus-visible:ring-green-500", bg: "bg-green-50" };
    if (count === 1) return { text: "text-orange-600", border: "border-l-orange-500", input: "border-orange-200 focus-visible:ring-orange-500", bg: "bg-orange-50" };
    return { text: "text-red-600", border: "border-l-red-600", input: "border-red-200 focus-visible:ring-red-500", bg: "bg-red-50" };
  };

  const absenceColors = getAbsenceColorClasses(settings.unexcusedAbsences);

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
            <span>Quản Lý Phép Năm</span>
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
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold text-green-700">Chỉnh sửa trực tiếp số dư phép năm</Label>
            <Input 
              type="number" 
              className="h-10 border-green-200 focus-visible:ring-green-500 font-bold"
              placeholder="0"
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
                placeholder="0 đ"
                className="pr-10 font-medium"
              />
              <Calculator className="absolute right-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương / Giờ (OT gốc)</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                placeholder="0 đ"
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

          <div className="pt-4 border-t">
            <Label className="text-xs text-muted-foreground mb-3 block font-bold uppercase tracking-wider">Hệ số nhân lương</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Tăng ca (OT)
                </Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="0"
                  value={getNumberValue(settings.overtimeMultiplier)}
                  onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Chủ Nhật</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="0"
                  value={getNumberValue(settings.sundayMultiplier)}
                  onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày Lễ</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="0"
                  value={getNumberValue(settings.holidayMultiplier)}
                  onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)}
                />
              </div>
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
              placeholder="0 đ"
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
                placeholder="0 %"
                value={formatPercentDisplay(settings.insuranceRate)} 
                onChange={(e) => handlePercentInput('insuranceRate', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-bold">Tiền BH phải đóng (10.5%)</Label>
              <div className="h-10 flex items-center px-3 bg-muted/50 rounded-md border font-bold text-primary">
                {calculatedInsuranceMoney.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <div className="space-y-2 max-w-[50%]">
              <Label className="text-destructive font-bold">Tỷ lệ Thuế TNCN (%)</Label>
              <Input 
                type="text" 
                inputMode="decimal"
                placeholder="0 %"
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
                placeholder="0 đ"
                value={formatMoneyDisplay(settings.unionFee)} 
                onChange={(e) => handleMoneyInput('unionFee', e.target.value)} 
                className="font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-none shadow-sm border-l-4 transition-all duration-300", absenceColors.border)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertTriangle className={cn("w-5 h-5", absenceColors.text)} />
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
                placeholder="0 đ"
                value={formatMoneyDisplay(settings.allowanceAttendanceBase)} 
                onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} 
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className={cn("font-bold transition-colors", absenceColors.text)}>Số ngày nghỉ K.Phép</Label>
              <Input 
                type="number" 
                placeholder="0"
                className={cn("h-10 font-bold border-2 transition-all", absenceColors.input)}
                value={getNumberValue(settings.unexcusedAbsences)} 
                onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)} 
              />
            </div>
          </div>
          <div className={cn("text-[10px] p-2 rounded italic border", absenceColors.bg, absenceColors.input)}>
            <p className="font-bold mb-1">Quy tắc cảnh báo:</p>
            <ul className="list-disc pl-3">
              <li className={settings.unexcusedAbsences === 0 ? "font-bold text-green-700" : ""}>0 ngày: An toàn (Màu xanh)</li>
              <li className={settings.unexcusedAbsences === 1 ? "font-bold text-orange-700" : ""}>1 ngày: Trừ 200k (Màu vàng cam)</li>
              <li className={settings.unexcusedAbsences >= 2 ? "font-bold text-red-700" : ""}>&ge; 2 ngày: Mất hết chuyên cần (Màu đỏ)</li>
            </ul>
          </div>
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
                placeholder="0 đ"
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
