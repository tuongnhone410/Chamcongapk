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
import { LogIn, Chrome, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ email và mật khẩu.',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = 'Đã có lỗi xảy ra';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorMessage = 'Email hoặc mật khẩu không chính xác';
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
        case 'auth/network-request-failed':
          errorMessage = 'Lỗi kết nối mạng, vui lòng kiểm tra lại';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Phương thức đăng nhập này chưa được bật trong Firebase';
          break;
        default:
          errorMessage = `Lỗi: ${error.message} (${error.code})`;
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
      router.push('/');
    } catch (error: any) {
      console.error('Google Auth error:', error);
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
                  placeholder="admin@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary h-12"
                  disabled={loading}
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
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const mode = document.querySelector('[data-state="active"]')?.getAttribute('data-value') as any || 'login';
                      handleEmailAuth(mode);
                    }
                  }}
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
                  <span className="bg-zinc-900 px-2 text-zinc-500">Hoặc</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 gap-2 font-bold border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-white"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome className="w-4 h-4" />
                Đăng nhập với Google
              </Button>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 mt-4">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Lưu ý: Bạn cần tạo tài khoản (Signup) lần đầu trước khi có thể Đăng nhập. Dữ liệu của mỗi tài khoản là riêng biệt và bảo mật.
                </p>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}