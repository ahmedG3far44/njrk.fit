import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("جاري التحقق من الرابط...");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // نكلم الباك اند ونتأكد من التوكن
        const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "تم توثيق حسابك بنجاح!");
        } else {
          setStatus("error");
          setMessage(data.error || "فشل توثيق الحساب، قد يكون الرابط منتهي الصلاحية.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("حدث خطأ في الاتصال بالخادم، الرجاء المحاولة لاحقاً.");
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        
        {/* حالة التحميل */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-forest-canopy border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-card-foreground">جاري التوثيق...</h2>
            <p className="text-muted-foreground">الرجاء الانتظار قليلاً</p>
          </div>
        )}

        {/* حالة النجاح */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">تم التوثيق!</h2>
            <p className="text-muted-foreground">{message}</p>
            <Link to="/login" className="mt-6 inline-block w-full bg-forest-canopy text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              تسجيل الدخول
            </Link>
          </div>
        )}

        {/* حالة الفشل */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">عذراً</h2>
            <p className="text-muted-foreground">{message}</p>
            <Link to="/login" className="mt-6 inline-block w-full border border-forest-canopy text-forest-canopy py-3 rounded-lg font-medium hover:bg-stone transition-colors">
              العودة لتسجيل الدخول
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};