import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, Github, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';


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
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { message?: string } };
      const message = err.response?.message || 'Something went wrong. Please try again.';

      if (err.status === 401) {
        setErrors({ password: 'Invalid email or password' });
      } else if (err.status === 400) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8"> 
            <img src={"./image.png"} alt="Njerka" className="h-20 w-auto object-contain" />
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
                  onClick={() => toast.info('Password reset feature coming soon')}
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
              className="w-full bg-gradient-to-r from-green-800 to-green-700 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-200"
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

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600"
                onClick={() => toast.info('GitHub OAuth coming soon')}
              >
                <Github className="w-5 h-5" /> GitHub
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600"
                onClick={() => window.location.href = 'http://localhost:8080/api/auth/google'}
              >
                <Chrome className="w-5 h-5" /> Google
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
                className="text-green-700 font-bold hover:underline"
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