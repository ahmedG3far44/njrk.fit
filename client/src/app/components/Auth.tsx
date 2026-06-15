import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';
import { api } from '../lib/api';
import NjerkaLogo from './NjerkaLogo';


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") as string;


interface AuthProps { 
  onLogin: () => void;
  onRegister: () => void;
  initialView?: 'login' | 'register';
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { login, register } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (view === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length > 100) {
        newErrors.name = 'Name must be less than 100 characters';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (view === 'register' && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (view === 'login') {
        await login({ email: formData.email, password: formData.password });
        toast.success('Welcome back!');
        onLogin();
      } else {
        const { needsOnboarding } = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        toast.success('Account created successfully!');
        if (needsOnboarding) {
          onRegister();
        } else {
          onLogin();
        }
      }
   } catch (error: any) {
      // حطينا هذا السطر عشان لو ما ضبطت، تفتح الـ Console في المتصفح وتصور لي وش طلع لك بالضبط
      console.log("Backend Error Object:", error); 

      // هنا بنحفر ورا الرسالة في كل الأماكن المحتملة اللي ممكن يكون api.ts خباها فيها!
      const message = 
        error.response?.data?.error || 
        error.response?.error || 
        error.data?.error || 
        error.message || 
        'Something went wrong. Please try again.';

      const status = error.response?.status || error.status || 400;

      // إذا الخطأ 401 (باسورد غلط) أو 400 (مشكلة توثيق أو غيره)
      if (status === 401) {
        setErrors({ password: 'Invalid email or password' });
      } else if (status === 400 || message.includes('توثيق')) {
        // بنعرض الرسالة الجاية من الباك اند تحت مربع الإيميل مباشرة
        setErrors({ email: message });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };


  const handleForgotPassword = async () => {
    // 1. نتأكد إن اليوزر كاتب إيميله في المربع
    if (!formData.email.trim()) {
      toast.error('الرجاء كتابة إيميلك في المربع أعلاه أولاً 👆');
      setErrors({ email: 'مطلوب لإرسال رابط إعادة التعيين' });
      return;
    }

    // 2. نرسل الطلب للباك اند
    try {
      // سوينا توست للتحميل عشان اليوزر يعرف إن فيه شيء جالس يصير
      toast.info('جاري إرسال الرابط...'); 
      
      await api.post('/auth/forgot-password', { email: formData.email });
      
      toast.success('تم إرسال رابط تغيير كلمة المرور بنجاح! شيك إيميلك 🚀');
    } catch (err: any) {
      console.log(err);
      const message = err.data?.error || err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <NjerkaLogo size="large" />
          </div>

          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-slate-500 mb-8">
            {view === 'login'
              ? 'Enter your details to access your plan.'
              : 'Start your personalized health journey today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-600 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-600'
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs font-medium">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="hello@example.com"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-600'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-600'
                    }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-medium">{errors.password}</p>
              )}
            </div>

            {view === 'login' && (
              <div className="text-right">
                <button
                   type="button"
                  className="text-sm text-green-700 font-medium hover:underline"
                  onClick={handleForgotPassword}
                  >
                       Forgot password?
                      </button>
              </div>
            )}

            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-800 to-green-700 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-200 cursor-pointer"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  {view === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6">
              <button
                type="button"
                onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
                className="group flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1 active:scale-[0.98] cursor-pointer"
              >
                <Chrome className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-700" />
                <span>Continue with Google</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500">
              {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setErrors({});
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-green-800 font-bold hover:underline cursor-pointer"
              >
                {view === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};