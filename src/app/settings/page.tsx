"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Save, 
  UserCircle,
  AlertTriangle,
  Gift,
  Zap,
  LogOut
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

  const handleNumberInput = (key: keyof AppSettings, val: string) => {
    setLocalSettings({ ...localSettings, [key]: val === "" ? 0 : parseFloat(val) });
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast({ title: "Thành công", description: "Cài đặt đã được lưu." });
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

  const labelClass = "text-[10px] font-black uppercase tracking-widest mb-1.5 block";
  const inputClass = "h-11 font-bold bg-zinc-900 border-zinc-800 rounded-xl text-white text-sm";
  const suffixClass = "absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm";

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between sticky top-0 z-20 bg-zinc-950/90 py-4">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase text-white">Cài đặt lương</h1>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 rounded-xl px-6 font-black gap-2 shadow-xl h-12 active:scale-95 transition-all">
          <Save className="w-5 h-5" />
          LƯU
        </Button>
      </header>

      {/* Lương Hợp Đồng & Bảo Hiểm */}
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
            <Calculator className="w-4 h-4" /> Hợp đồng lương & Bảo hiểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>Lương cơ bản hàng tháng</Label>
            <div className="relative">
              <Input 
                type="text" 
                value={formatMoneyDisplay(localSettings.baseMonthlySalary)}
                onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)}
                className={cn(inputClass, "pr-12")}
              />
              <span className={suffixClass}>đ</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Lương bảo hiểm</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={formatMoneyDisplay(localSettings.insuranceSalary)}
                  onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)}
                  className={cn(inputClass, "pr-10")}
                />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Tỷ lệ BH (%)</Label>
              <div className="relative">
                <Input 
                  type="number" step="0.1"
                  className={cn(inputClass, "pr-10")}
                  value={localSettings.insuranceRate.toString()}
                  onChange={(e) => handleNumberInput('insuranceRate', e.target.value)}
                />
                <span className={suffixClass}>%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Đoàn phí</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={formatMoneyDisplay(localSettings.unionFee)}
                  onChange={(e) => handleMoneyInput('unionFee', e.target.value)}
                  className={cn(inputClass, "pr-10")}
                />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Ngày chốt lương</Label>
              <Select value={localSettings.payday.toString()} onValueChange={(val) => setLocalSettings({...localSettings, payday: parseInt(val)})}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>Khấu trừ giờ nghỉ (giờ)</Label>
            <Input 
              type="number" step="0.1"
              className={inputClass}
              value={localSettings.breakTimeDeduction === 0 ? "" : localSettings.breakTimeDeduction.toString()}
              onChange={(e) => handleNumberInput('breakTimeDeduction', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hệ Số Tăng Ca */}
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-orange-500">
            <Zap className="w-4 h-4" /> Hệ Số Tăng Ca
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT Thường</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.overtimeMultiplier.toString()} onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.overtimeMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT CN</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.sundayMultiplier.toString()} onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.sundayMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT Lễ</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.holidayMultiplier.toString()} onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.holidayMultiplier)}đ/h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chuyên Cần & Nghỉ Không Phép */}
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-green-500">
            <AlertTriangle className="w-4 h-4" /> Chuyên Cần & Nghỉ Không Phép
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Chuyên cần gốc</Label>
              <div className="relative">
                <Input type="text" value={formatMoneyDisplay(localSettings.allowanceAttendanceBase)} onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} className={cn(inputClass, "pr-10")} />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Ngày nghỉ K.Phép</Label>
              <Input type="number" className={cn(inputClass, "border-green-500/30")} value={localSettings.unexcusedAbsences === 0 ? "0" : localSettings.unexcusedAbsences.toString()} onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Các khoản phụ cấp */}
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-green-500">
            <Gift className="w-4 h-4" /> Các khoản phụ cấp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {['allowanceTechnical', 'allowanceResponsibility', 'allowancePosition', 'allowancePerformance'].map((key) => (
              <div key={key} className="space-y-1">
                <Label className={cn(labelClass, "text-zinc-500")}>{key === 'allowanceTechnical' ? 'Kỹ thuật' : key === 'allowanceResponsibility' ? 'Trách nhiệm' : key === 'allowancePosition' ? 'Chức vụ' : 'Hiệu suất'}</Label>
                <div className="relative">
                  <Input type="text" className={cn(inputClass, "pr-10")} value={formatMoneyDisplay(localSettings[key as keyof AppSettings] as number)} onChange={(e) => handleMoneyInput(key as keyof AppSettings, e.target.value)} />
                  <span className={suffixClass}>đ</span>
                </div>
              </div>
            ))}
            {['allowanceProduct', 'allowanceLunchPerShift', 'allowanceLunchOT', 'allowanceHousing', 'allowanceToxic', 'allowanceBonus', 'allowanceFuel'].map((key) => (
              <div key={key} className="space-y-1">
                <Label className={cn(labelClass, "text-zinc-500")}>
                  {key === 'allowanceProduct' ? 'Sản phẩm' : key === 'allowanceLunchPerShift' ? 'Cơm/ca' : key === 'allowanceLunchOT' ? 'Cơm OT' : key === 'allowanceHousing' ? 'Nhà ở' : key === 'allowanceToxic' ? 'Độc hại' : key === 'allowanceBonus' ? 'Doanh thu' : 'Xăng xe'}
                </Label>
                <div className="relative">
                  <Input type="text" className={cn(inputClass, "pr-10")} value={formatMoneyDisplay(localSettings[key as keyof AppSettings] as number)} onChange={(e) => handleMoneyInput(key as keyof AppSettings, e.target.value)} />
                  <span className={suffixClass}>đ</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-white">Tài khoản</p>
            <p className="text-[10px] text-zinc-500 font-bold">{auth?.currentUser?.email}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 font-black gap-2 hover:bg-red-500/10 h-10 px-4 rounded-xl">
          <LogOut className="w-4 h-4" /> THOÁT
        </Button>
      </div>
    </div>
  );
}