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

  if (!isLoaded || !localSettings) return <div className="p-8 animate-pulse bg-zinc-900 rounded-2xl h-64" />;

  const formatMoneyDisplay = (val: number) => Math.round(val || 0).toLocaleString('vi-VN');

  const handleMoneyInput = (key: keyof AppSettings, val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0");
    if (key === 'baseMonthlySalary') {
      setLocalSettings({ ...localSettings, baseMonthlySalary: num, hourlyRate: Math.round(num / 208) });
    } else {
      setLocalSettings({ ...localSettings, [key]: num });
    }
  };

  const handleNumberInput = (key: keyof AppSettings, val: string) => {
    setLocalSettings({ ...localSettings, [key]: parseFloat(val || "0") });
  };

  const labelClass = "text-[10px] font-black uppercase tracking-widest mb-1.5 block";
  const inputClass = "h-11 font-bold bg-zinc-900 border-zinc-800 rounded-xl text-white text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-zinc-700";
  const suffixClass = "absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm pointer-events-none";

  return (
    <div className="space-y-6 pb-24 text-white">
      <header className="flex items-center justify-between sticky top-0 z-20 bg-zinc-950/90 py-4 backdrop-blur-md border-b border-zinc-900/50">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black uppercase text-white">Cài đặt lương</h1>
          {hasChanges && <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase animate-pulse">Chưa lưu</Badge>}
        </div>
        <Button onClick={() => updateSettings(localSettings!).then(() => toast({ title: "Đã lưu" }))} disabled={isSaving || !hasChanges} className="rounded-xl px-6 font-black h-12">
          <Save className="w-5 h-5 mr-2" /> LƯU
        </Button>
      </header>

      <Card className="bg-zinc-900 border-zinc-800 rounded-[2rem]">
        <CardHeader><CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2"><Calculator className="w-4 h-4" /> Lương & Bảo hiểm</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className={cn(labelClass, "text-zinc-500")}>Lương cơ bản</Label>
            <div className="relative"><Input value={formatMoneyDisplay(localSettings.baseMonthlySalary)} onChange={(e) => handleMoneyInput('baseMonthlySalary', e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Bảo hiểm xh (%)</Label>
              <div className="relative"><Input type="number" value={localSettings.insuranceRate.toString()} onChange={(e) => handleNumberInput('insuranceRate', e.target.value)} className={inputClass} /><span className={suffixClass}>%</span></div>
            </div>
            <div className="space-y-1">
              <Label className={cn(labelClass, "text-zinc-500")}>Ngày chốt</Label>
              <Select value={localSettings.payday.toString()} onValueChange={(v) => setLocalSettings({...localSettings, payday: parseInt(v)})}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-900 text-white">{[...Array(31)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 rounded-[2rem]">
        <CardHeader><CardTitle className="text-xs font-black uppercase text-green-500 flex items-center gap-2"><Gift className="w-4 h-4" /> Các khoản phụ cấp</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[
            { key: 'allowanceTechnical', label: 'Kỹ thuật', color: 'text-blue-400' },
            { key: 'allowanceResponsibility', label: 'Trách nhiệm', color: 'text-amber-400' },
            { key: 'allowancePosition', label: 'Chức vụ', color: 'text-purple-400' },
            { key: 'allowancePerformance', label: 'Hiệu suất', color: 'text-cyan-400' },
            { key: 'allowanceProduct', label: 'Sản phẩm', color: 'text-orange-400' },
            { key: 'allowanceHousing', label: 'Nhà ở', color: 'text-indigo-400' },
            { key: 'allowanceToxic', label: 'Độc hại', color: 'text-rose-400' },
            { key: 'allowanceFuel', label: 'Xăng xe', color: 'text-sky-400' }
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <Label className={cn(labelClass, item.color)}>{item.label}</Label>
              <div className="relative"><Input value={formatMoneyDisplay(localSettings[item.key as keyof AppSettings] as number)} onChange={(e) => handleMoneyInput(item.key as keyof AppSettings, e.target.value)} className={inputClass} /><span className={suffixClass}>đ</span></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="ghost" onClick={handleLogout} className="w-full text-red-500 font-black h-14 rounded-2xl bg-zinc-900/50 border border-zinc-800"><LogOut className="mr-2" /> THOÁT TÀI KHOẢN</Button>
    </div>
  );
}