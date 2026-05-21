'use client';

import { useState } from 'react';
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
import { LogIn, Chrome, ShieldCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  if (user) {
    router.push('/');
    return null;
  }

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi xác thực',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đăng nhập Google',
        description: error.message,
      });
    }
  };

  const handleAdminBypass = async () => {
    if (!auth) return;
    
    // Thêm mã PIN để bảo mật nút Admin
    const pin = window.prompt("Nhập mã PIN Admin để tiếp tục (Mặc định: 2024):");
    if (pin !== "2024") {
      toast({
        variant: 'destructive',
        title: 'Sai mã PIN',
        description: 'Bạn không có quyền truy cập vào tài khoản Admin demo.',
      });
      return;
    }

    setLoading(true);
    const adminEmail = 'admin@timesnap.com';
    const adminPass = 'admin123456';
    
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
          router.push('/');
        } catch (signupError: any) {
          toast({
            variant: 'destructive',
            title: 'Lỗi Admin',
            description: 'Không thể khởi tạo tài khoản Admin demo.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi Admin',
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md shadow-2xl border-zinc-800 bg-zinc-900 text-white overflow-hidden">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-2 border border-primary/30">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-white">TimeSnap</CardTitle>
          <CardDescription className="text-zinc-400">Đăng nhập để đồng bộ dữ liệu đám mây</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-800 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Đăng ký</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Mật khẩu</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-primary h-12"
                />
              </div>

              <TabsContent value="login" className="mt-0">
                <Button 
                  className="w-full h-12 font-bold text-lg rounded-xl" 
                  onClick={() => handleEmailAuth('login')}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <Button 
                  className="w-full h-12 font-bold text-lg rounded-xl" 
                  onClick={() => handleEmailAuth('signup')}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                </Button>
              </TabsContent>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-500">Hoặc truy cập nhanh</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12 gap-2 font-bold border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="w-4 h-4" />
                  Google
                </Button>
                <Button 
                  variant="secondary" 
                  className="h-12 gap-2 font-black border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
                  onClick={handleAdminBypass}
                  disabled={loading}
                >
                  <ShieldCheck className="w-4 h-4" />
                  ADMIN
                </Button>
              </div>

              <Alert className="bg-primary/5 border-primary/20 mt-4">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-[10px] text-zinc-400 leading-tight">
                  Tài khoản ADMIN là tài khoản dùng chung để trải nghiệm. Để bảo mật dữ liệu cá nhân, vui lòng sử dụng Google hoặc Email riêng.
                </AlertDescription>
              </Alert>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}