
"use client";

import { DigitalClock } from '@/components/attendance/DigitalClock';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, LogOut, Clock, DollarSign, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  const { 
    activeSession, 
    sessions, 
    settings, 
    punchIn, 
    punchOut, 
    isLoaded 
  } = useAttendance();

  if (!isLoaded) return null;

  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.checkIn).toDateString() === today);
  
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.totalMinutes, 0);
  const todaySalary = todaySessions.reduce((acc, s) => acc + s.salary, 0);

  // Month calculation
  const now = new Date();
  const monthSessions = sessions.filter(s => {
    const d = new Date(s.checkIn);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthMinutes = monthSessions.reduce((acc, s) => acc + s.totalMinutes, 0);
  const monthSalary = monthSessions.reduce((acc, s) => acc + s.salary, 0);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${settings.currency}${val.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">TimeSnap</h1>
          <p className="text-muted-foreground text-sm">Offline Attendance Tracker</p>
        </div>
        {activeSession && (
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold uppercase text-green-500">Working Now</span>
          </div>
        )}
      </header>

      <DigitalClock />

      <div className="flex flex-col items-center justify-center py-8">
        <Button 
          size="lg"
          onClick={activeSession ? punchOut : punchIn}
          variant={activeSession ? "destructive" : "default"}
          className="w-48 h-48 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex flex-col space-y-2 border-8 border-background"
        >
          {activeSession ? (
            <>
              <LogOut className="w-12 h-12" />
              <span className="text-xl font-bold uppercase tracking-widest">Punch Out</span>
            </>
          ) : (
            <>
              <LogIn className="w-12 h-12" />
              <span className="text-xl font-bold uppercase tracking-widest">Punch In</span>
            </>
          )}
        </Button>
        
        {activeSession && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Checked in at</p>
            <p className="text-lg font-bold">
              {new Date(activeSession.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Today's Total</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black font-headline">{formatHours(todayMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Work Duration</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(todaySalary)}</p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
              <Progress value={Math.min((todayMinutes / 480) * 100, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">Daily goal: 8 hours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-accent/10 text-accent">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Monthly Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black font-headline">{formatHours(monthMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">{formatCurrency(monthSalary)}</p>
                  <p className="text-xs text-muted-foreground">Total Salary</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-muted text-muted-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Hourly Rate</p>
              <p className="text-lg font-bold">{formatCurrency(settings.hourlyRate)}/hour</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/settings">Adjust</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
