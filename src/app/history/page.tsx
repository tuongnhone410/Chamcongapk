"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { 
  History, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { WorkSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export default function HistoryPage() {
  const { 
    sessions, 
    isLoaded, 
    deleteSession, 
    updateSession, 
    batchAddSessions, 
    multiAddSessions, 
    clearAllHistory,
    restoreHistory,
    canUndo,
    undoCountdown,
    settings
  } = useAttendance();

  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const formatToLocalDatetime = (isoString: string | Date | null | undefined) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [multiData, setMultiData] = useState({
    startTime: '07:30',
    endTime: '20:30',
    multiplier: 1.0
  });

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const d = new Date(s.checkIn);
      return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [sessions, selectedMonth, selectedYear]);

  const completedSessions = useMemo(() => {
    return filteredSessions
      .filter(s => s.checkOut)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [filteredSessions]);

  const monthlySummary = useMemo(() => {
    return completedSessions.reduce((acc, s) => {
      const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
      const effectiveMinutes = s.totalMinutes > breakMinutes ? s.totalMinutes - breakMinutes : s.totalMinutes;
      const otMinutes = s.multiplier === 1.0 ? (effectiveMinutes > 510 ? effectiveMinutes - 480 : 0) : effectiveMinutes;
      return { 
        totalMinutesOT: acc.totalMinutesOT + Math.max(0, otMinutes), 
        totalSalary: acc.totalSalary + (s.salary || 0), 
        totalCount: acc.totalCount + 1 
      };
    }, { totalMinutesOT: 0, totalSalary: 0, totalCount: 0 });
  }, [completedSessions, settings]);

  const formatHours = (mins: number) => `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  const formatCurrency = (val: number) => `${Math.round(val).toLocaleString('vi-VN')}đ`;

  const handleUpdate = async () => {
    if (!editingSession) return;
    setIsProcessing(true);
    try {
      const checkIn = new Date(editingSession.checkIn);
      const checkOut = new Date(editingSession.checkOut!);
      const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      updateSession({ ...editingSession, totalMinutes: diffMinutes });
      setEditingSession(null);
      toast({ title: "Đã lưu" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiAdd = () => {
    if (!selectedDates?.length) return;
    setIsProcessing(true);
    multiAddSessions({ 
      dates: selectedDates, 
      startTime: multiData.startTime, 
      endTime: multiData.endTime, 
      multiplier: multiData.multiplier 
    });
    setSelectedDates([]);
    setShowMultiDialog(false);
    setIsProcessing(false);
    toast({ title: "Thành công" });
  };

  const changeMonth = (dir: number) => {
    let nextMonth = selectedMonth + dir;
    let nextYear = selectedYear;
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    else if (nextMonth < 1) { nextMonth = 12; nextYear--; }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  if (!isLoaded) return <div className="p-10 animate-pulse text-white">Đang tải...</div>;

  return (
    <div className="space-y-6 pb-24 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Lịch sử</h1>
        <div className="flex flex-wrap gap-2">
          {canUndo && (
            <Button onClick={restoreHistory} className="bg-green-600 text-[10px] font-black uppercase rounded-xl h-10 animate-pulse">
              KHÔI PHỤC ({undoCountdown}s)
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 rounded-xl">Xóa hết</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl text-red-500">XÁC NHẬN XÓA</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">Dữ liệu sẽ được xóa tạm thời trong 10 giây.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 rounded-xl">XÓA BỎ</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => setShowMultiDialog(true)} className="bg-primary text-black font-black rounded-xl">THÊM NHANH</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] uppercase font-black text-zinc-500">Tháng {selectedMonth}</p>
          <h4 className="text-2xl font-black">{monthlySummary.totalCount} ngày công</h4>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] uppercase font-black text-orange-500">Tổng OT</p>
          <h4 className="text-2xl font-black">{formatHours(monthlySummary.totalMinutesOT)}</h4>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <Button variant="ghost" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <p className="text-xl font-black">Tháng {selectedMonth} / {selectedYear}</p>
        <Button variant="ghost" onClick={() => changeMonth(1)}><ChevronRight /></Button>
      </div>

      <div className="space-y-4">
        {completedSessions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-bold uppercase text-xs">Không có dữ liệu tháng này</div>
        ) : (
          completedSessions.map((session) => (
            <Card key={session.id} className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] overflow-hidden">
              <div className="p-4 flex justify-between border-b border-zinc-800 bg-zinc-950/30">
                <span className="font-black text-sm">{new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingSession(session)}><Edit3 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black">Giờ làm</p>
                  <p className="text-xs font-bold">{new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.checkOut!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="text-lg font-black text-green-500">{formatCurrency(session.salary)}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[101]">
            <DialogHeader><DialogTitle className="font-black uppercase">Chỉnh sửa</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label>Giờ vào</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} />
              </div>
              <div className="space-y-1">
                <Label>Giờ ra</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
            </div>
            <DialogFooter><Button onClick={handleUpdate} disabled={isProcessing} className="w-full bg-primary text-black font-black h-12 rounded-xl">{isProcessing ? <Loader2 className="animate-spin" /> : 'LƯU THAY ĐỔI'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showMultiDialog && (
        <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[101]">
            <DialogHeader><DialogTitle className="font-black uppercase">Thêm nhanh</DialogTitle></DialogHeader>
            <Calendar mode="multiple" selected={selectedDates} onSelect={setSelectedDates} className="bg-zinc-900 rounded-2xl p-2 mx-auto" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                <Input type="time" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} className="bg-zinc-900 border-zinc-800 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                <Input type="time" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} className="bg-zinc-900 border-zinc-800 rounded-xl" />
              </div>
            </div>
            <Button onClick={handleMultiAdd} disabled={isProcessing} className="w-full bg-primary text-black font-black h-12 rounded-xl mt-4">{isProcessing ? <Loader2 className="animate-spin" /> : 'LƯU DỮ LIỆU'}</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}