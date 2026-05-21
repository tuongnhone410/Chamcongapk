
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
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { History, Trash2, Edit3, Clock, Calendar as CalendarIcon, StickyNote, Download, Zap, PlusCircle, Layers, Star, CheckSquare, X } from 'lucide-react';
import { useState } from 'react';
import { WorkSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const { sessions, isLoaded, deleteSession, updateSession, addManualSession, batchAddSessions, multiAddSessions, settings, exportToCSV } = useAttendance();
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const { toast } = useToast();
  
  // Helper to format date for datetime-local input correctly taking timezone into account
  const formatToLocalDatetime = (isoString: string | Date) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  // Trạng thái Thêm lẻ
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualData, setManualData] = useState({
    checkIn: formatToLocalDatetime(new Date()).slice(0, 11) + "07:00",
    checkOut: formatToLocalDatetime(new Date()).slice(0, 11) + "20:00",
    multiplier: 1.0,
    note: ''
  });

  // Trạng thái Thêm hàng loạt (Khoảng ngày)
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchData, setBatchData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: '07:00',
    endTime: '20:00',
    multiplier: -1,
    excludeSundays: true
  });

  // Trạng thái Thêm theo ngày chọn (Lịch chọn nhiều ngày)
  const [showMultiDialog, setShowMultiDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [multiData, setMultiData] = useState({
    startTime: '07:00',
    endTime: '20:00',
    multiplier: 1.0
  });

  if (!isLoaded) return null;

  const completedSessions = sessions.filter(s => s.checkOut).sort((a, b) => 
    new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
  );

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('vi-VN')}${settings.currency}`;
  };

  const handleUpdate = () => {
    if (editingSession) {
      const checkIn = new Date(editingSession.checkIn);
      const checkOut = new Date(editingSession.checkOut || '');
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffMinutes = Math.floor(diffMs / 1000 / 60);
      
      updateSession({
        ...editingSession,
        totalMinutes: diffMinutes,
      });
      setEditingSession(null);
    }
  };

  const handleManualAdd = () => {
    addManualSession({
      checkIn: new Date(manualData.checkIn).toISOString(),
      checkOut: new Date(manualData.checkOut).toISOString(),
      multiplier: manualData.multiplier,
      note: manualData.note
    });
    setShowManualDialog(false);
    toast({ title: "Thành công", description: "Đã thêm phiên làm việc mới." });
  };

  const handleBatchAdd = async () => {
    try {
      await batchAddSessions(batchData);
      setShowBatchDialog(false);
      toast({ title: "Thành công", description: "Đã đồng bộ dữ liệu hàng loạt." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm hàng loạt." });
    }
  };

  const handleMultiAdd = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn ít nhất 1 ngày trên lịch." });
      return;
    }
    try {
      await multiAddSessions({
        dates: selectedDates,
        startTime: multiData.startTime,
        endTime: multiData.endTime,
        multiplier: multiData.multiplier
      });
      setShowMultiDialog(false);
      setSelectedDates([]);
      toast({ title: "Thành công", description: `Đã thêm ${selectedDates.length} phiên làm việc.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm dữ liệu." });
    }
  };

  const showExcludeSundays = (batchData.multiplier === -1 || batchData.multiplier === 1.0);

  const sessionDates = sessions.map(s => new Date(s.checkIn).toDateString());

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase">Nhật Ký Chấm Công</h1>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Quản lý phiên làm việc</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showMultiDialog} onOpenChange={setShowMultiDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="gap-2 text-xs rounded-xl h-10 bg-primary font-black shadow-lg">
                <CheckSquare className="w-4 h-4" />
                CHỌN NGÀY TĂNG CA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-black text-xl uppercase tracking-tighter text-primary">Thêm nhanh theo ngày</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-3 border border-zinc-800">
                  <p className="text-[10px] font-black uppercase text-zinc-500 text-center">Tích chọn các ngày trên lịch (Ngày đã chấm công sẽ bị mờ)</p>
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
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map((date, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold py-1 px-2 flex items-center gap-1">
                            {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()))} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                    <input 
                      type="time" 
                      className="bg-zinc-900 border border-zinc-800 h-11 font-bold rounded-xl px-3 outline-none focus:border-primary transition-colors text-white"
                      value={multiData.startTime}
                      onChange={(e) => setMultiData({...multiData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                    <input 
                      type="time" 
                      className="bg-zinc-900 border border-orange-500/30 h-11 font-bold rounded-xl px-3 outline-none focus:border-orange-500 transition-colors text-orange-500"
                      value={multiData.endTime}
                      onChange={(e) => setMultiData({...multiData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Loại hình</Label>
                  <Select value={multiData.multiplier.toString()} onValueChange={(v) => setMultiData({...multiData, multiplier: parseFloat(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">Ngày thường (x1.0)</SelectItem>
                      <SelectItem value={settings.sundayMultiplier.toString()}>OT {settings.sundayMultiplier.toFixed(1)} (Chủ Nhật)</SelectItem>
                      <SelectItem value={settings.holidayMultiplier.toString()}>OT {settings.holidayMultiplier.toFixed(1)} (Ngày Lễ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowMultiDialog(false)} className="border-zinc-800 rounded-xl h-12 font-bold">Hủy</Button>
                <Button onClick={handleMultiAdd} className="bg-primary hover:bg-primary/90 rounded-xl h-12 font-black shadow-xl">XÁC NHẬN THÊM</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2 text-xs rounded-xl h-10 border-zinc-800 bg-zinc-900 font-bold">
                <Layers className="w-3.5 h-3.5" />
                Dải ngày
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="font-black text-xl uppercase tracking-tighter">Đồng bộ hàng loạt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Từ ngày</Label>
                    <Input 
                      type="date" 
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold"
                      value={batchData.startDate}
                      onChange={(e) => setBatchData({...batchData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Đến ngày</Label>
                    <Input 
                      type="date" 
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold"
                      value={batchData.endDate}
                      onChange={(e) => setBatchData({...batchData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ vào</Label>
                    <Input 
                      type="time" 
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold"
                      value={batchData.startTime}
                      onChange={(e) => setBatchData({...batchData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">Giờ ra</Label>
                    <Input 
                      type="time" 
                      className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold"
                      value={batchData.endTime}
                      onChange={(e) => setBatchData({...batchData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Loại hình</Label>
                  <Select value={batchData.multiplier.toString()} onValueChange={(v) => setBatchData({...batchData, multiplier: parseFloat(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 rounded-xl h-11 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Tự động (Nhận diện OT 2.0/3.0)</SelectItem>
                      <SelectItem value="1.0">Ngày thường (x1.0)</SelectItem>
                      <SelectItem value={settings.sundayMultiplier.toString()}>OT {settings.sundayMultiplier.toFixed(1)} (Chủ Nhật)</SelectItem>
                      <SelectItem value={settings.holidayMultiplier.toString()}>OT {settings.holidayMultiplier.toFixed(1)} (Ngày Lễ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {showExcludeSundays && (
                  <div className="flex items-center space-x-2 pt-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                    <Checkbox 
                      id="excludeSundays" 
                      checked={batchData.excludeSundays}
                      onCheckedChange={(checked) => setBatchData({...batchData, excludeSundays: !!checked})}
                    />
                    <Label htmlFor="excludeSundays" className="text-xs font-black uppercase text-zinc-400 cursor-pointer">Bỏ qua ngày Chủ Nhật</Label>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowBatchDialog(false)} className="border-zinc-800 rounded-xl h-12 font-bold">Hủy</Button>
                <Button onClick={handleBatchAdd} className="bg-primary hover:bg-primary/90 rounded-xl h-12 font-black">Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-xs rounded-xl h-10 border-zinc-800 bg-zinc-900 font-bold"
            onClick={exportToCSV}
            disabled={completedSessions.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </Button>
        </div>
      </header>

      {completedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-8 rounded-[2rem] bg-zinc-900 border border-zinc-800">
            <History className="w-16 h-16 text-zinc-800" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tighter">Chưa có lịch sử</h3>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Dữ liệu chấm công sẽ xuất hiện tại đây.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => {
            const otMinutes = session.multiplier === 1.0 
              ? (session.totalMinutes > 510 ? session.totalMinutes - 480 : 0) 
              : session.totalMinutes;
            
            return (
              <Card key={session.id} className="border-none shadow-xl overflow-hidden group bg-zinc-900 rounded-[1.5rem] border border-zinc-800">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tighter">
                        {new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {session.multiplier === settings.holidayMultiplier && (
                        <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                          <Star className="w-3 h-3 fill-red-500" />
                          <span className="text-[10px] font-black uppercase">Lễ</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-zinc-500 hover:text-destructive transition-colors rounded-xl"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Dialog open={editingSession?.id === session.id} onOpenChange={(open) => !open && setEditingSession(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-zinc-500 hover:text-primary transition-colors rounded-xl"
                            onClick={() => setEditingSession(session)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="font-black uppercase text-xl text-center">Chỉnh sửa phiên</DialogTitle>
                          </DialogHeader>
                          {editingSession && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-zinc-500">Vào làm</Label>
                                <Input 
                                  type="datetime-local" 
                                  className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white"
                                  value={formatToLocalDatetime(editingSession.checkIn)}
                                  onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-zinc-500">Ra làm</Label>
                                <Input 
                                  type="datetime-local" 
                                  className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold text-white"
                                  value={editingSession.checkOut ? formatToLocalDatetime(editingSession.checkOut) : ""}
                                  onChange={(e) => setEditingSession({...editingSession, checkOut: e.target.value ? new Date(e.target.value).toISOString() : null})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-zinc-500">Hệ số</Label>
                                <Select value={editingSession.multiplier.toString()} onValueChange={(v) => setEditingSession({...editingSession, multiplier: parseFloat(v)})}>
                                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1.0">x1.0 (Tự động OT 1.5)</SelectItem>
                                    <SelectItem value={settings.sundayMultiplier.toString()}>OT {settings.sundayMultiplier.toFixed(1)}</SelectItem>
                                    <SelectItem value={settings.holidayMultiplier.toString()}>OT {settings.holidayMultiplier.toFixed(1)}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-zinc-500">Ghi chú</Label>
                                <Input 
                                  className="bg-zinc-900 border-zinc-800 h-11 rounded-xl font-bold"
                                  value={editingSession.note}
                                  onChange={(e) => setEditingSession({...editingSession, note: e.target.value})}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setEditingSession(null)} className="border-zinc-800 rounded-xl h-12 font-bold flex-1">Hủy</Button>
                            <Button onClick={handleUpdate} className="bg-primary rounded-xl h-12 font-black shadow-xl flex-1">CẬP NHẬT</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                      <p className="text-[9px] text-zinc-600 font-bold uppercase">
                        Hệ số: x{session.multiplier === 1.0 ? '1.5' : session.multiplier.toFixed(1)}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p className="text-[10px] text-green-500 uppercase font-black tracking-widest">Lương OT</p>
                      <p className="text-lg font-black text-green-500 tracking-tighter">{formatCurrency(session.salary)}</p>
                    </div>
                  </div>
                  {session.note && (
                    <div className="px-5 pb-4 flex items-start space-x-2">
                      <StickyNote className="w-3 h-3 text-zinc-600 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 font-medium italic">{session.note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
