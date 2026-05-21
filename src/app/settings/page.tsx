
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Target, Calculator, Skull, TrendingUp } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleMonthlySalaryChange = (val: string) => {
    const numVal = parseFloat(val) || 0;
    const calculatedHourly = Math.round(numVal / 208);
    
    updateSettings({
      ...settings,
      baseMonthlySalary: numVal,
      hourlyRate: calculatedHourly
    });
  };

  const handleNumberInput = (key: keyof typeof settings, val: string) => {
    updateSettings({
      ...settings,
      [key]: val === "" ? 0 : parseFloat(val)
    });
  };

  const getInputValue = (val: number) => (val === 0 ? "" : val.toString());

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold font-headline">Cấu Hình Lương</h1>
        <p className="text-muted-foreground text-sm">Thiết lập chi tiết dựa trên hợp đồng lao động</p>
      </header>

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
                type="number" 
                value={getInputValue(settings.baseMonthlySalary)}
                onChange={(e) => handleMonthlySalaryChange(e.target.value)}
                placeholder="Ví dụ: 5.730.000"
                className="pr-10"
              />
              <Calculator className="absolute right-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương / Giờ (OT)</Label>
              <Input 
                type="number" 
                value={getInputValue(settings.hourlyRate)}
                onChange={(e) => handleNumberInput('hourlyRate', e.target.value)}
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
            <Gift className="w-5 h-5 text-primary" />
            <span>Phụ Cấp & Hỗ Trợ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Nhà ở</Label>
              <Input type="number" value={getInputValue(settings.allowanceHousing)} onChange={(e) => handleNumberInput('allowanceHousing', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Chuyên cần</Label>
              <Input type="number" value={getInputValue(settings.allowanceAttendance)} onChange={(e) => handleNumberInput('allowanceAttendance', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-orange-600 font-bold">
                <Skull className="w-3 h-3" /> Độc hại
              </Label>
              <Input type="number" value={getInputValue(settings.allowanceToxic)} onChange={(e) => handleNumberInput('allowanceToxic', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-green-600 font-bold">
                <TrendingUp className="w-3 h-3" /> Doanh thu
              </Label>
              <Input type="number" value={getInputValue(settings.allowanceBonus)} onChange={(e) => handleNumberInput('allowanceBonus', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Xăng xe</Label>
              <Input type="number" value={getInputValue(settings.allowanceFuel)} onChange={(e) => handleNumberInput('allowanceFuel', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tiền cơm</Label>
              <Input type="number" value={getInputValue(settings.allowanceLunch)} onChange={(e) => handleNumberInput('allowanceLunch', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Bảo Hiểm & Khấu Trừ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tỷ lệ đóng Bảo hiểm (%)</Label>
            <Input type="number" step="0.1" value={getInputValue(settings.insuranceRate)} onChange={(e) => handleNumberInput('insuranceRate', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đoàn phí</Label>
              <Input type="number" value={getInputValue(settings.unionFee)} onChange={(e) => handleNumberInput('unionFee', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Thuế TNCN</Label>
              <Input type="number" value={getInputValue(settings.incomeTax)} onChange={(e) => handleNumberInput('incomeTax', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
