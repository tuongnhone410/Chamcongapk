"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calculator, 
  CalendarCheck, 
  Zap, 
  Star, 
  Save, 
  ShieldCheck, 
  TrendingUp, 
  HeartPulse, 
  BadgeDollarSign,
  Coffee,
  HardHat,
  Trophy,
  Target,
  LogOut,
  UserCircle
} from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (isLoaded && settings) {
      setLocalSettings(settings);
    }
  }, [isLoaded, settings]);

  if (!isLoaded || !localSettings) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatMoneyDisplay = (val: number) => {
    if (val === 0) return "0";
    return Math.round(val).toLocaleString('vi-VN');
  };

  const handleMoneyInput = (key: keyof AppSettings, val: string) => {
    const numericValue = val.replace(/\D/g, "");
    const num = numericValue === "" ? 0 : parseInt(numericValue);
    
    if (key === 'baseMonthlySalary') {
      const calculatedHourly = Math.round(num / 208);
      setLocalSettings({
        ...localSettings,
        baseMonthlySalary: num,
        hourlyRate: calculatedHourly,
        insuranceSalary: localSettings.insuranceSalary || num 
      });
    } else {
      setLocalSettings({ ...localSettings, [key]: num });
    }
  };

  const handlePercentInput = (key: keyof AppSettings, val: string) => {
    const numericValue = val.replace(/[^0-9.]/g, "");
    const num = numericValue === "" ? 0 : parseFloat(numericValue);
    setLocalSettings({ ...localSettings, [key]: num });
  };

  const handleNumberInput = (key: keyof AppSettings, val: string) => {
    setLocalSettings({ ...localSettings, [key]: val === "" ? 0 : parseFloat(val) });
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast({ title: "Thành công", description: "Thông số lương đã được cập nhật." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu cài đặt." });
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      window.location.href = '/auth';
    }
  };

  const getNumberValue = (val: number) => val === 0 ? "" : val.toString();

  const labelClass = "flex items-center gap-1.5 h-6 font-bold text-[10px] uppercase tracking-wider mb-1.5";
  const inputClass = "h-11 font-bold bg-zinc-900 border-zinc-800 rounded-xl";

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md py-4">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase">Cài đặt lương</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Hệ thống tính toán Pro</p>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 rounded-xl px-6 font-black gap-2 shadow-xl h-12">
          <Save className="w-5 h-5" />
          LƯU
        </Button>
      </header>

      {/* Quản Lý Phép Năm */}
      <Card className="border-none shadow-sm border-l-4 border-l-green-500 bg-zinc-900 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-green-500">
            <CalendarCheck className="w-5 h-5" />
            <span>Phép Năm & Chuyên Cần</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Số dư phép năm</Label>
              <Input 
                type="number" 
                className={inputClass}
                value={getNumberValue(localSettings.annualLeaveBalance)}
                onChange={(e) => handleNumberInput('annualLeaveBalance', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-red-500")}>Nghỉ không phép</Label>
              <Input 
                type="number" 
                className={inputClass}
                value={getNumberValue(localSettings.unexcusedAbsences)}
                onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Tiền chuyên cần gốc</Label>
            <div className="relative">
              <Input 
                type="text" 
                value={formatMoneyDisplay(localSettings.allowanceAttendanceBase)}
                onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)}
                className={inputClass}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">đ</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lương Cơ Bản */}
      <Card className="border-none shadow-sm bg-zinc-900 overflow-hidden border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-primary">
            <Clock className="w-5 h-5" />
            <span>Lương Hợp Đồng & Hệ Số</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-primary")}>Lương cơ bản hàng tháng (LCB)</Label>
            <div className="relative">
              <Input 
                type="text" 
                value={formatMoneyDisplay(localSettings.baseMonthlySalary)}
                onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)}
                className={cn(inputClass, "text-lg h-12 border-primary/20")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">đ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>Ngày chốt lương</Label>
              <Select value={localSettings.payday.toString()} onValueChange={(val) => setLocalSettings({...localSettings, payday: parseInt(val)})}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-orange-500")}>Trừ giờ nghỉ (H)</Label>
              <Input 
                type="number" step="0.1"
                className={cn(inputClass, "border-orange-500/20")}
                value={getNumberValue(localSettings.breakTimeDeduction)}
                onChange={(e) => handleNumberInput('breakTimeDeduction', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-orange-400")}>OT 1.5</Label>
              <Input type="number" step="0.1" className={inputClass} value={getNumberValue(localSettings.overtimeMultiplier)} onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-blue-400")}>CN x2.0</Label>
              <Input type="number" step="0.1" className={inputClass} value={getNumberValue(localSettings.sundayMultiplier)} onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-red-400")}>Lễ x3.0</Label>
              <Input type="number" step="0.1" className={inputClass} value={getNumberValue(localSettings.holidayMultiplier)} onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phụ Cấp Hàng Tháng */}
      <Card className="border-none shadow-sm bg-zinc-900 overflow-hidden border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center space-x-2 text-yellow-500">
            <BadgeDollarSign className="w-5 h-5" />
            <span>Phụ Cấp & Thưởng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}><Coffee className="w-3 h-3"/> Tiền cơm/ca</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceLunchPerShift)} onChange={(e) => handleMoneyInput('allowanceLunchPerShift', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}><Coffee className="w-3 h-3"/> Cơm thêm OT</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceLunchOT)} onChange={(e) => handleMoneyInput('allowanceLunchOT', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Tiền sản phẩm</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceProduct)} onChange={(e) => handleMoneyInput('allowanceProduct', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}><HardHat className="w-3 h-3"/> Độc hại</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceToxic)} onChange={(e) => handleMoneyInput('allowanceToxic', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Tiền nhà ở</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceHousing)} onChange={(e) => handleMoneyInput('allowanceHousing', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}><Trophy className="w-3 h-3"/> Thưởng khác</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceBonus)} onChange={(e) => handleMoneyInput('allowanceBonus', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Tiền Xăng</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceFuel)} onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Tiền Điện thoại</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowancePhone)} onChange={(e) => handleMoneyInput('allowancePhone', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phụ Cấp Theo Ngày Công (Có khấu trừ) */}
      <Card className="border-none shadow-sm bg-zinc-900 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-500">Phụ cấp theo ngày công</CardTitle>
          <p className="text-[9px] text-zinc-500 uppercase">Tự động trừ theo số ngày nghỉ không phép</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={labelClass}>Tiền kỹ thuật</Label>
            <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceTechnical)} onChange={(e) => handleMoneyInput('allowanceTechnical', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Tiền trách nhiệm</Label>
            <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceResponsibility)} onChange={(e) => handleMoneyInput('allowanceResponsibility', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Tiền chức vụ</Label>
            <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowancePosition)} onChange={(e) => handleMoneyInput('allowancePosition', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Tiền hiệu suất</Label>
            <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowancePerformance)} onChange={(e) => handleMoneyInput('allowancePerformance', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Khấu Trừ & Mục Tiêu */}
      <Card className="border-none shadow-sm bg-zinc-900 border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Bảo Hiểm & Mục Tiêu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>Lương đóng BH</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.insuranceSalary)} onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Tỷ lệ BH (%)</Label>
              <Input type="number" step="0.1" className={inputClass} value={getNumberValue(localSettings.insuranceRate)} onChange={(e) => handleNumberInput('insuranceRate', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Đoàn phí</Label>
              <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.unionFee)} onChange={(e) => handleMoneyInput('unionFee', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Thuế TNCN (%)</Label>
              <Input type="number" step="0.1" className={inputClass} value={getNumberValue(localSettings.incomeTaxRate)} onChange={(e) => handleNumberInput('incomeTaxRate', e.target.value)} />
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <Label className={cn(labelClass, "text-primary")}><Target className="w-4 h-4"/> Mục tiêu thu nhập</Label>
            <div className="relative">
              <Input 
                type="text" 
                value={formatMoneyDisplay(localSettings.monthlyTarget)}
                onChange={(e) => handleMoneyInput('monthlyTarget', e.target.value)}
                className={cn(inputClass, "text-xl h-14 border-primary/30")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">đ</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white">Tài khoản cá nhân</p>
              <p className="text-[10px] text-zinc-500 font-bold">{auth?.currentUser?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 font-black gap-2 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            ĐĂNG XUẤT
          </Button>
        </div>
      </Card>

      <div className="pt-8 text-center">
        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Thiết kế bởi TruongVanKhoa</p>
      </div>
    </div>
  );
}