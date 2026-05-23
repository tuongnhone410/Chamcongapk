
"use client";

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Trash2, 
  Edit3, 
  Clock, 
  Calendar as CalendarIcon, 
  Layers, 
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  DollarSign,
  Info
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
import { type DateRange } from "react-day-picker";
import { format } from 'date-fns';

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

  const displaySessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [filteredSessions]);

  const getSessionOTMetrics = (session: WorkSession) => {
    if (!session.checkOut) return { otMinutes: 0, salary: 0 };
    const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
    const effectiveMinutes = session.totalMinutes > breakMinutes 
      ? session.totalMinutes - breakMinutes 
      : session.totalMinutes;

    const otMinutes = session.multiplier === 1.0 
      ? (effectiveMinutes > 480 ? effectiveMinutes - 480 : 0) 
      : effectiveMinutes;

    return {
      otMinutes: otMinutes > 0 ? otMinutes : 0,
      salary: session.salary || 0
    };
  };

  const monthlySummary = useMemo(() => {
    return displaySessions.reduce((acc, s) => {
      const metrics = getSessionOTMetrics(s);
      return {
        totalMinutesOT: acc.totalMinutesOT + metrics.otMinutes,
        totalSalary: acc.totalSalary + metrics.salary,
        totalCount: acc.totalCount + (s.checkOut ? 1 : 0)
      };
    }, { totalMinutesOT: 0, totalSalary: 0, totalCount: 0 });
  }, [displaySessions]);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('vi-VN')}đ`;
  };

  const handleUpdate = () => {
    if (!editingSession) return;
    updateSession(editingSession);
    setEditingSession(null);
    toast({ title: "Đã lưu", description: "Cập nhật thành công." });
  };

  const handleBatchAdd = () => {
    if (!batchRange?.from || !batchRange?.to) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn dải ngày." });
      return;
    }
    
    // Sử dụng format của date-fns để lấy ngày địa phương, tránh lỗi lệch ngày do múi giờ UTC
    batchAddSessions({
      startDate: format(batchRange.from, 'yyyy-MM-dd'),
      endDate: format(batchRange.to, 'yyyy-MM-dd'),
      startTime: batchData.startTime,
      endTime: batchData.endTime,
      multiplier: -1,
      excludeSundays: batchData.excludeSundays
    });
    
    setShowBatchDialog(false);
    toast({ title: "Đã gửi yêu cầu", description: "Đang đẩy dữ liệu lên server..." });
  };

  const handleMultiAdd = () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn ít nhất 1 ngày." });
      return;
    }
    
    multiAddSessions({
      dates: selectedDates,
      startTime: multiData.startTime,
      endTime: multiData.endTime,
      multiplier: -1
    });
    
    setShowMultiDialog(false);
    setSelectedDates([]);
    toast({ title: "Đã gửi yêu cầu", description: "Phiên làm việc đang được khởi tạo." });
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
      <div className="space-y-6 animate-pulse">
        <header className="h-10 bg-zinc-900 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-[1.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 w-full overflow-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate">Lịch sử công</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {canUndo && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={restoreHistory}
              className="gap-2 text-[10px] rounded-xl h-9 border-green-500/50 bg-green-500/10 text-green-500 font-black shrink-0"
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
                disabled={displaySessions.length === 0}
                className="gap-2 text-[10px] rounded-xl h-9 border-red-500/50 bg-red-500/10 text-red-500 font-black shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                XÓA HẾT
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] w-[92vw] max-w-sm outline-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-lg text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> XÁC NHẬN
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400 text-xs font-bold leading-relaxed">
                  Xóa toàn bộ dữ liệu tháng hiện tại? Bạn có 10 giây để hoàn tác sau khi bấm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <AlertDialogCancel className="rounded-xl font-bold h-11">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 rounded-xl font-black h-11">XÓA NGAY</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.25rem] min-w-0">
          <CardContent className="p-3.5 flex items-center gap-3">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] uppercase font-black text-zinc-500 truncate tracking-tight">Ngày công</p>
              <h4 className="text-base font-black truncate">{monthlySummary.totalCount}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.25rem] min-w-0">
          <CardContent className="p-3.5 flex items-center gap-3">
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] uppercase font-black text-zinc-500 truncate tracking-tight">Tổng OT</p>
              <h4 className="text-base font-black text-orange-500 truncate">{formatHours(monthlySummary.totalMinutesOT)}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800 rounded-[1.25rem] min-w-0 col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] uppercase font-black text-zinc-500 truncate tracking-tight">Lương OT</p>
              <h4 className="text-base font-black text-green-500 truncate">{formatCurrency(monthlySummary.totalSalary)}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 text-[10px] rounded-xl h-12 bg-primary font-black text-black shadow-lg">
              <CheckSquare className="w-4 h-4" /> CHỌN NGÀY OT
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[94vw] max-w-md bg-zinc-950 border-zinc-800 text-white rounded-[2rem] p-5 max-h-[90vh] overflow-y-auto outline-none">
            <DialogHeader>
              <DialogTitle className="font-black text-lg uppercase tracking-tighter text-primary">Thêm phiên OT</DialogTitle>
              <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Hệ số tự động nhận diện</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-zinc-900 rounded-2xl p-2 border border-zinc-800">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="w-full"
                  disabled={(date) => sessionDatesSet.has(date.toDateString())}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-zinc-500">Giờ vào</Label>
                  <input type="time" className="bg-zinc-900 border border-zinc-800 h-10 font-bold rounded-xl px-3 text-white w-full text-sm outline-none" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-zinc-500">Giờ ra</Label>
                  <input type="time" className="bg-zinc-900 border border-zinc-800 h-10 font-bold rounded-xl px-3 text-white w-full text-sm outline-none" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-primary/10 p-3 rounded-xl border border-primary/20">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-zinc-400">
                  Để trống <span className="text-primary">Giờ ra</span> nếu bạn muốn ghi nhận là đang làm việc (để đồng bộ với Trang chủ).
                </p>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button onClick={handleMultiAdd} className="bg-primary text-black rounded-xl h-12 font-black w-full active:scale-95 transition-all">
                XÁC NHẬN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 text-[10px] rounded-xl h-12 bg-indigo-600 font-black text-white shadow-lg">
              <Layers className="w-4 h-4" /> ĐỒNG BỘ LOẠT
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[94vw] max-w-md bg-zinc-950 border-zinc-800 text-white rounded-[2rem] p-5 max-h-[90vh] overflow-y-auto outline-none">
            <DialogHeader>
              <DialogTitle className="font-black text-lg uppercase tracking-tighter text-primary">Đồng bộ hàng loạt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-zinc-900 rounded-2xl p-2 border border-zinc-800">
                <Calendar mode="range" selected={batchRange} onSelect={setBatchRange} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-zinc-500">Giờ vào</Label>
                  <input type="time" className="bg-zinc-900 border border-zinc-800 h-10 font-bold rounded-xl px-3 text-white w-full text-sm outline-none" value={batchData.startTime} onChange={(e) => setBatchData({...batchData, startTime: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-zinc-500">Giờ ra</Label>
                  <input type="time" className="bg-zinc-900 border border-zinc-800 h-10 font-bold rounded-xl px-3 text-white w-full text-sm outline-none" value={batchData.endTime} onChange={(e) => setBatchData({...batchData, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                <Checkbox 
                  id="excludeSundays" 
                  checked={batchData.excludeSundays} 
                  onCheckedChange={(checked) => setBatchData({...batchData, excludeSundays: !!checked})} 
                />
                <label htmlFor="excludeSundays" className="text-xs font-bold text-zinc-400 cursor-pointer select-none">
                  Bỏ qua ngày Chủ Nhật
                </label>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button onClick={handleBatchAdd} className="bg-indigo-600 text-white rounded-xl h-12 font-black w-full active:scale-95 transition-all">
                ĐỒNG BỘ NGAY
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <div className="text-center min-w-0">
          <p className="text-[10px] font-black uppercase text-primary tracking-widest truncate">THÁNG {selectedMonth} / {selectedYear}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(1)}><ChevronRight /></Button>
      </div>

      <div className="space-y-3 min-h-0 overflow-visible pb-4">
        {displaySessions.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-widest animate-pulse">
            Chưa có dữ liệu tháng này
          </div>
        ) : (
          displaySessions.map((session) => {
            const metrics = getSessionOTMetrics(session);
            const isActive = !session.checkOut;
            return (
              <Card key={session.id} className={`bg-zinc-900 rounded-[1.25rem] border ${isActive ? 'border-primary/50' : 'border-zinc-800'} overflow-hidden group`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-white">{new Date(session.checkIn).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                      {isActive && <Badge className="h-4 text-[7px] font-black bg-primary text-black">ĐANG LÀM</Badge>}
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 truncate">
                      {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} → {session.checkOut ? new Date(session.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '??:??'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isActive ? 'text-primary' : 'text-green-500'}`}>{isActive ? '...' : formatCurrency(metrics.salary)}</p>
                    {!isActive && <p className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">{formatHours(metrics.otMinutes)} OT</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-red-500" onClick={() => deleteSession(session.id)}><Trash2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-primary" onClick={() => setEditingSession(session)}><Edit3 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent className="w-[94vw] max-w-sm bg-zinc-950 border-zinc-800 text-white rounded-[2rem] outline-none">
            <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter">Chỉnh sửa phiên công</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-zinc-500">Giờ vào</Label>
                <input type="datetime-local" className="bg-zinc-900 border border-zinc-800 rounded-xl h-11 font-bold text-sm px-4 text-white w-full outline-none" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-zinc-500">Giờ ra</Label>
                <input type="datetime-local" className="bg-zinc-900 border border-zinc-800 rounded-xl h-11 font-bold text-sm px-4 text-white w-full outline-none" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate} className="bg-primary text-black rounded-xl h-12 font-black w-full active:scale-95 transition-all">LƯU THAY ĐỔI</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
