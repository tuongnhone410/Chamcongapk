
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Gift, Clock, Target } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold font-headline">Cấu Hình Lương</h1>
        <p className="text-muted-foreground text-sm">Thiết lập chi tiết dựa trên phiếu lương của bạn</p>
      </header>

      {/* Lương cơ bản & Hệ số */}
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
            <Input 
              type="number" 
              value={settings.baseMonthlySalary}
              onChange={(e) => updateSettings({...settings, baseMonthlySalary: parseFloat(e.target.value) || 0})}
              placeholder="Nhập lương cơ bản theo tháng..."
            />
            <p className="text-[10px] text-muted-foreground italic">Đây là phần lương cố định bạn nhận được mỗi tháng (chưa tính OT).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lương cơ bản / Giờ (OT)</Label>
              <Input 
                type="number" 
                value={settings.hourlyRate}
                onChange={(e) => updateSettings({...settings, hourlyRate: parseFloat(e.target.value) || 0})}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hệ số Chủ Nhật</Label>
              <Input 
                type="number" step="0.1"
                value={settings.sundayMultiplier}
                onChange={(e) => updateSettings({...settings, sundayMultiplier: parseFloat(e.target.value) || 2.0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Hệ số Ngày Lễ</Label>
              <Input 
                type="number" step="0.1"
                value={settings.holidayMultiplier}
                onChange={(e) => updateSettings({...settings, holidayMultiplier: parseFloat(e.target.value) || 3.0})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mục tiêu thu nhập */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Mục Tiêu Thu Nhập</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mục tiêu thực lĩnh hàng tháng</Label>
            <Input 
              type="number" 
              value={settings.monthlyTarget}
              onChange={(e) => updateSettings({...settings, monthlyTarget: parseFloat(e.target.value) || 0})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phụ cấp hàng tháng */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Phụ Cấp Cố Định</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nhà ở</Label>
              <Input type="number" value={settings.allowanceHousing} onChange={(e) => updateSettings({...settings, allowanceHousing: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Xăng xe</Label>
              <Input type="number" value={settings.allowanceFuel} onChange={(e) => updateSettings({...settings, allowanceFuel: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Tiền cơm</Label>
              <Input type="number" value={settings.allowanceLunch} onChange={(e) => updateSettings({...settings, allowanceLunch: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Chuyên cần</Label>
              <Input type="number" value={settings.allowanceAttendance} onChange={(e) => updateSettings({...settings, allowanceAttendance: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảo hiểm & Khấu trừ */}
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
            <Input type="number" step="0.1" value={settings.insuranceRate} onChange={(e) => updateSettings({...settings, insuranceRate: parseFloat(e.target.value) || 0})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đoàn phí</Label>
              <Input type="number" value={settings.unionFee} onChange={(e) => updateSettings({...settings, unionFee: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Thuế TNCN</Label>
              <Input type="number" value={settings.incomeTax} onChange={(e) => updateSettings({...settings, incomeTax: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
