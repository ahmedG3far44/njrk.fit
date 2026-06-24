import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api, ApiError } from "../lib/api";

interface VerifyResponse {
  message: string;
}

export const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("جاري التحقق من الرابط...");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      try {
        const data = await api.get<VerifyResponse>(
          `/auth/verify-email/${token}`,
          { timeout: 15000 }
        );
        setStatus("success");
        setMessage(data.message || "تم توثيق حسابك بنجاح!");
      } catch (error: unknown) {
        setStatus("error");
        if (error instanceof ApiError) {
          const errorMsg =
            error.data && typeof error.data === "object" && "error" in (error.data as object)
              ? String((error.data as { error: string }).error)
              : "فشل توثيق الحساب، قد يكون الرابط منتهي الصلاحية.";
          setMessage(errorMsg);
        } else {
          setMessage("حدث خطأ في الاتصال بالخادم، الرجاء المحاولة لاحقاً.");
        }
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        
        {/* حالة التحميل */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-forest-canopy border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-800">جاري التوثيق...</h2>
            <p className="text-gray-500">الرجاء الانتظار قليلاً</p>
          </div>
        )}

        {/* حالة النجاح */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">تم التوثيق!</h2>
            <p className="text-gray-600">{message}</p>
            <Link to="/" className="mt-6 inline-block w-full bg-forest-canopy text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
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
            <h2 className="text-2xl font-bold text-gray-800">عذراً</h2>
            <p className="text-gray-600">{message}</p>
            <Link to="/" className="mt-6 inline-block w-full border border-forest-canopy text-forest-canopy py-3 rounded-lg font-medium hover:bg-stone transition-colors">
              العودة لتسجيل الدخول
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};