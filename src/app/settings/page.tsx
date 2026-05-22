"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Save, 
  UserCircle,
  AlertTriangle,
  Gift,
  Zap,
  LogOut,
  Loader2,
  Info
} from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (isLoaded && settings) {
      setLocalSettings(settings);
    }
  }, [isLoaded, settings]);

  const hasChanges = useMemo(() => {
    if (!settings || !localSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(localSettings);
  }, [settings, localSettings]);

  if (!isLoaded || !localSettings) {
    return (
      <div className="space-y-6 pb-24 animate-pulse text-white">
        <header className="flex items-center justify-between py-4">
          <div className="h-8 bg-zinc-900 rounded-xl w-48" />
          <div className="h-12 bg-zinc-900 rounded-xl w-24" />
        </header>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-zinc-900 rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

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
    const parsed = val === "" ? 0 : parseFloat(val);
    setLocalSettings({ ...localSettings, [key]: parsed });
  };

  const handleSave = async () => {
    if (!localSettings) return;

    if (localSettings.insuranceRate < 0 || localSettings.insuranceRate > 100) {
      toast({
        variant: "destructive",
        title: "Dữ liệu không hợp lệ",
        description: "Tỷ lệ đóng bảo hiểm phải nằm trong khoảng từ 0% đến 100%."
      });
      return;
    }

    if (
      localSettings.overtimeMultiplier < 0 || 
      localSettings.sundayMultiplier < 0 || 
      localSettings.holidayMultiplier < 0
    ) {
      toast({
        variant: "destructive",
        title: "Dữ liệu không hợp lệ",
        description: "Hệ số tăng ca không được phép là số âm."
      });
      return;
    }

    if (localSettings.breakTimeDeduction < 0 || localSettings.breakTimeDeduction > 24) {
      toast({
        variant: "destructive",
        title: "Dữ liệu không hợp lệ",
        description: "Khấu trừ giờ nghỉ hàng ngày phải nằm trong khoảng từ 0 đến 24 giờ."
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      toast({ title: "Thành công", description: "Các cài đặt lương đã được lưu trữ." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể kết nối để lưu cài đặt." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      window.location.href = '/auth';
    }
  };

  const labelClass = "text-[10px] font-black uppercase tracking-widest mb-1.5 block";
  const inputClass = "h-11 font-bold bg-zinc-900 border-zinc-800 rounded-xl text-white text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-zinc-700 focus:outline-none transition-colors";
  const suffixClass = "absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm pointer-events-none";

  return (
    <div className="space-y-6 pb-24 text-white">
      <header className="flex items-center justify-between sticky top-0 z-20 bg-zinc-950/90 py-4 backdrop-blur-md border-b border-zinc-900/50">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tighter uppercase text-white">Cài đặt lương</h1>
          {hasChanges && (
            <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase animate-pulse">
              Có thay đổi chưa lưu
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className={cn(
            "rounded-xl px-6 font-black gap-2 shadow-xl h-12 transition-all active:scale-95",
            hasChanges 
              ? "bg-primary text-black hover:bg-primary/90" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              ĐANG LƯU
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              LƯU CẤU HÌNH
            </>
          )}
        </Button>
      </header>

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
                disabled={isSaving}
              />
              <span className={suffixClass}>đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold px-1 mt-1">
              <Info className="w-3.5 h-3.5 text-primary" />
              Lương mỗi giờ chuẩn: <span className="text-white">{formatMoneyDisplay(localSettings.hourlyRate)}đ/h</span> (Dựa trên 208 giờ chuẩn/tháng)
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
                  disabled={isSaving}
                />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Bảo hiểm xh (%)</Label>
              <div className="relative">
                <Input 
                  type="number" step="0.1"
                  className={cn(inputClass, "pr-10")}
                  value={localSettings.insuranceRate.toString()}
                  onChange={(e) => handleNumberInput('insuranceRate', e.target.value)}
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Tiền BH khấu trừ</Label>
              <div className="h-11 flex items-center px-4 bg-zinc-900 border border-zinc-800 rounded-xl font-black text-red-500 text-sm">
                -{formatMoneyDisplay((localSettings.insuranceSalary * localSettings.insuranceRate) / 100)}đ
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Ngày chốt lương</Label>
              <Select 
                disabled={isSaving}
                value={localSettings.payday.toString()} 
                onValueChange={(val) => setLocalSettings({...localSettings, payday: parseInt(val)})}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                  {daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Khấu trừ giờ nghỉ (giờ)</Label>
              <Input 
                type="number" step="0.1"
                className={inputClass}
                value={localSettings.breakTimeDeduction === 0 ? "" : localSettings.breakTimeDeduction.toString()}
                onChange={(e) => handleNumberInput('breakTimeDeduction', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-orange-500">
            <Zap className="w-4 h-4" /> Hệ Số Tăng Ca
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT Thường</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.overtimeMultiplier.toString()} onChange={(e) => handleNumberInput('overtimeMultiplier', e.target.value)} disabled={isSaving} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.overtimeMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT CN</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.sundayMultiplier.toString()} onChange={(e) => handleNumberInput('sundayMultiplier', e.target.value)} disabled={isSaving} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.sundayMultiplier)}đ/h
            </p>
          </div>
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>OT Lễ</Label>
            <Input type="number" step="0.1" className={inputClass} value={localSettings.holidayMultiplier.toString()} onChange={(e) => handleNumberInput('holidayMultiplier', e.target.value)} disabled={isSaving} />
            <p className="text-[10px] font-black text-orange-500 mt-1">
              {formatMoneyDisplay(localSettings.hourlyRate * localSettings.holidayMultiplier)}đ/h
            </p>
          </div>
        </CardContent>
      </Card>

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
                <Input type="text" value={formatMoneyDisplay(localSettings.allowanceAttendanceBase)} onChange={(e) => handleMoneyInput('allowanceAttendanceBase', e.target.value)} className={cn(inputClass, "pr-10")} disabled={isSaving} />
                <span className={suffixClass}>đ</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-green-500")}>Ngày nghỉ không phép</Label>
              <Input type="number" className={cn(inputClass, "border-green-500/30")} value={localSettings.unexcusedAbsences === 0 ? "0" : localSettings.unexcusedAbsences.toString()} onChange={(e) => handleNumberInput('unexcusedAbsences', e.target.value)} disabled={isSaving} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-green-500">
            <Gift className="w-4 h-4" /> Các khoản phụ cấp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'allowanceTechnical', label: 'Kỹ thuật', color: 'text-blue-400' },
              { key: 'allowanceResponsibility', label: 'Trách nhiệm', color: 'text-amber-400' },
              { key: 'allowancePosition', label: 'Chức vụ', color: 'text-purple-400' },
              { key: 'allowancePerformance', label: 'Hiệu suất', color: 'text-cyan-400' }
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <Label className={cn(labelClass, item.color)}>{item.label}</Label>
                <div className="relative">
                  <Input 
                    type="text" 
                    className={cn(inputClass, "pr-10")} 
                    value={formatMoneyDisplay(localSettings[item.key as keyof AppSettings] as number)} 
                    onChange={(e) => handleMoneyInput(item.key as keyof AppSettings, e.target.value)} 
                    disabled={isSaving}
                  />
                  <span className={suffixClass}>đ</span>
                </div>
              </div>
            ))}
            
            {[
              { key: 'allowanceProduct', label: 'Tiền sản phẩm', color: 'text-orange-400' },
              { key: 'allowanceLunchPerShift', label: 'Cơm / ca', color: 'text-emerald-400' },
              { key: 'allowanceLunchOT', label: 'Cơm OT (≥ 2h)', color: 'text-lime-400' },
              { key: 'allowanceHousing', label: 'Nhà ở', color: 'text-indigo-400' },
              { key: 'allowanceToxic', label: 'Độc hại', color: 'text-rose-400' },
              { key: 'allowanceBonus', label: 'Thưởng / Doanh thu', color: 'text-sky-400' },
              { key: 'allowanceFuel', label: 'Xăng xe', color: 'text-violet-400' }
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <Label className={cn(labelClass, item.color)}>{item.label}</Label>
                <div className="relative">
                  <Input 
                    type="text" 
                    className={cn(inputClass, "pr-10")} 
                    value={formatMoneyDisplay(localSettings[item.key as keyof AppSettings] as number)} 
                    onChange={(e) => handleMoneyInput(item.key as keyof AppSettings, e.target.value)} 
                    disabled={isSaving}
                  />
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
            <p className="text-[10px] text-zinc-500 font-bold">{auth?.currentUser?.email || "Chưa đăng nhập"}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          disabled={isSaving}
          className="text-red-500 font-black gap-2 hover:bg-red-500/10 h-10 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" /> THOÁT
        </Button>
      </div>
    </div>
  );
}
