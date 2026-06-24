import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Mail, Lock, User, Chrome, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';
import { api, ApiError } from '../lib/api';
import NjerkaLogo from './NjerkaLogo';
import { Button } from './ui/button';


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
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (view === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = t('auth.nameRequired');
      } else if (formData.name.length > 100) {
        newErrors.name = t('auth.nameMaxLength');
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (view === 'register' && formData.password.length < 8) {
      newErrors.password = t('auth.passwordLength');
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
        toast.success(t('auth.loginSuccess'));
        onLogin();
      } else {
        const { needsOnboarding } = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        toast.success(t('auth.registerSuccess'));
        if (needsOnboarding) {
          onRegister();
        } else {
          onLogin();
        }
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const message = error.data && typeof error.data === 'object' && 'error' in (error.data as object)
          ? String((error.data as { error: string }).error)
          : error.message;

        if (error.status === 401) {
          setErrors({ password: 'Invalid email or password' });
        } else if (error.status === 400) {
          setErrors({ email: message });
        } else {
          toast.error(message);
        }
      } else if (error instanceof TypeError) {
        toast.error('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
      } else {
        const message = (error as { message?: string }).message || 'Something went wrong. Please try again.';
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
    if (!formData.email.trim()) {
      toast.error(t('auth.forgotPasswordEmailRequired'));
      setErrors({ email: t('auth.forgotPasswordEmailRequired') });
      return;
    }

    try {
      toast.info(t('auth.sendingResetLink'));
      
      await api.post('/auth/forgot-password', { email: formData.email });
      
      toast.success(t('auth.resetLinkSent'));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const message = err.data && typeof err.data === 'object' && 'error' in (err.data as object)
          ? String((err.data as { error: string }).error)
          : err.message;
        toast.error(message);
      } else if (err instanceof TypeError) {
        toast.error('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
      } else {
        toast.error(t('auth.forgotPasswordFailed'));
      }
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
            {view === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-center text-slate-500 mb-8">
            {view === 'login'
              ? t('auth.loginSubtitle')
              : t('auth.registerSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('auth.name')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('auth.namePlaceholder')}
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
              <label className="text-sm font-bold text-slate-700">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-600'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-600'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-medium">{errors.password}</p>
              )}
            </div>

            {view === 'login' && (
              <div className="text-end">
                <button
                   type="button"
                  className="text-sm text-green-700 font-medium hover:underline"
                  onClick={handleForgotPassword}
                  >
                       Forgot password?
                      </button>
              </div>
            )}

            <Button variant="primary" size="lg" loading={isLoading} className="w-full mt-6 shadow-lg shadow-green-200" type="submit">
              {view === 'login' ? t('auth.signIn') : t('auth.createAccount')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6">
              <Button variant="secondary" className="w-full" type="button" onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}>
                <Chrome className="h-5 w-5 text-gray-500" />
                <span>{t('auth.googleLogin')}</span>
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500">
              {view === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
              <button
                type="button"
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setErrors({});
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-green-800 font-bold hover:underline cursor-pointer"
              >
                {view === 'login' ? t('auth.signUp') : t('auth.login')}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};