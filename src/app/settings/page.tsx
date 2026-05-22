
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
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      toast({ title: "Thành công", description: "Các cài đặt lương đã được lưu trữ." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu cài đặt." });
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
              Chưa lưu
            </Badge>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="rounded-xl px-6 font-black h-12 shadow-xl transition-all">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} LƯU CẤU HÌNH
        </Button>
      </header>

      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><Calculator className="w-4 h-4" /> Hợp đồng lương & Bảo hiểm</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>Lương cơ bản hàng tháng</Label>
            <div className="relative"><Input value={formatMoneyDisplay(localSettings.baseMonthlySalary)} onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Bảo hiểm xh (%)</Label>
              <div className="relative"><Input type="number" step="0.1" value={localSettings.insuranceRate.toString()} onChange={(e) => handleNumberInput('insuranceRate', e.target.value)} className={inputClass} /><span className={suffixClass}>%</span></div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Ngày chốt lương</Label>
              <Select value={localSettings.payday.toString()} onValueChange={(val) => setLocalSettings({...localSettings, payday: parseInt(val)})}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">{daysInMonth.map(day => <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-green-500"><Gift className="w-4 h-4" /> Các khoản phụ cấp</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><Label className={cn(labelClass, "text-blue-400")}>Kỹ thuật</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceTechnical)} onChange={(e) => handleMoneyInput('allowanceTechnical', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-amber-400")}>Trách nhiệm</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceResponsibility)} onChange={(e) => handleMoneyInput('allowanceResponsibility', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-purple-400")}>Chức vụ</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowancePosition)} onChange={(e) => handleMoneyInput('allowancePosition', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-cyan-400")}>Hiệu suất</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowancePerformance)} onChange={(e) => handleMoneyInput('allowancePerformance', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-orange-400")}>Sản phẩm</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceProduct)} onChange={(e) => handleMoneyInput('allowanceProduct', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-indigo-400")}>Nhà ở</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceHousing)} onChange={(e) => handleMoneyInput('allowanceHousing', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-rose-400")}>Độc hại</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceToxic)} onChange={(e) => handleMoneyInput('allowanceToxic', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
          <div className="space-y-1"><Label className={cn(labelClass, "text-sky-400")}>Xăng xe</Label><div className="relative"><Input value={formatMoneyDisplay(localSettings.allowanceFuel)} onChange={(e) => handleMoneyInput('allowanceFuel', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div></div>
        </CardContent>
      </Card>

      <Button variant="ghost" onClick={handleLogout} className="w-full text-red-500 font-black h-14 rounded-2xl bg-zinc-900/50 border border-zinc-800"><LogOut className="mr-2" /> THOÁT TÀI KHOẢN</Button>
    </div>
  );
}
