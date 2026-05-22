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
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  CalendarPlus
} from 'lucide-react';
import { useState, useMemo } from 'react';
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
      toast({ title: "Đã cập nhật" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiAdd = async () => {
    if (!selectedDates?.length) return;
    setIsProcessing(true);
    try {
      await multiAddSessions({ 
        dates: selectedDates, 
        startTime: multiData.startTime, 
        endTime: multiData.endTime, 
        multiplier: multiData.multiplier 
      });
      setSelectedDates([]);
      setShowMultiDialog(false);
      toast({ title: "Đã thêm dữ liệu" });
    } finally {
      setIsProcessing(false);
    }
  };

  const changeMonth = (dir: number) => {
    let nextMonth = selectedMonth + dir;
    let nextYear = selectedYear;
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    else if (nextMonth < 1) { nextMonth = 12; nextYear--; }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  if (!isLoaded) return <div className="p-10 animate-pulse text-white text-center font-black uppercase tracking-widest">Đang tải lịch sử...</div>;

  return (
    <div className="space-y-6 pb-24 text-white px-1 sm:px-0">
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
              <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 rounded-xl h-10 font-bold">Xóa hết</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[110]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl text-red-500 uppercase">Xác nhận xóa</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">Toàn bộ dữ liệu của bạn sẽ được xóa tạm thời. Bạn có 10 giây để khôi phục.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-zinc-800">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 hover:bg-red-700 rounded-xl">ĐỒNG Ý XÓA</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => setShowMultiDialog(true)} className="bg-primary text-black font-black rounded-xl h-10 gap-2">
            <CalendarPlus className="w-4 h-4" /> THÊM NHANH
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Tháng {selectedMonth}</p>
          <h4 className="text-3xl font-black">{monthlySummary.totalCount} ngày công</h4>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] uppercase font-black text-orange-500 tracking-widest mb-1">Tổng OT</p>
          <h4 className="text-3xl font-black">{formatHours(monthlySummary.totalMinutesOT)}</h4>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-xl">
        <Button variant="ghost" className="hover:bg-zinc-800" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <p className="text-xl font-black tracking-tighter uppercase">Tháng {selectedMonth} / {selectedYear}</p>
        <Button variant="ghost" className="hover:bg-zinc-800" onClick={() => changeMonth(1)}><ChevronRight /></Button>
      </div>

      <div className="space-y-4">
        {completedSessions.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Không có dữ liệu trong tháng này</div>
        ) : (
          completedSessions.map((session) => (
            <Card key={session.id} className="bg-zinc-900 border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-lg border-2 border-transparent hover:border-zinc-800 transition-all">
              <div className="p-4 flex justify-between border-b border-zinc-800 bg-zinc-950/30">
                <span className="font-black text-sm uppercase text-zinc-400">{new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => setEditingSession(session)}><Edit3 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-500" onClick={() => deleteSession(session.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Giờ làm việc</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.checkOut!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-green-500">{formatCurrency(session.salary)}</p>
                  <span className="text-[9px] font-black uppercase text-zinc-600">x{session.multiplier.toFixed(1)}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[110] max-h-[90vh] overflow-y-auto w-[95vw] max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-xl">Chỉnh sửa phiên làm</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs font-bold uppercase">Thay đổi thông tin giờ làm việc</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào làm</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: e.target.value ? new Date(e.target.value).toISOString() : editingSession.checkIn})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ kết thúc</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleUpdate} disabled={isProcessing} className="w-full bg-primary text-black font-black h-14 rounded-2xl shadow-xl active:scale-95 transition-all text-lg">
                {isProcessing ? <Loader2 className="animate-spin" /> : 'LƯU THAY ĐỔI'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showMultiDialog && (
        <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[110] max-h-[90vh] overflow-y-auto w-[95vw] max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-xl">Thêm nhanh hàng loạt</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs font-bold uppercase">Chọn các ngày để áp dụng giờ làm việc</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-3xl p-2 border border-zinc-800">
                <Calendar mode="multiple" selected={selectedDates} onSelect={setSelectedDates} className="mx-auto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                  <Input type="time" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                  <Input type="time" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold" />
                </div>
              </div>
              <Button onClick={handleMultiAdd} disabled={isProcessing || !selectedDates?.length} className="w-full bg-primary text-black font-black h-14 rounded-2xl shadow-xl active:scale-95 transition-all text-lg">
                {isProcessing ? <Loader2 className="animate-spin" /> : `LƯU ${selectedDates?.length || 0} NGÀY CÔNG`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}