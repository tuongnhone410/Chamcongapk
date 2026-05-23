
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
  DollarSign,
  Download,
  Upload,
  PlayCircle
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
import { type DateRange } from "react-day-picker";

export default function HistoryPage() {
  const { 
    sessions, 
    activeSession,
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
  const [batchRange, setBatchRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });
  const [batchData, setBatchData] = useState({
    startTime: '07:30',
    endTime: '20:30',
    excludeSundays: true
  });

  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [multiData, setMultiData] = useState({
    startTime: '07:30',
    endTime: '20:30'
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

  const currentActiveSession = useMemo(() => {
    if (!activeSession) return null;
    const d = new Date(activeSession.checkIn);
    if ((d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear) {
      return activeSession;
    }
    return null;
  }, [activeSession, selectedMonth, selectedYear]);

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
    setIsProcessing(true);
    try {
      const checkIn = new Date(editingSession.checkIn);
      const checkOut = editingSession.checkOut ? new Date(editingSession.checkOut) : null;

      if (checkOut && checkOut <= checkIn) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Giờ ra phải sau giờ vào." });
        return;
      }

      const diffMs = checkOut ? (checkOut.getTime() - checkIn.getTime()) : 0;
      const diffMinutes = Math.floor(diffMs / 60000);

      await updateSession({
        ...editingSession,
        totalMinutes: diffMinutes,
      });
      setEditingSession(null);
      toast({ title: "Đã lưu", description: "Cập nhật thành công." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAdd = async () => {
    if (!batchRange?.from || !batchRange?.to) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn dải ngày." });
      return;
    }
    setIsProcessing(true);
    try {
      await batchAddSessions({
        startDate: batchRange.from.toISOString().split('T')[0],
        endDate: batchRange.to.toISOString().split('T')[0],
        startTime: batchData.startTime,
        endTime: batchData.endTime,
        multiplier: -1, // Tự động nhận diện
        excludeSundays: batchData.excludeSundays
      });
      setShowBatchDialog(false);
      toast({ title: "Thành công", description: "Đã đồng bộ dữ liệu hàng loạt." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiAdd = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn ít nhất 1 ngày." });
      return;
    }
    setIsProcessing(true);
    try {
      await multiAddSessions({
        dates: selectedDates,
        startTime: multiData.startTime,
        endTime: multiData.endTime,
        multiplier: -1 // Tự động nhận diện
      });
      setSelectedDates([]);
      setShowMultiDialog(false);
      toast({ title: "Thành công", description: "Đã thêm các phiên công thành công." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsProcessing(true);
      try {
        const content = event.target?.result as string;
        await importFromCSV(content);
        toast({ title: "Thành công", description: "Đã nhập dữ liệu từ CSV." });
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi", description: "Tệp không hợp lệ." });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeMonth = (dir: number) => {
    let nextMonth = selectedMonth + dir;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear--;
    }
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
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 text-white animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Lịch sử công</h1>
        </div>
        
        <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
          <div className="flex flex-wrap gap-2">
            {canUndo && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={restoreHistory}
                disabled={isProcessing}
                className="gap-2 text-[10px] rounded-xl h-9 border-green-500/50 bg-green-500/10 text-green-500 font-black animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                KHÔI PHỤC ({undoCountdown}s)
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={completedSessions.length === 0 || isProcessing}
                  className="gap-2 text-[10px] rounded-xl h-9 border-red-500/50 bg-red-500/10 text-red-500 font-black"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  XÓA HẾT
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-xl text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" /> XÁC NHẬN
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400 font-bold">
                    Xóa tất cả dữ liệu tháng này? Bạn có 10 giây để khôi phục sau khi xóa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 rounded-xl font-black">XÓA</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 bg-primary font-black text-black">
                  <CheckSquare className="w-4 h-4" /> CHỌN NGÀY OT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Thêm theo ngày</DialogTitle>
                  <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Tự động nhận diện hệ số Lễ/CN/Thường</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={setSelectedDates}
                      className="w-full"
                      disabled={(date) => sessionDatesSet.has(date.toDateString())}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleMultiAdd} disabled={isProcessing} className="bg-primary text-black rounded-xl h-12 font-black w-full">
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'LƯU DỮ LIỆU'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 bg-indigo-600 font-black text-white">
                  <Layers className="w-4 h-4" /> ĐỒNG BỘ LOẠT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Đồng bộ hàng loạt</DialogTitle>
                  <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Hệ số tự động theo lịch</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <Calendar
                      mode="range"
                      selected={batchRange}
                      onSelect={setBatchRange}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full" value={batchData.startTime} onChange={(e) => setBatchData({...batchData, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full" value={batchData.endTime} onChange={(e) => setBatchData({...batchData, endTime: e.target.value})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBatchAdd} disabled={isProcessing} className="bg-indigo-600 text-white rounded-xl h-12 font-black w-full">
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'ĐỒNG BỘ NGAY'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-4 flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[9px] uppercase font-black text-zinc-500">Số ngày công</p>
              <h4 className="text-xl font-black">{monthlySummary.totalCount} ngày</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-4 flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-[9px] uppercase font-black text-zinc-500">Tổng OT</p>
              <h4 className="text-xl font-black text-orange-500">{formatHours(monthlySummary.totalMinutesOT)}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-4 flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-[9px] uppercase font-black text-zinc-500">Lương OT</p>
              <h4 className="text-xl font-black text-green-500">{formatCurrency(monthlySummary.totalSalary)}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <div className="text-center">
          <p className="text-[9px] font-black uppercase text-primary">THÁNG {selectedMonth} / {selectedYear}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRight /></Button>
      </div>

      <div className="space-y-3">
        {completedSessions.map((session) => {
          const metrics = getSessionOTMetrics(session);
          return (
            <Card key={session.id} className="bg-zinc-900 rounded-[1.5rem] border border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white">{new Date(session.checkIn).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                  <p className="text-[11px] font-bold text-zinc-500">
                    {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} → {session.checkOut ? new Date(session.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-500">{formatCurrency(metrics.salary)}</p>
                  <p className="text-[9px] font-black text-orange-500 uppercase">{formatHours(metrics.otMinutes)} OT</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => deleteSession(session.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => setEditingSession(session)}><Edit3 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem]">
            <DialogHeader><DialogTitle className="font-black uppercase">Chỉnh sửa</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} />
              <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 rounded-xl" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate} disabled={isProcessing} className="bg-primary text-black rounded-xl h-12 font-black w-full">LƯU</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
