
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
import { History, Trash2, Edit3, Clock, Calendar, StickyNote, Download, Zap, PlusCircle, Layers, Star } from 'lucide-react';
import { useState } from 'react';
import { WorkSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const { sessions, isLoaded, deleteSession, updateSession, addManualSession, batchAddSessions, settings, exportToCSV } = useAttendance();
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const { toast } = useToast();
  
  // State for manual entry
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualData, setManualData] = useState({
    checkIn: new Date().toISOString().slice(0, 16),
    checkOut: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
    multiplier: 1.0,
    note: ''
  });

  // State for batch entry
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchData, setBatchData] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: '08:00',
    endTime: '17:30',
    multiplier: -1, // -1 means AUTO recognition (Sun/Holiday)
    excludeSundays: true
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
      toast({ title: "Thành công", description: "Đã đồng bộ các ngày làm việc hàng loạt." });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm hàng loạt." });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Nhật Ký Chấm Công</h1>
          <p className="text-muted-foreground text-sm">Xem và chỉnh sửa các phiên làm việc</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2 text-xs border border-zinc-800">
                <Layers className="w-3.5 h-3.5" />
                Thêm hàng loạt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Thêm phiên hàng loạt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Từ ngày</Label>
                    <Input 
                      type="date" 
                      className="bg-zinc-900 border-zinc-800"
                      value={batchData.startDate}
                      onChange={(e) => setBatchData({...batchData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Đến ngày</Label>
                    <Input 
                      type="date" 
                      className="bg-zinc-900 border-zinc-800"
                      value={batchData.endDate}
                      onChange={(e) => setBatchData({...batchData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giờ vào</Label>
                    <Input 
                      type="time" 
                      className="bg-zinc-900 border-zinc-800"
                      value={batchData.startTime}
                      onChange={(e) => setBatchData({...batchData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giờ ra</Label>
                    <Input 
                      type="time" 
                      className="bg-zinc-900 border-zinc-800"
                      value={batchData.endTime}
                      onChange={(e) => setBatchData({...batchData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Loại hình (Hệ số lương)</Label>
                  <Select value={batchData.multiplier.toString()} onValueChange={(v) => setBatchData({...batchData, multiplier: parseFloat(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Tự động nhận diện (CN/Lễ)</SelectItem>
                      <SelectItem value="1.0">Ngày thường (x1.0)</SelectItem>
                      <SelectItem value={settings.overtimeMultiplier.toString()}>Tăng ca (OT {settings.overtimeMultiplier})</SelectItem>
                      <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (OT {settings.sundayMultiplier})</SelectItem>
                      <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (OT {settings.holidayMultiplier})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="excludeSundays" 
                    checked={batchData.excludeSundays}
                    onCheckedChange={(checked) => setBatchData({...batchData, excludeSundays: !!checked})}
                  />
                  <Label htmlFor="excludeSundays" className="text-xs font-bold cursor-pointer">Nghỉ Chủ Nhật (Không thêm vào CN)</Label>
                </div>
                <p className="text-[10px] text-zinc-500 italic">* Hệ thống sẽ tự dùng hệ số trong Cài đặt và bỏ qua ngày đã có dữ liệu.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBatchDialog(false)} className="border-zinc-800">Hủy</Button>
                <Button onClick={handleBatchAdd} className="bg-primary hover:bg-primary/90">Xác nhận đồng bộ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 text-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                Thêm lẻ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Thêm phiên thủ công</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Thời gian vào</Label>
                  <Input 
                    type="datetime-local" 
                    className="bg-zinc-900 border-zinc-800"
                    value={manualData.checkIn}
                    onChange={(e) => setManualData({...manualData, checkIn: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian ra</Label>
                  <Input 
                    type="datetime-local" 
                    className="bg-zinc-900 border-zinc-800"
                    value={manualData.checkOut}
                    onChange={(e) => setManualData({...manualData, checkOut: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại hình</Label>
                  <Select value={manualData.multiplier.toString()} onValueChange={(v) => setManualData({...manualData, multiplier: parseFloat(v)})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Chọn hệ số" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">Ngày thường (x1.0)</SelectItem>
                      <SelectItem value={settings.overtimeMultiplier.toString()}>Tăng ca (OT {settings.overtimeMultiplier})</SelectItem>
                      <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (OT {settings.sundayMultiplier})</SelectItem>
                      <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (OT {settings.holidayMultiplier})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Input 
                    placeholder="Lý do nhập thủ công..." 
                    className="bg-zinc-900 border-zinc-800"
                    value={manualData.note}
                    onChange={(e) => setManualData({...manualData, note: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowManualDialog(false)} className="border-zinc-800">Hủy</Button>
                <Button onClick={handleManualAdd}>Thêm vào nhật ký</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-xs border-zinc-800"
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
          <div className="p-6 rounded-full bg-muted/50">
            <History className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Chưa có lịch sử</h3>
            <p className="text-muted-foreground text-sm">Các phiên làm việc đã hoàn thành sẽ xuất hiện ở đây.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {completedSessions.map((session) => {
            const otMinutes = session.multiplier === 1.0 
              ? (session.totalMinutes > 510 ? session.totalMinutes - 480 : 0) 
              : session.totalMinutes;
            
            return (
              <Card key={session.id} className="border-none shadow-sm overflow-hidden group bg-zinc-900 border border-zinc-800">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">
                        {new Date(session.checkIn).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {session.multiplier === settings.holidayMultiplier && <Star className="w-3 h-3 text-red-500 fill-red-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Dialog open={editingSession?.id === session.id} onOpenChange={(open) => !open && setEditingSession(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setEditingSession(session)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                          <DialogHeader>
                            <DialogTitle>Chỉnh Sửa Phiên</DialogTitle>
                          </DialogHeader>
                          {editingSession && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Thời gian vào</Label>
                                <Input 
                                  type="datetime-local" 
                                  className="bg-zinc-900 border-zinc-800"
                                  value={editingSession.checkIn.slice(0, 16)}
                                  onChange={(e) => setEditingSession({...editingSession, checkIn: new Date(e.target.value).toISOString()})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Thời gian ra</Label>
                                <Input 
                                  type="datetime-local" 
                                  className="bg-zinc-900 border-zinc-800"
                                  value={editingSession.checkOut?.slice(0, 16) || ''}
                                  onChange={(e) => setEditingSession({...editingSession, checkOut: new Date(e.target.value).toISOString()})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Hệ số lương</Label>
                                <Select value={editingSession.multiplier.toString()} onValueChange={(v) => setEditingSession({...editingSession, multiplier: parseFloat(v)})}>
                                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1.0">Ngày thường (x1.0)</SelectItem>
                                    <SelectItem value={settings.overtimeMultiplier.toString()}>Tăng ca (OT {settings.overtimeMultiplier})</SelectItem>
                                    <SelectItem value={settings.sundayMultiplier.toString()}>Chủ Nhật (OT {settings.sundayMultiplier})</SelectItem>
                                    <SelectItem value={settings.holidayMultiplier.toString()}>Ngày Lễ (OT {settings.holidayMultiplier})</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Ghi chú</Label>
                                <Input 
                                  placeholder="Thêm ghi chú..." 
                                  className="bg-zinc-900 border-zinc-800"
                                  value={editingSession.note}
                                  onChange={(e) => setEditingSession({...editingSession, note: e.target.value})}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingSession(null)} className="border-zinc-800">Hủy</Button>
                            <Button onClick={handleUpdate}>Lưu thay đổi</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Thời gian</p>
                      <p className="text-xs font-medium">
                        {new Date(session.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        <span className="mx-1">→</span>
                        {new Date(session.checkOut!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Tăng ca (OT)</p>
                      <div className="flex items-center space-x-1 text-xs font-medium text-orange-600">
                        <Zap className="w-3 h-3" />
                        <span>{formatHours(otMinutes)}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500">Tổng: {formatHours(session.totalMinutes)} (x{session.multiplier})</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Lương OT</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(session.salary)}</p>
                    </div>
                  </div>
                  {session.note && (
                    <div className="px-4 pb-4 flex items-start space-x-2">
                      <StickyNote className="w-3 h-3 text-zinc-500 mt-0.5" />
                      <p className="text-xs text-zinc-500 italic">{session.note}</p>
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
