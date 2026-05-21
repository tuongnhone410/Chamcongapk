
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Moon, Sun, Info, CalendarClock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold font-headline">Cài Đặt</h1>
        <p className="text-muted-foreground text-sm">Cá nhân hóa trải nghiệm theo dõi của bạn</p>
      </header>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Thù Lao & Chu Kỳ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Lương Theo Giờ</Label>
            <div className="relative">
              <Input 
                id="hourlyRate" 
                type="number" 
                className="pr-8"
                value={settings.hourlyRate}
                onChange={(e) => updateSettings({...settings, hourlyRate: parseFloat(e.target.value) || 0})}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                {settings.currency}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Đơn Vị Tiền Tệ</Label>
            <Select 
              value={settings.currency} 
              onValueChange={(val) => updateSettings({...settings, currency: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại tiền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="₫">VND (₫)</SelectItem>
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <CalendarClock className="w-4 h-4" />
              <span>Ngày Chốt Lương Hàng Tháng</span>
            </Label>
            <Select 
              value={settings.payday.toString()} 
              onValueChange={(val) => updateSettings({...settings, payday: parseInt(val)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn ngày" />
              </SelectTrigger>
              <SelectContent>
                {daysInMonth.map(day => (
                  <SelectItem key={day} value={day.toString()}>Ngày {day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Kỳ lương sẽ được tính từ ngày này tháng trước đến trước ngày này tháng sau.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Sun className="w-5 h-5 text-primary" />
            <span>Hiển Thị</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Chế Độ Tối</Label>
              <p className="text-xs text-muted-foreground">Điều chỉnh giao diện cho môi trường ánh sáng yếu</p>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch 
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSettings({...settings, darkMode: checked})}
              />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-primary/5 border-none">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          Tất cả dữ liệu của bạn được lưu trữ cục bộ trong bộ nhớ cache của trình duyệt. Việc xóa dữ liệu trình duyệt sẽ xóa tất cả các phiên làm việc.
        </AlertDescription>
      </Alert>

      <div className="pt-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
          TimeSnap v1.1.0
        </p>
      </div>
    </div>
  );
}
