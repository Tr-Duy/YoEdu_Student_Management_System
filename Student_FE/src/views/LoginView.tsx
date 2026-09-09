import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setError(null);
    setLoading(true);
    try {
      await login(data);
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        if (userObj.role === 'PARENT') {
          navigate('/parent', { replace: true });
          return;
        }
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAutofill = (role: 'admin' | 'staff' | 'cashier' | 'parent') => {
    switch (role) {
      case 'admin':
        setValue('username', 'admin');
        setValue('password', '123456');
        break;
      case 'staff':
        setValue('username', 'academic_staff');
        setValue('password', '123456');
        break;
      case 'cashier':
        setValue('username', 'cashier');
        setValue('password', '123456');
        break;
      case 'parent':
        setValue('username', 'parent');
        setValue('password', '123456');
        break;
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden px-4">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-extrabold text-2xl text-white shadow-xl shadow-brand-500/30 mb-4">
            YO
          </div>
          <h2 className="text-3xl font-extrabold text-slate-50 tracking-wide">
            YOEDU PORTAL
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Hệ thống Quản lý Giáo dục Thông minh
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/5">
          <h3 className="text-xl font-bold text-slate-100 mb-6">Đăng nhập tài khoản</h3>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 mb-6 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {location.search.includes('expired=true') && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 mb-6 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input
                label="Tên đăng nhập"
                placeholder="Nhập tên đăng nhập"
                {...register('username')}
                error={errors.username?.message as string}
              />
            </div>
            <div>
              <Input
                type="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                {...register('password')}
                error={errors.password?.message as string}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 justify-center py-3"
              isLoading={loading}
            >
              Đăng nhập
            </Button>
          </form>

          {/* Quick Demo Autofills */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <span className="block text-center text-xs font-medium text-slate-500 mb-4">
              Sử dụng tài khoản Demo: (Mật khẩu: <span className="font-semibold text-slate-300">123456</span>)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoAutofill('admin')}
                className="text-[11px] font-semibold bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-slate-300 rounded-lg py-2 transition-all cursor-pointer"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleDemoAutofill('staff')}
                className="text-[11px] font-semibold bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-slate-300 rounded-lg py-2 transition-all cursor-pointer"
              >
                HỌC VỤ
              </button>
              <button
                type="button"
                onClick={() => handleDemoAutofill('cashier')}
                className="text-[11px] font-semibold bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-slate-300 rounded-lg py-2 transition-all cursor-pointer"
              >
                THU NGÂN
              </button>
              <button
                type="button"
                onClick={() => handleDemoAutofill('parent')}
                className="text-[11px] font-semibold bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-slate-300 rounded-lg py-2 transition-all cursor-pointer"
              >
                PHỤ HUYNH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginView;
