'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { LogIn, Chrome, AlertCircle, Clock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();

  // Chuyển logic điều hướng vào useEffect để tránh lỗi "setState in render"
  useEffect(() => {
    if (user && !userLoading) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  if (user || userLoading) {
    return null;
  }

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) return;

    let targetEmail = email.trim();
    const targetPassword = password.trim();

    // Hỗ trợ lối tắt "admin"
    if (targetEmail.toLowerCase() === 'admin') {
      targetEmail = 'admin@timesnap.com';
    }

    if (!targetEmail || !targetPassword) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      toast({
        variant: 'destructive',
        title: 'Định dạng không hợp lệ',
        description: 'Vui lòng nhập đúng định dạng email (hoặc gõ "admin").',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      } else {
        await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
      }
      // Điều hướng sẽ được xử lý bởi useEffect phía trên
    } catch (error: any) {
      let errorMessage = 'Đã có lỗi xảy ra';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorMessage = 'Tài khoản hoặc mật khẩu không chính xác';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Tài khoản này chưa tồn tại';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được đăng ký bởi tài khoản khác';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Định dạng email không hợp lệ';
          break;
        default:
          errorMessage = `Lỗi hệ thống: ${error.message}`;
      }
      
      toast({
        variant: 'destructive',
        title: 'Lỗi xác thực',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đăng nhập Google',
        description: error.code === 'auth/popup-closed-by-user' 
          ? 'Bạn đã đóng cửa sổ đăng nhập' 
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
      <Card className="w-full max-w-md shadow-2xl border-zinc-800 bg-zinc-900 text-white overflow-hidden rounded-2xl">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-2 border border-primary/30">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">TimeSnap</CardTitle>
          <CardDescription className="text-zinc-400 font-medium">Hệ thống chấm công bảo mật</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-800 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-zinc-700 data-[state=active]:text-white font-bold">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-zinc-700 data-[state=active]:text-white font-bold">Đăng ký</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 font-bold ml-1 uppercase text-[10px] tracking-wider">Tài khoản / Email</Label>
                <Input 
                  id="email" 
                  type="text" 
                  placeholder="Nhập email hoặc 'admin'..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-12 rounded-xl"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 font-bold ml-1 uppercase text-[10px] tracking-wider">Mật khẩu</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-primary h-12 rounded-xl pr-12"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEmailAuth('login');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <TabsContent value="login" className="mt-0 pt-2">
                <Button 
                  className="w-full h-14 font-black text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95" 
                  onClick={() => handleEmailAuth('login')}
                  disabled={loading}
                >
                  {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0 pt-2">
                <Button 
                  className="w-full h-14 font-black text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95 bg-emerald-600 hover:bg-emerald-500" 
                  onClick={() => handleEmailAuth('signup')}
                  disabled={loading}
                >
                  {loading ? 'Đang khởi tạo...' : 'TẠO TÀI KHOẢN'}
                </Button>
              </TabsContent>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-zinc-900 px-4 text-zinc-500">Hoặc tiếp tục với</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 gap-3 font-bold border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-white transition-all"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome className="w-5 h-5" />
                Google Account
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
