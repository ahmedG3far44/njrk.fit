import React from "react";
import { Link } from "react-router-dom";
import NjerkaLogo from "../components/NjerkaLogo";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export const TermsSecurityPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  return (
    <div 
      className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-green-100 selection:text-green-900 flex flex-col" 
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <NjerkaLogo />
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold text-green-700 hover:text-green-800 hover:bg-green-50">
              {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              <span>{isArabic ? "العودة للرئيسية" : "Back to Home"}</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {isArabic ? (
          <div className="space-y-12">
            {/* Header section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>شروط الاستخدام الشفافة ومعايير الأمان الموثوقة</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                الشروط والأحكام ومعايير الأمان لـ <span className="text-green-700">Njerak.fit</span>
              </h1>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                تاريخ آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Terms and Security details */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 leading-relaxed">
              
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚖️</span> 1. شروط استخدام الخدمة
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  باستخدامك لمنصة <strong>Njerak.fit</strong>، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم التسجيل أو استخدام المنصة.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> 2. إخلاء مسؤولية طبي هام جداً
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed text-amber-800 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <strong>تنبيه هام:</strong> كافة البرامج الغذائية وخطط التمارين الرياضية التي يتم توليدها بواسطة الذكاء الاصطناعي على منصتنا هي لأغراض إرشادية وتثقيفية فقط، <strong>ولا تعتبر بديلاً عن الاستشارات الطبية الاحترافية</strong> أو رأي طبيبك المختص. يجب عليك استشارة طبيب مؤهل قبل البدء بأي برنامج رياضي أو نظام غذائي جديد، خصوصاً إذا كنت تعاني من أمراض مزمنة، السكري، أمراض القلب، أو حالات صحية خاصة كالحمل والرضاعة.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔑</span> 3. مسؤولية الحساب ودقة البيانات
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  تقع على عاتق المستخدم المسؤولية الكاملة عن:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li>إدخال بيانات دقيقة تماماً فيما يتعلق بالوزن، الطول، الحساسيات الغذائية، والقيود الصحية لضمان سلامة وفاعلية الخطط الموصى بها.</li>
                  <li>الحفاظ على سرية معلومات تسجيل الدخول وكلمة المرور الخاصة بحسابك، وإبلاغنا فوراً في حال الشك بوجود اختراق أو استخدام غير مصرح به.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">💳</span> 4. الاشتراكات والدفع وإلغاء الخدمة
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  توفر Njerak.fit اشتراكات شهرية وسنوية لتمكين الوصول إلى المزايا والخطط الغذائية والرياضية المتقدمة:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li>يتم تجديد الاشتراكات تلقائياً في نهاية كل فترة محاسبية ما لم يقم المستخدم بإلغاء التجديد التلقائي من إعدادات حسابه قبل تاريخ التجديد.</li>
                  <li>تتم معالجة كافة المدفوعات بطرق مشفرة عبر بوابات الدفع المعتمدة عالمياً.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔒</span> 5. معايير الحماية والأمان العالية
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  نحن نضع أمان بياناتك الشخصية والمالية على رأس أولوياتنا، ونطبق معايير صارمة تشمل:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li><strong>حماية الاتصالات (Encryption):</strong> يتم تشفير كافة حركات مرور البيانات والاتصالات بين متصفحك وخوادمنا بالكامل عبر بروتوكول التشفير الآمن <strong>HTTPS (SSL/TLS)</strong>.</li>
                  <li><strong>أمان المدفوعات الإلكترونية:</strong> نستخدم بوابة الدفع المعتمدة عالمياً <strong>Stripe</strong> التي تلتزم بأعلى معايير أمان معالجة بيانات بطاقات الدفع (PCI-DSS)، مما يعني عدم تخزين أو معالجة تفاصيل بطاقتك المالية على خوادمنا نهائياً.</li>
                  <li><strong>تأمين الخوادم المستمر:</strong> نقوم بإجراء مراجعات دورية وفحص ثغرات لضمان أقصى حماية ممكنة لبيانات مستخدمينا من أي هجمات أو تسريبات إلكترونية.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">📞</span> 6. اتصل بنا
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  إذا كان لديك أي استفسار، تعليق أو طلب يتعلق بالشروط والأحكام أو معايير الحماية المتبعة، يرجى مراسلتنا مباشرة على البريد الإلكتروني المعتمد للدعم: <a href="mailto:ruxinftw@gmail.com" className="text-green-700 hover:underline font-semibold">ruxinftw@gmail.com</a>.
                </p>
              </section>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header section (EN) */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Transparent terms of use and reliable security standards</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                Terms & Security Standards for <span className="text-green-700">Njerak.fit</span>
              </h1>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Terms and Security details (EN) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 leading-relaxed">
              
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚖️</span> 1. Terms of Service
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  By accessing and utilizing <strong>Njerak.fit</strong>, you explicitly consent to abide by these Terms and Conditions. If you disagree with any portion of these conditions, please refrain from registering or using the platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> 2. Crucial Medical Disclaimer
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed text-amber-800 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <strong>CRITICAL WARNING:</strong> All meal plans and exercise programs generated by our artificial intelligence are for educational and motivational purposes only. <strong>They do not serve as a replacement for professional medical consultation</strong> or diagnosis. Consult a qualified healthcare professional before beginning any physical training or diet regime, particularly if you have chronic medical conditions, diabetes, cardiac problems, or unique physical states such as pregnancy.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔑</span> 3. Account Responsibility & Biometrics
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Users bear sole responsibility for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li>Inputting fully accurate biological details (weight, height, age, allergies) to ensure the safety and efficacy of the recommended plans.</li>
                  <li>Maintaining strict confidentiality of account login credentials and immediately alerting us to any suspected breaches.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">💳</span> 4. Billing, Subscription & Cancellations
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Njerak.fit offers periodic premium subscriptions to access advanced features:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li>Subscriptions renew automatically unless cancelled before the end of the current billing cycle through your account settings.</li>
                  <li>Transactions are processed securely; we do not store any banking credentials.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔒</span> 5. Security & Safe Processing Standards
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We enforce world-class data protection protocols:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li><strong>HTTPS Transfer:</strong> All user-to-server traffic is encrypted fully over <strong>SSL/TLS</strong> standards.</li>
                  <li><strong>Financial Security:</strong> Payment cards are processed securely by Stripe under international PCI-DSS compliance regulations. No debit or credit card details are ever saved or processed directly on our servers.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">📞</span> 6. Contact Us
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  For any inquiries, requests, or questions regarding our terms or safe processing architecture, contact our support team directly at: <a href="mailto:ruxinftw@gmail.com" className="text-blue-600 hover:underline font-semibold">ruxinftw@gmail.com</a>.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Njerak.fit. {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
};
