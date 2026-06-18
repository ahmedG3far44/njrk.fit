import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../lib/api';
// تأكد من مسار الشعار حسب ترتيب ملفاتك
import NjerkaLogo from '../components/NjerkaLogo'; 

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);

    try {
      // نرسل الطلب للباك اند مع التوكن الموجود في الرابط
      await api.post(`/auth/reset-password/${token}`, { password });
      
      toast.success('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      navigate('/login'); // نرجعه لصفحة اللوقن
    } catch (err: any) {
      console.log(err);
      const message = err.data?.error || err.message || 'رابط غير صالح أو منتهي الصلاحية.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-muted to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <NjerkaLogo size="large" />
          </div>

          <h2 className="text-3xl font-bold text-center text-card-foreground mb-2">
            كلمة مرور جديدة
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            الرجاء إدخال كلمة المرور الجديدة لحسابك.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-card-foreground">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-green-600'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-card-foreground">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-green-600'
                  }`}
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs font-medium mt-1">{error}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-800 to-green-700 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-200 cursor-pointer"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  حفظ وتسجيل الدخول
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};