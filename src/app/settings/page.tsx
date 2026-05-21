
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Moon, Sun, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useAttendance();

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground text-sm">Personalize your tracking experience</p>
      </header>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Remuneration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                {settings.currency}
              </span>
              <Input 
                id="hourlyRate" 
                type="number" 
                className="pl-8"
                value={settings.hourlyRate}
                onChange={(e) => updateSettings({...settings, hourlyRate: parseFloat(e.target.value) || 0})}
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Base rate used for automatic salary calculation
            </p>
          </div>

          <div className="space-y-2">
            <Label>Currency Symbol</Label>
            <Select 
              value={settings.currency} 
              onValueChange={(val) => updateSettings({...settings, currency: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
                <SelectItem value="£">GBP (£)</SelectItem>
                <SelectItem value="₫">VND (₫)</SelectItem>
                <SelectItem value="¥">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Sun className="w-5 h-5 text-primary" />
            <span>Display</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Adjust the interface for low-light environments</p>
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
          All your data is stored locally in your browser cache. Clearing your browser data will delete all work sessions.
        </AlertDescription>
      </Alert>

      <div className="pt-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
          TimeSnap v1.0.0
        </p>
      </div>
    </div>
  );
}
