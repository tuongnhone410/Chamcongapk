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
  Save, 
  UserCircle,
  AlertTriangle,
  Gift,
  Zap,
  ShieldCheck,
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
  const inputClass = "h-11 font-bold bg-zinc-900 border-zinc-800 rounded-xl text-white";

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between sticky top-0 z-20 bg-zinc-950/90 py-4">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase text-white">Cài đặt lương</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Hệ thống tính toán Pro</p>
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
            <Calculator className="w-4 h-4" /> Lương Hợp Đồng & Bảo Hiểm
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
                className={cn(inputClass, "text-lg")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">đ</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Lương đóng bảo hiểm</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={formatMoneyDisplay(localSettings.insuranceSalary)}
                  onChange={(e) => handleMoneyInput('insuranceSalary', e.target.value)}
                  className={inputClass}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Tỷ lệ bảo hiểm (%)</Label>
              <Input 
                type="number" step="0.1"
                className={inputClass}
                value={localSettings.insuranceRate.toString()}
                onChange={(e) => handleNumberInput('insuranceRate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Đoàn phí (Cố định)</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={formatMoneyDisplay(localSettings.unionFee)}
                  onChange={(e) => handleMoneyInput('unionFee', e.target.value)}
                  className={inputClass}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">đ</span>
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
            <Label className={cn(labelClass, "text-zinc-500")}>Khấu trừ giờ nghỉ hàng ngày (giờ)</Label>
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
            <Label className={labelClass}>OT thường</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.overtimeMultiplier.toString()} onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.overtimeMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>OT CN</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.sundayMultiplier.toString()} onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.sundayMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>OT Lễ</Label>
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
              <Label className={cn(labelClass, "text-zinc-500")}>Tiền chuyên cần gốc</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={formatMoneyDisplay(localSettings.allowanceAttendanceBase)}
                  onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)}
                  className={inputClass}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Số ngày nghỉ K.Phép</Label>
              <Input 
                type="number" 
                className={cn(inputClass, "border-green-500/30")}
                value={localSettings.unexcusedAbsences === 0 ? "0" : localSettings.unexcusedAbsences.toString()}
                onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)}
              />
            </div>
          </div>
          <p className="text-[9px] text-zinc-500 font-medium italic">
            * Các khoản phụ cấp kỹ thuật, trách nhiệm, chức vụ, hiệu suất sẽ bị trừ theo tỷ lệ 1/30 cho mỗi ngày nghỉ không phép.
          </p>
        </CardContent>
      </Card>

      {/* Phụ Cấp & Tiền Cơm */}
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
            <Gift className="w-4 h-4" /> Phụ Cấp & Tiền Cơm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-blue-500")}>Kỹ thuật (Trừ KP)</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceTechnical)} onChange={(e) => handleMoneyInput('allowanceTechnical', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-blue-500")}>Trách nhiệm (Trừ KP)</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceResponsibility)} onChange={(e) => handleMoneyInput('allowanceResponsibility', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-blue-500")}>Chức vụ (Trừ KP)</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowancePosition)} onChange={(e) => handleMoneyInput('allowancePosition', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-blue-500")}>Hiệu suất (Trừ KP)</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowancePerformance)} onChange={(e) => handleMoneyInput('allowancePerformance', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Tiền sản phẩm</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceProduct)} onChange={(e) => handleMoneyInput('allowanceProduct', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Tiền cơm/ca</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceLunchPerShift)} onChange={(e) => handleMoneyInput('allowanceLunchPerShift', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Cơm thêm (OT ≥ 2h)</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceLunchOT)} onChange={(e) => handleMoneyInput('allowanceLunchOT', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Nhà ở</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceHousing)} onChange={(e) => handleMoneyInput('allowanceHousing', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-orange-500")}>Độc hại</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceToxic)} onChange={(e) => handleMoneyInput('allowanceToxic', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Doanh thu</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceBonus)} onChange={(e) => handleMoneyInput('allowanceBonus', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Xăng xe</Label>
              <div className="relative">
                <Input type="text" className={inputClass} value={formatMoneyDisplay(localSettings.allowanceFuel)} onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">đ</span>
              </div>
            </div>
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

      <div className="text-center pt-4 opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">TimeSnap Pro by TruongVanKhoa</p>
      </div>
    </div>
  );
}