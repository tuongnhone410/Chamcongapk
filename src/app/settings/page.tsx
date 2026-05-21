"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Clock, Calculator, TrendingUp, AlertTriangle, CalendarCheck, Package, Zap, Skull, Briefcase, Star, Award, Shield, ShieldCheck, HomeIcon, Coffee } from 'lucide-react';
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

  const labelClass = "flex items-center gap-1.5 h-6 font-bold text-xs uppercase tracking-wider mb-1.5";
  const inputClass = "h-11 font-bold";

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-black font-headline tracking-tighter">CÀI ĐẶT LƯƠNG</h1>
        <p className="text-zinc-500 text-sm font-medium">Thiết lập chi tiết dựa trên hợp đồng lao động</p>
      </header>

      {/* Quản Lý Phép Năm */}
      <Card className="border-none shadow-sm border-l-4 border-l-green-500 bg-zinc-900 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-green-500">
            <CalendarCheck className="w-5 h-5" />
            <span>Quản Lý Phép Năm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 p-4 rounded-2xl flex items-center justify-between border border-green-500/20">
            <div>
              <p className="text-[10px] text-green-500/70 uppercase font-black tracking-widest">Số ngày phép hiện có</p>
              <p className="text-3xl font-black text-green-500">{settings.annualLeaveBalance} <span className="text-xs font-normal opacity-70">ngày</span></p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-green-500")}>Chỉnh sửa số dư phép năm</Label>
            <Input 
              type="number" 
              className={cn(inputClass, "border-green-500/20 focus-visible:ring-green-500")}
              placeholder="0"
              value={getNumberValue(settings.annualLeaveBalance)}
              onChange={(e) => handleNumberInput('annualLeaveBalance', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lương Cơ Bản & Hệ Số */}
      <Card className="border-none shadow-sm bg-zinc-900 overflow-hidden border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-primary">
            <Clock className="w-5 h-5" />
            <span>Lương Cơ Bản & Hệ Số</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-primary")}>Lương cơ bản hàng tháng (LCB)</Label>
            <div className="relative">
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.baseMonthlySalary)}
                onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)}
                placeholder="0"
                className={cn(inputClass, "pr-10 text-lg h-12 border-primary/20")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">đ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>Lương / Giờ (Gốc)</Label>
              <div className="relative">
                <Input 
                  readOnly
                  disabled
                  value={formatMoneyDisplay(settings.hourlyRate)}
                  className={cn(inputClass, "bg-zinc-950/50 border-zinc-800 cursor-not-allowed")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Ngày chốt lương</Label>
              <Select value={settings.payday.toString()} onValueChange={(val) => updateSettings({...settings, payday: parseInt(val)})}>
                <SelectTrigger className={cn(inputClass, "border-zinc-800")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-orange-500")}><Coffee className="w-3.5 h-3.5" /> Khấu trừ thời gian nghỉ (Giờ)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="1.5"
                  className={cn(inputClass, "border-orange-500/20 pr-12")}
                  value={getNumberValue(settings.breakTimeDeduction)}
                  onChange={(e) => handleNumberInput('breakTimeDeduction', e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs uppercase">Giờ</span>
              </div>
              <p className="text-[10px] text-zinc-500 italic mt-1 font-medium">VD: Nghỉ trưa 1h + Nghỉ chiều 0.5h = 1.5 giờ khấu trừ.</p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-2">
              {/* OT 1.5 */}
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-orange-500")}><Zap className="w-3.5 h-3.5" /> Hệ số Tăng ca</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  className={cn(inputClass, "border-orange-500/20")}
                  value={getNumberValue(settings.overtimeMultiplier)}
                  onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-zinc-500")}>Lương OT 1.5 / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.overtimeMultiplier)}
                    className={cn(inputClass, "bg-zinc-950/50 border-zinc-800 text-orange-500/70")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">đ</span>
                </div>
              </div>

              {/* OT 2.0 */}
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-blue-500")}><Calculator className="w-3.5 h-3.5" /> Hệ số Chủ Nhật</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  className={cn(inputClass, "border-blue-500/20")}
                  value={getNumberValue(settings.sundayMultiplier)}
                  onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-zinc-500")}>Lương CN (x2.0) / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.sundayMultiplier)}
                    className={cn(inputClass, "bg-zinc-950/50 border-zinc-800 text-blue-500/70")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">đ</span>
                </div>
              </div>

              {/* OT 3.0 */}
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-red-500")}><Star className="w-3.5 h-3.5" /> Hệ số Ngày Lễ</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  className={cn(inputClass, "border-red-500/20")}
                  value={getNumberValue(settings.holidayMultiplier)}
                  onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn(labelClass, "text-zinc-500")}>Lương Lễ (x3.0) / Giờ</Label>
                <div className="relative">
                  <Input 
                    readOnly disabled
                    value={formatMoneyDisplay(settings.hourlyRate * settings.holidayMultiplier)}
                    className={cn(inputClass, "bg-zinc-950/50 border-zinc-800 text-red-500/70")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">đ</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảo Hiểm & Thuế */}
      <Card className="border-none shadow-sm bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-primary">
            <ShieldCheck className="w-5 h-5" />
            <span>Bảo Hiểm & Thuế</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className={labelClass}>Mức lương đóng BH (SI Wage)</Label>
            <div className="relative">
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.insuranceSalary)} 
                onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)} 
                className={inputClass}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">đ</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>Tỷ lệ đóng Bảo hiểm</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="decimal"
                  value={formatPercentDisplay(settings.insuranceRate)} 
                  onChange={(e) => handlePercentInput('insuranceRate', e.target.value)} 
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-primary")}>Tiền BH (10.5%)</Label>
              <div className="h-11 flex items-center px-3 bg-zinc-950 border border-zinc-800 rounded-md font-black text-primary text-sm">
                {calculatedInsuranceMoney.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Thuế TNCN (%)</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="decimal"
                  value={formatPercentDisplay(settings.incomeTaxRate)} 
                  onChange={(e) => handlePercentInput('incomeTaxRate', e.target.value)} 
                  className={cn(inputClass, "border-green-500/20")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Đoàn phí</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  value={formatMoneyDisplay(settings.unionFee)} 
                  onChange={(e) => handleMoneyInput('unionFee', e.target.value)} 
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">đ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chuyên Cần & Nghỉ Không Phép */}
      <Card className={cn("border-none shadow-sm border-l-4 bg-zinc-900 border-zinc-800", absenceColors.border)}>
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-zinc-400">
            <AlertTriangle className={cn("w-5 h-5", absenceColors.text)} />
            <span>Chuyên Cần & Nghỉ Không Phép</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>Tiền chuyên cần gốc</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  value={formatMoneyDisplay(settings.allowanceAttendanceBase)} 
                  onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} 
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, absenceColors.text)}>Số ngày nghỉ K.Phép</Label>
              <Input 
                type="number" 
                className={cn(inputClass, "border-2", absenceColors.input)}
                value={getNumberValue(settings.unexcusedAbsences)} 
                onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phụ Cấp & Tiền Cơm */}
      <Card className="border-none shadow-sm bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-primary">
            <Gift className="w-5 h-5" />
            <span>Phụ Cấp & Tiền Cơm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4">
          {[
            { key: 'allowanceTechnical', label: 'Kỹ thuật', icon: Briefcase },
            { key: 'allowanceResponsibility', label: 'Trách nhiệm', icon: Shield },
            { key: 'allowancePosition', label: 'Chức vụ', icon: Award },
            { key: 'allowancePerformance', label: 'Hiệu suất', icon: Star },
            { key: 'allowanceProduct', label: 'Tiền sản phẩm', icon: Package },
            { key: 'allowanceLunchPerShift', label: 'Tiền cơm/ca', icon: Clock },
            { key: 'allowanceLunchOT', label: 'Cơm thêm (OT)', icon: Zap },
            { key: 'allowanceHousing', label: 'Tiền nhà ở', icon: HomeIcon },
            { key: 'allowanceToxic', label: 'Độc hại', icon: Skull, color: "text-orange-500" },
            { key: 'allowanceBonus', label: 'Doanh thu', icon: TrendingUp, color: "text-green-500" },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <Label className={cn(labelClass, item.color)}>
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </Label>
              <div className="relative">
                <Input 
                  type="text" 
                  inputMode="numeric"
                  value={formatMoneyDisplay(settings[item.key as keyof AppSettings] as number)} 
                  onChange={(e) => handleMoneyInput(item.key as keyof AppSettings, e.target.value)} 
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">đ</span>
              </div>
            </div>
          ))}
          <div className="space-y-1">
            <Label className={labelClass}>Xăng xe</Label>
            <div className="relative">
              <Input 
                type="text" 
                inputMode="numeric"
                value={formatMoneyDisplay(settings.allowanceFuel)} 
                onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} 
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">đ</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
