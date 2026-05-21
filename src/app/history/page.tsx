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
  Save,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare
} from 'lucide-react';
import { useState, useRef } from 'react';
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
  
  const formatToLocalDatetime = (isoString: string | Date) => {
    if (!isoString) return "";
    const date = new Date(isoString);
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

  if (!isLoaded) return null;

  const filteredSessions = sessions.filter(s => {
    const d = new Date(s.checkIn);
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
  });

  const completedSessions = filteredSessions.filter(s => s.checkOut).sort((a, b) => 
    new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
  );

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('vi-VN')}đ`;
  };

  const handleUpdate = async () => {
    if (editingSession) {
      setIsProcessing(true);
      try {
        const checkIn = new Date(editingSession.checkIn);
        const checkOut = new Date(editingSession.checkOut || '');
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const diffMinutes = Math.floor(diffMs / 1000 / 60);
        
        await updateSession({
          ...editingSession,
          totalMinutes: diffMinutes,
        });
        setEditingSession(null);
        toast({ title: "Đã lưu", description: "Thay đổi đã được cập nhật." });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBatchAdd = async () => {
    setIsProcessing(true);
    setShowBatchDialog(false);
    try {
      batchAddSessions(batchData);
      toast({ title: "Thành công", description: "Đang xử lý dải ngày hàng loạt..." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm hàng loạt." });
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
    setShowMultiDialog(false);
    try {
      multiAddSessions({
        dates: selectedDates,
        startTime: multiData.startTime,
        endTime: multiData.endTime,
        multiplier: multiData.multiplier
      });
      setSelectedDates([]);
      toast({ title: "Thành công", description: `Đã xử lý ${selectedDates.length} phiên OT.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm dữ liệu." });
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
        toast({ title: "Đã nhập", description: "Dữ liệu CSV đã được khôi phục." });
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
        description: "Bạn có 10 giây để khôi phục.",
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
      toast({ title: "Đã khôi phục", description: "Dữ liệu đã được quay trở lại." });
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

  const sessionDates = sessions.map(s => new Date(s.checkIn).toDateString());

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase">LỊCH SỬ CÔNG</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUndo && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRestore}
              disabled={isProcessing}
              className="gap-2 text-xs rounded-xl h-10 border-green-500/50 bg-green-500/10 text-green-500 font-black animate-pulse"
            >
              <RotateCcw className="w-4 h-4" />
              KHÔI PHỤC ({undoCountdown}s)
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={completedSessions.length === 0 || isProcessing}
                className="gap-2 text-xs rounded-xl h-10 border-red-500/30 bg-zinc-900 text-red-500 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa hết
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  XÁC NHẬN XÓA TOÀN BỘ
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400 font-bold">
                  Hành động này sẽ xóa tất cả {completedSessions.length} phiên làm việc của tháng hiện tại. Bạn sẽ có 10 giây để nhấn nút KHÔI PHỤC trước khi dữ liệu bị xóa vĩnh viễn.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold border-zinc-800 text-white">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-500 rounded-xl font-black">XÓA BỎ</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="gap-2 text-xs rounded-xl h-10 bg-primary font-black shadow-lg">
                <CheckSquare className="w-4 h-4" />
                CHỌN NGÀY OT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto z-[100]">
              <DialogHeader>
                <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Thêm nhanh theo ngày</DialogTitle>
                <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Lưu ý: Chỉ áp dụng cho những ngày chưa có dữ liệu</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-3 border border-zinc-800">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={setSelectedDates}
                    className="rounded-md mx-auto"
                    disabled={(date) => sessionDates.includes(date.toDateString())}
                  />
                  {selectedDates && selectedDates.length > 0 && (
                    <div className="pt-3 border-t border-zinc-800">
                      <p className="text-[10px] font-black uppercase text-primary mb-2">Ngày đã chọn ({selectedDates.length}):</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {selectedDates.map((date, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold">
                            {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            <X className="w-2.5 h-2.5 ml-1 cursor-pointer" onClick={() => setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()))} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Loại hình</Label>
                  <Select value={multiData.multiplier.toString()} onValueChange={(v) => setMultiData({...multiData, multiplier: parseFloat(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 font-bold rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">Ngày thường (Tự tính OT)</SelectItem>
                      <SelectItem value={settings.sundayMultiplier.toString()}>OT CN (x{settings.sundayMultiplier})</SelectItem>
                      <SelectItem value={settings.holidayMultiplier.toString()}>OT Lễ (x{settings.holidayMultiplier})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button onClick={handleMultiAdd} disabled={isProcessing} className="bg-primary hover:bg-primary/90 rounded-xl h-12 font-black shadow-xl w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  LƯU DỮ LIỆU
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl h-10 border-zinc-800 bg-zinc-900 font-bold text-white">
                <Layers className="w-3.5 h-3.5" />
                DẢI NGÀY
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100]">
              <DialogHeader>
                <DialogTitle className="font-black text-xl uppercase tracking-tighter">Đồng bộ hàng loạt</DialogTitle>
                <DialogDescription className="text-[10px] text-zinc-500 font-bold uppercase">Nhập nhanh dải ngày liên tiếp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold text-white" value={batchData.startDate} onChange={(e) => setBatchData({...batchData, startDate: e.target.value})} />
                  <Input type="date" className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold text-white" value={batchData.endDate} onChange={(e) => setBatchData({...batchData, endDate: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold text-white" value={batchData.startTime} onChange={(e) => setBatchData({...batchData, startTime: e.target.value})} />
                  <Input type="time" className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold text-white" value={batchData.endTime} onChange={(e) => setBatchData({...batchData, endTime: e.target.value})} />
                </div>
                <Select value={batchData.multiplier.toString()} onValueChange={(v) => setBatchData({...batchData, multiplier: parseFloat(v)})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Tự động (CN/Lễ)</SelectItem>
                    <SelectItem value="1.0">Ngày thường</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 pt-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <Checkbox id="excludeSundays" checked={batchData.excludeSundays} onCheckedChange={(checked) => setBatchData({...batchData, excludeSundays: !!checked})} />
                  <Label htmlFor="excludeSundays" className="text-xs font-black uppercase text-zinc-400">Bỏ qua Chủ Nhật</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBatchAdd} disabled={isProcessing} className="bg-primary rounded-xl h-12 font-black shadow-xl w-full">
                  {isProcessing ? "ĐANG XỬ LÝ..." : "ĐỒNG BỘ NGAY"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="gap-2 text-xs rounded-xl h-10 border-zinc-800 bg-zinc-900 font-bold text-white" onClick={exportToCSV}>
            XUẤT CSV
          </Button>

          <Button variant="outline" size="sm" className="gap-2 text-xs rounded-xl h-10 border-zinc-800 bg-zinc-900 font-bold text-white" onClick={() => fileInputRef.current?.click()}>
            NHẬP CSV
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
        </div>
      </header>

      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="rounded-xl text-zinc-400">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-primary tracking-widest">THÁNG ĐANG XEM</p>
          <p className="text-xl font-black text-white uppercase tracking-tighter">
            Tháng {selectedMonth} <span className="text-zinc-500">/</span> {selectedYear}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="rounded-xl text-zinc-400">
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
            const breakMinutes = (settings.breakTimeDeduction || 0) * 60;
            const effectiveMinutes = session.totalMinutes > breakMinutes ? session.totalMinutes - breakMinutes : session.totalMinutes;
            const otMinutes = session.multiplier === 1.0 
              ? (effectiveMinutes > 510 ? effectiveMinutes - 480 : 0) 
              : effectiveMinutes;
            
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
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-destructive rounded-xl" onClick={() => deleteSession(session.id)} disabled={isProcessing}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-primary rounded-xl" onClick={() => setEditingSession(session)} disabled={isProcessing}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Thời gian</p>
                      <p className="text-xs font-bold text-white">
                        {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        <span className="mx-1 text-zinc-600">→</span>
                        {new Date(session.checkOut!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest">Tổng OT</p>
                      <div className="flex items-center space-x-1 text-xs font-black text-orange-500">
                        <Zap className="w-3.5 h-3.5 fill-orange-500/20" />
                        <span>{formatHours(otMinutes)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p className="text-[10px] text-green-500 uppercase font-black tracking-widest">Lương OT</p>
                      <p className="text-lg font-black text-green-500 tracking-tighter">{formatCurrency(session.salary)}</p>
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
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem] z-[100]">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-xl text-center">Chỉnh sửa phiên</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={formatToLocalDatetime(editingSession.checkIn)} onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})} />
              <Input type="datetime-local" className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white" value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""} onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              <Select value={editingSession.multiplier.toString()} onValueChange={(v) => setEditingSession({...editingSession, multiplier: parseFloat(v)})}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">Ngày thường</SelectItem>
                  <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (x{settings.sundayMultiplier})</SelectItem>
                  <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (x{settings.holidayMultiplier})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate} disabled={isProcessing} className="bg-primary rounded-xl h-12 font-black shadow-xl w-full">
                LƯU THAY ĐỔI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}