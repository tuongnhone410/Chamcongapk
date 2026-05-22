
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
  DollarSign,
  Download,
  Upload
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
      toast({
        variant: 'destructive',
        title: "Dữ liệu thiếu",
        description: "Vui lòng nhập đầy đủ thời gian vào và ra."
      });
      return;
    }

    const checkIn = new Date(editingSession.checkIn);
    const checkOut = new Date(editingSession.checkOut);

    if (checkOut <= checkIn) {
      toast({
        variant: 'destructive',
        title: "Thời gian không hợp lệ",
        description: "Giờ ra phải xảy ra sau giờ vào."
      });
      return;
    }

    setIsProcessing(true);
    try {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffMinutes = Math.floor(diffMs / 1000 / 60);

      await updateSession({
        ...editingSession,
        totalMinutes: diffMinutes,
      });
      setEditingSession(null);
      toast({ title: "Đã lưu", description: "Thay đổi của phiên công đã được cập nhật thành công." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: "Không thể lưu dữ liệu thay đổi."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAdd = () => {
    if (!batchRange?.from || !batchRange?.to) {
      toast({ variant: "destructive", title: "Thiếu ngày", description: "Vui lòng chọn dải ngày trên lịch." });
      return;
    }
    setIsProcessing(true);
    setShowBatchDialog(false);
    try {
      batchAddSessions({
        startDate: batchRange.from.toISOString().split('T')[0],
        endDate: batchRange.to.toISOString().split('T')[0],
        startTime: batchData.startTime,
        endTime: batchData.endTime,
        multiplier: batchData.multiplier,
        excludeSundays: batchData.excludeSundays
      });
      toast({ title: "Thành công", description: "Hệ thống đang đồng bộ dữ liệu dải ngày..." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiAdd = () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast({ variant: "destructive", title: "Lỗi chọn ngày", description: "Vui lòng chọn ít nhất 1 ngày trên lịch." });
      return;
    }
    setIsProcessing(true);
    setShowMultiDialog(false);
    try {
      multiAddSessions({
        dates: selectedDates,
        startTime: multiData.startTime,
        endTime: multiData.endTime,
        multiplier: multiData.multiplier
      });
      setSelectedDates([]);
      toast({ title: "Thành công", description: `Đã xử lý thêm ${selectedDates.length} phiên làm việc.` });
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
        toast({ title: "Nhập thành công", description: "Dữ liệu từ tệp CSV đã được khôi phục." });
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi nhập tệp", description: "Định dạng tệp CSV không hợp lệ." });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    setIsProcessing(true);
    try {
      await clearAllHistory();
      toast({ 
        title: "Đã xóa tất cả", 
        description: "Bạn có 10 giây để nhấn nút khôi phục.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      await restoreHistory();
      toast({ title: "Đã phục hồi", description: "Toàn bộ dữ liệu của bạn đã quay trở lại." });
    } finally {
      setIsProcessing(false);
    }
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
        <div className="h-14 bg-zinc-900 rounded-2xl w-full" />
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-[1.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-white">
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
                onClick={handleRestore}
                disabled={isProcessing}
                className="gap-2 text-[10px] rounded-xl h-9 border-green-500/50 bg-green-500/10 text-green-500 font-black animate-pulse transition-all"
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
                  className="gap-2 text-[10px] rounded-xl h-9 border-red-500/50 bg-red-500/10 text-red-500 font-black hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  XÓA HẾT
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100] max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-xl text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    XÁC NHẬN XÓA TOÀN BỘ
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400 font-bold">
                    Hành động này sẽ xóa tất cả dữ liệu của tháng hiện tại. Bạn sẽ có 10 giây để nhấn nút KHÔI PHỤC trước khi dữ liệu bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold border-zinc-800 text-white hover:bg-zinc-900 transition-all">Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-500 rounded-xl font-black text-white transition-all">XÓA BỎ</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 bg-primary hover:bg-primary/90 font-black shadow-lg text-black transition-all">
                  <CheckSquare className="w-4 h-4" />
                  CHỌN NGÀY OT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Thêm nhanh theo ngày</DialogTitle>
                  <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Chỉ áp dụng cho những ngày chưa có dữ liệu</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 w-full overflow-hidden">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={setSelectedDates}
                      className="w-full"
                      disabled={(date) => sessionDatesSet.has(date.toDateString())}
                    />
                    {selectedDates && selectedDates.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-zinc-800">
                        <p className="text-[10px] font-black uppercase text-primary mb-2">Ngày đã chọn ({selectedDates.length}):</p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {selectedDates.map((date, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold">
                              {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              <X className="w-2.5 h-2.5 ml-1 cursor-pointer hover:text-red-500" onClick={() => setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()))} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full focus:outline-none focus:border-zinc-700" value={multiData.startTime} onChange={(e) => setMultiData({...multiData, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full focus:outline-none focus:border-zinc-700" value={multiData.endTime} onChange={(e) => setMultiData({...multiData, endTime: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Loại hình</Label>
                    <Select value={multiData.multiplier.toString()} onValueChange={(v) => setMultiData({...multiData, multiplier: parseFloat(v)})}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 font-bold rounded-xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="1.0">Ngày thường (Tự tính OT)</SelectItem>
                        <SelectItem value={settings.sundayMultiplier.toString()}>OT CN (x{settings.sundayMultiplier})</SelectItem>
                        <SelectItem value={settings.holidayMultiplier.toString()}>OT Lễ (x{settings.holidayMultiplier})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button onClick={handleMultiAdd} disabled={isProcessing} className="bg-primary hover:bg-primary/90 text-black rounded-xl h-12 font-black shadow-xl w-full transition-all">
                    LƯU DỮ LIỆU
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 bg-indigo-600 hover:bg-indigo-500 font-black text-white shadow-lg transition-all">
                  <Layers className="w-4 h-4" />
                  THÊM HÀNG LOẠT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Đồng bộ hàng loạt</DialogTitle>
                  <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Chọn khoảng ngày trên lịch để đồng bộ nhanh</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 w-full overflow-hidden">
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
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full focus:outline-none focus:border-zinc-700" value={batchData.startTime} onChange={(e) => setBatchData({...batchData, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                      <input type="time" className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 text-white w-full focus:outline-none focus:border-zinc-700" value={batchData.endTime} onChange={(e) => setBatchData({...batchData, endTime: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Hệ số lương</Label>
                    <Select value={batchData.multiplier.toString()} onValueChange={(v) => setBatchData({...batchData, multiplier: parseFloat(v)})}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 font-bold rounded-xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="-1">Tự động (CN/Lễ)</SelectItem>
                        <SelectItem value="1.0">Ngày thường</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                    <Checkbox id="excludeSundays" checked={batchData.excludeSundays} onCheckedChange={(checked) => setBatchData({...batchData, excludeSundays: !!checked})} />
                    <Label htmlFor="excludeSundays" className="text-xs font-black uppercase text-zinc-400">Bỏ qua Chủ Nhật</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBatchAdd} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-12 font-black shadow-xl w-full transition-all">
                    ĐỒNG BỘ NGAY
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-black hover:bg-emerald-500/20 transition-all" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
              XUẤT CSV
            </Button>
            
            <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 text-[10px] rounded-xl h-10 border-amber-500/50 bg-amber-500/10 text-amber-500 font-black hover:bg-amber-500/20 transition-all" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              NHẬP CSV
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-xl bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Số ngày công</p>
              <h4 className="text-2xl font-black text-white">{monthlySummary.totalCount} ngày</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tổng giờ làm OT</p>
              <h4 className="text-2xl font-black text-orange-500">{formatHours(monthlySummary.totalMinutesOT)}</h4>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-zinc-900 border border-zinc-800 rounded-[1.5rem]">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Lương OT dự tính</p>
              <h4 className="text-2xl font-black text-green-500">{formatCurrency(monthlySummary.totalSalary)}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="rounded-xl text-zinc-400 hover:text-white transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-primary tracking-widest">THÁNG ĐANG XEM</p>
          <p className="text-xl font-black text-white uppercase tracking-tighter">
            Tháng {selectedMonth} <span className="text-zinc-500">/</span> {selectedYear}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="rounded-xl text-zinc-400 hover:text-white transition-all">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      {completedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-8 rounded-[2rem] bg-zinc-900 border border-zinc-800">
            <History className="w-16 h-16 text-zinc-800" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-500">Chưa có dữ liệu</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => {
            const metrics = getSessionOTMetrics(session);
            
            return (
              <Card key={session.id} className="border-none shadow-xl overflow-hidden bg-zinc-900 rounded-[1.5rem] border border-zinc-800">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tighter text-white">
                        {new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-xl transition-all" onClick={() => deleteSession(session.id)} disabled={isProcessing}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-primary hover:bg-zinc-800 rounded-xl transition-all" onClick={() => setEditingSession(session)} disabled={isProcessing}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Thời gian</p>
                      <p className="text-xs font-bold text-white">
                        {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        <span className="mx-1 text-zinc-600">→</span>
                        {session.checkOut ? new Date(session.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest">Tổng OT</p>
                      <div className="flex items-center space-x-1 text-xs font-black text-orange-500">
                        <Zap className="w-3.5 h-3.5 fill-orange-500/20" />
                        <span>{formatHours(metrics.otMinutes)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p className="text-[10px] text-green-500 uppercase font-black tracking-widest">Lương OT</p>
                      <p className="text-lg font-black text-green-500 tracking-tighter">{formatCurrency(metrics.salary)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-xl text-center">Chỉnh sửa phiên</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Thời gian vào</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Thời gian ra</Label>
                <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Hệ số lương</Label>
                <Select value={editingSession.multiplier.toString()} onValueChange={(v) => setEditingSession({...editingSession, multiplier: parseFloat(v)})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="1.0">Ngày thường</SelectItem>
                    <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (x{settings.sundayMultiplier})</SelectItem>
                    <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (x{settings.holidayMultiplier})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate} disabled={isProcessing} className="bg-primary hover:bg-primary/90 text-black rounded-xl h-12 font-black shadow-xl w-full transition-all">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ĐANG LƯU...
                  </>
                ) : (
                  'LƯU THAY ĐỔI'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
