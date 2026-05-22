
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { 
  History, 
  Trash2, 
  Edit3, 
  Clock, 
  Calendar as CalendarIcon, 
  Zap, 
  Layers, 
  X,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  DollarSign
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { WorkSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
    importFromCSV,
    clearAllHistory,
    restoreHistory,
    canUndo,
    undoCountdown,
    settings, 
    exportToCSV 
  } = useAttendance();

  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchData, setBatchData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: '07:30',
    endTime: '20:30',
    multiplier: -1,
    excludeSundays: true
  });

  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [multiData, setMultiData] = useState({
    startTime: '07:30',
    endTime: '20:30',
    multiplier: 1.0
  });

  const sessionDatesSet = useMemo(() => {
    return new Set(sessions.map(s => new Date(s.checkIn).toDateString()));
  }, [sessions]);

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

  const getSessionOTMetrics = (session: WorkSession) => {
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const effectiveMinutes = session.totalMinutes > breakMinutes 
      ? session.totalMinutes - breakMinutes 
      : session.totalMinutes;

    const otMinutes = session.multiplier === 1.0 
      ? (effectiveMinutes > 510 ? effectiveMinutes - 480 : 0) 
      : effectiveMinutes;

    return {
      otMinutes: otMinutes > 0 ? otMinutes : 0,
      salary: session.salary || 0
    };
  };

  const monthlySummary = useMemo(() => {
    return completedSessions.reduce((acc, s) => {
      const metrics = getSessionOTMetrics(s);
      return {
        totalMinutesOT: acc.totalMinutesOT + metrics.otMinutes,
        totalSalary: acc.totalSalary + metrics.salary,
        totalCount: acc.totalCount + 1
      };
    }, { totalMinutesOT: 0, totalSalary: 0, totalCount: 0 });
  }, [completedSessions]);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('vi-VN')}đ`;
  };

  const handleUpdate = async () => {
    if (!editingSession) return;
    if (!editingSession.checkIn || !editingSession.checkOut) {
      toast({ variant: 'destructive', title: "Dữ liệu thiếu", description: "Vui lòng nhập đầy đủ thời gian." });
      return;
    }
    const checkIn = new Date(editingSession.checkIn);
    const checkOut = new Date(editingSession.checkOut);
    if (checkOut <= checkIn) {
      toast({ variant: 'destructive', title: "Lỗi", description: "Giờ ra phải sau giờ vào." });
      return;
    }
    setIsProcessing(true);
    try {
      const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      await updateSession({ ...editingSession, totalMinutes: diffMinutes });
      setEditingSession(null);
      toast({ title: "Đã lưu" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAdd = () => {
    setIsProcessing(true);
    setShowBatchDialog(false);
    batchAddSessions(batchData).finally(() => setIsProcessing(false));
  };

  const handleMultiAdd = () => {
    if (!selectedDates || selectedDates.length === 0) return;
    setIsProcessing(true);
    setShowMultiDialog(false);
    multiAddSessions({ 
      dates: selectedDates, 
      startTime: multiData.startTime, 
      endTime: multiData.endTime, 
      multiplier: multiData.multiplier 
    }).finally(() => {
      setSelectedDates([]);
      setIsProcessing(false);
    });
  };

  const changeMonth = (dir: number) => {
    let nextMonth = selectedMonth + dir;
    let nextYear = selectedYear;
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    else if (nextMonth < 1) { nextMonth = 12; nextYear--; }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 pb-24 animate-pulse">
        <header className="h-10 bg-zinc-900 rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-[1.5rem]" />)}
        </div>
        <div className="h-14 bg-zinc-900 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Lịch sử công</h1>
        <div className="flex flex-wrap gap-2">
          {canUndo && (
            <Button size="sm" variant="outline" onClick={restoreHistory} className="gap-2 text-xs rounded-xl h-10 border-green-500/50 bg-green-500/10 text-green-500 font-black animate-pulse">
              <RotateCcw className="w-4 h-4" /> KHÔI PHỤC ({undoCountdown}s)
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={completedSessions.length === 0} className="gap-2 text-xs rounded-xl h-10 border-red-500/30 bg-zinc-900 text-red-500 font-bold">
                <Trash2 className="w-3.5 h-3.5" /> Xóa hết
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> XÁC NHẬN XÓA
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400 font-bold">
                  Hành động này sẽ xóa tất cả phiên của tháng {selectedMonth}. Bạn có 10 giây để KHÔI PHỤC.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="rounded-xl font-bold border-zinc-800 text-white">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 rounded-xl font-black text-white">XÓA BỎ</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 text-xs rounded-xl h-10 bg-primary font-black text-black">
                <CheckSquare className="w-4 h-4" /> CHỌN NGÀY OT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[95vh] overflow-y-auto w-[95vw] max-w-[400px] p-4">
              <DialogHeader>
                <DialogTitle className="font-black text-xl uppercase text-primary text-center">Thêm theo ngày</DialogTitle>
                <DialogDescription className="text-[10px] text-zinc-500 font-bold text-center">CHỈ ÁP DỤNG CHO NGÀY CHƯA CÓ DỮ LIỆU</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-zinc-900 rounded-2xl p-1 border border-zinc-800">
                  <Calendar 
                    mode="multiple" 
                    selected={selectedDates} 
                    onSelect={setSelectedDates} 
                    className="mx-auto" 
                    disabled={(date) => sessionDatesSet.has(date.toDateString())} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-zinc-500">Vào</Label><input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 w-full text-white" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-zinc-500">Ra</Label><input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 w-full text-white" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} /></div>
                </div>
                <Select value={multiData.multiplier.toString()} onValueChange={(v) => setMultiData({...multiData, multiplier: parseFloat(v)})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 font-bold rounded-xl text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="1.0">Ngày thường</SelectItem>
                    <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (x{settings.sundayMultiplier})</SelectItem>
                    <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (x{settings.holidayMultiplier})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-2"><Button onClick={handleMultiAdd} className="bg-primary text-black rounded-xl h-14 font-black w-full">LƯU DỮ LIỆU</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5 flex items-center space-x-4">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <div><p className="text-[10px] uppercase font-black text-zinc-500">Ngày công</p><h4 className="text-2xl font-black">{monthlySummary.totalCount} phiên</h4></div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5 flex items-center space-x-4">
          <Clock className="w-6 h-6 text-orange-500" />
          <div><p className="text-[10px] uppercase font-black text-zinc-500">Tổng OT</p><h4 className="text-2xl font-black text-orange-500">{formatHours(monthlySummary.totalMinutesOT)}</h4></div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5 flex items-center space-x-4">
          <DollarSign className="w-6 h-6 text-green-500" />
          <div><p className="text-[10px] uppercase font-black text-zinc-500">Lương OT</p><h4 className="text-2xl font-black text-green-500">{formatCurrency(monthlySummary.totalSalary)}</h4></div>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <Button variant="ghost" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <div className="text-center"><p className="text-[10px] font-black uppercase text-primary">Tháng {selectedMonth} / {selectedYear}</p></div>
        <Button variant="ghost" onClick={() => changeMonth(1)}><ChevronRight /></Button>
      </div>

      <div className="space-y-4">
        {completedSessions.map((session) => (
          <Card key={session.id} className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/30 text-xs font-black">
                <span>{new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-500" onClick={() => deleteSession(session.id)}><Trash2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-primary" onClick={() => setEditingSession(session)}><Edit3 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 text-xs">
                <div><p className="text-[10px] text-zinc-500 uppercase font-black">Giờ</p><p className="font-bold">{new Date(session.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - {new Date(session.checkOut!).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p></div>
                <div><p className="text-[10px] text-orange-500 uppercase font-black">OT</p><p className="font-black text-orange-500">{formatHours(getSessionOTMetrics(session).otMinutes)}</p></div>
                <div className="text-right"><p className="text-[10px] text-green-500 uppercase font-black">Lương</p><p className="font-black text-green-500 text-sm">{formatCurrency(session.salary)}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] w-[95vw] max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-black uppercase text-center">Chỉnh sửa</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-zinc-500">Vào</Label><Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl font-bold text-white" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-zinc-500">Ra</Label><Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl font-bold text-white" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} /></div>
              <Select value={editingSession.multiplier.toString()} onValueChange={(v) => setEditingSession({...editingSession, multiplier: parseFloat(v)})}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 rounded-xl font-bold text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white"><SelectItem value="1.0">Ngày thường</SelectItem><SelectItem value={settings.sundayMultiplier.toString()}>OT CN (x{settings.sundayMultiplier})</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter><Button onClick={handleUpdate} className="bg-primary text-black rounded-xl h-14 font-black w-full">LƯU THAY ĐỔI</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
