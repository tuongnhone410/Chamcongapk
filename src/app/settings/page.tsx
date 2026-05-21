
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Calculator, TrendingUp, AlertTriangle, CalendarCheck, Package, Zap, Skull, Briefcase, Star, Award, Shield } from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatMoneyDisplay = (val: number) => {
    if (val === 0) return "0";
    return Math.round(val).toLocaleString('vi-VN');
  };

  const formatPercentDisplay = (val: number) => {
    if (val === 0) return "0";
    return val.toString();
  };

  const handleMoneyInput = (key: keyof AppSettings, val: string) => {
    const numericValue = val.replace(/\D/g, "");
    const num = numericValue === "" ? 0 : parseInt(numericValue);
    
    if (key === 'baseMonthlySalary') {
      // Tự động tính lương giờ gốc khi nhập LCB (chia 208 giờ chuẩn)
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

  const calculatedInsuranceMoney = Math.round(((settings.insuranceSalary || 0) * (settings.insuranceRate || 0)) / 100);

  const getAbsenceColorClasses = (count: number) => {
    if (count === 0) return { text: "text-green-600", border: "border-l-green-500", input: "border-green-200 focus-visible:ring-green-500", bg: "bg-green-50" };
    if (count === 1) return { text: "text-orange-600", border: "border-l-orange-500", input: "border-orange-200 focus-visible:ring-orange-500", bg: "bg-orange-50" };
    return { text: "text-red-600", border: "border-l-red-600", input: "border-red-200 focus-visible:ring-red-500", bg: "bg-red-50" };
  };

  const absenceColors = getAbsenceColorClasses(settings.unexcusedAbsences);

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold font-headline">Thông tin lương</h1>
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
            <Label className="text-primary font-bold">Lương cơ bản hàng tháng (LCB)</Label>
            <div className="relative">
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.baseMonthlySalary)}
                onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)}
                placeholder="0"
                className="pr-10 font-black text-lg h-12"
              />
              <span className="absolute right-3 top-3 text-muted-foreground text-sm">đ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương / Giờ (Gốc)</Label>
              <div className="relative">
                <Input 
                  readOnly
                  disabled
                  type="text" 
                  value={formatMoneyDisplay(settings.hourlyRate)}
                  className="pr-8 font-bold bg-muted/50 cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-xs">đ</span>
              </div>
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

          <div className="pt-4 border-t space-y-4">
            <Label className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">Hệ số & Lương OT tương ứng</Label>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {/* OT 1.5 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-orange-500">
                  <Zap className="w-3.5 h-3.5" /> Hệ số Tăng ca
                </Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="1.5"
                  className="font-bold h-11"
                  value={getNumberValue(settings.overtimeMultiplier)}
                  onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lương OT 1.5 / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly
                    disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.overtimeMultiplier)}
                    className="pr-8 font-bold bg-muted/50 text-orange-500/80 h-11"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-[10px]">đ</span>
                </div>
              </div>

              {/* OT 2.0 (Sunday) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-blue-500">
                  <Calculator className="w-3.5 h-3.5" /> Hệ số Chủ Nhật
                </Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="2.0"
                  className="font-bold h-11"
                  value={getNumberValue(settings.sundayMultiplier)}
                  onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lương CN (x{settings.sundayMultiplier}) / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly
                    disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.sundayMultiplier)}
                    className="pr-8 font-bold bg-muted/50 text-blue-500/80 h-11"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-[10px]">đ</span>
                </div>
              </div>

              {/* OT 3.0 (Holiday) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-red-500">
                  <Star className="w-3.5 h-3.5" /> Hệ số Ngày Lễ
                </Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="3.0"
                  className="font-bold h-11"
                  value={getNumberValue(settings.holidayMultiplier)}
                  onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lương Lễ (x{settings.holidayMultiplier}) / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly
                    disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.holidayMultiplier)}
                    className="pr-8 font-bold bg-muted/50 text-red-500/80 h-11"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-[10px]">đ</span>
                </div>
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
            <div className="relative">
              <Input 
                type="text" 
                inputMode="numeric"
                placeholder="0"
                value={formatMoneyDisplay(settings.insuranceSalary)} 
                onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)} 
                className="pr-8 font-medium"
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tỷ lệ đóng Bảo hiểm</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0"
                  value={formatPercentDisplay(settings.insuranceRate)} 
                  onChange={(e) => handlePercentInput('insuranceRate', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
              </div>
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
              <Label className="text-green-600 font-bold">Tỷ lệ Thuế TNCN (%)</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0"
                  value={formatPercentDisplay(settings.incomeTaxRate)} 
                  onChange={(e) => handlePercentInput('incomeTaxRate', e.target.value)} 
                  className="pr-8 font-medium border-green-200 focus-visible:ring-green-500"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đoàn phí (Cố định)</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.unionFee)} 
                  onChange={(e) => handleMoneyInput('unionFee', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
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
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceAttendanceBase)} 
                  onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
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
          <p className="text-[10px] text-muted-foreground italic">
            * Các khoản phụ cấp kỹ thuật, trách nhiệm, chức vụ, hiệu suất sẽ bị trừ theo tỷ lệ 1/30 cho mỗi ngày nghỉ không phép.
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
                <Briefcase className="w-3 h-3" /> Kỹ thuật (Trừ KP)
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceTechnical)} 
                  onChange={(e) => handleMoneyInput('allowanceTechnical', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Shield className="w-3 h-3" /> Trách nhiệm (Trừ KP)
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceResponsibility)} 
                  onChange={(e) => handleMoneyInput('allowanceResponsibility', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Award className="w-3 h-3" /> Chức vụ (Trừ KP)
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowancePosition)} 
                  onChange={(e) => handleMoneyInput('allowancePosition', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Star className="w-3 h-3" /> Hiệu suất (Trừ KP)
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowancePerformance)} 
                  onChange={(e) => handleMoneyInput('allowancePerformance', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-primary font-bold">
                <Package className="w-3 h-3" /> Tiền sản phẩm
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceProduct)} 
                  onChange={(e) => handleMoneyInput('allowanceProduct', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tiền cơm/ca</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceLunchPerShift)} 
                  onChange={(e) => handleMoneyInput('allowanceLunchPerShift', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cơm thêm (OT &ge; 2h)</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceLunchOT)} 
                  onChange={(e) => handleMoneyInput('allowanceLunchOT', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nhà ở</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceHousing)} 
                  onChange={(e) => handleMoneyInput('allowanceHousing', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-orange-600 font-bold">
                <Skull className="w-3 h-3" /> Độc hại
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceToxic)} 
                  onChange={(e) => handleMoneyInput('allowanceToxic', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-green-600 font-bold">
                <TrendingUp className="w-3 h-3" /> Doanh thu
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceBonus)} 
                  onChange={(e) => handleMoneyInput('allowanceBonus', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Xăng xe</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={formatMoneyDisplay(settings.allowanceFuel)} 
                  onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} 
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">đ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
