import React from "react";
import { Link } from "react-router-dom";
import NjerkaLogo from "../components/NjerkaLogo";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PrivacyPage: React.FC = () => {
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>خصوصيتك وأمان بياناتك هي التزامنا المطلق</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                سياسة الخصوصية لـ <span className="text-emerald-700">Njerak.fit</span>
              </h1>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                تاريخ آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Privacy Details Grid */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 leading-relaxed">
              
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">📋</span> 1. مقدمة تمهيدية
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  في منصة <strong>Njerak.fit</strong>، نعتبر أمن معلوماتك الشخصية والصحية خطاً أحمر. نلتزم تماماً بحماية خصوصيتك وضمان أن تكون تجربتك الرقمية معنا آمنة وجديرة بالثقة. توضح هذه السياسة طبيعة البيانات التي نجمعها، كيفية معالجتها واستخدامها لتصميم خطط الوجبات والتمارين، والتدابير المتخذة لضمان حمايتها.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔍</span> 2. البيانات التي نقوم بجمعها
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  لكي نتمكن من تقديم توصيات رياضية وغذائية فائقة الدقة عبر الذكاء الاصطناعي، نقوم بجمع الفئات التالية من البيانات:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li><strong>معلومات الحساب الأساسية:</strong> الاسم الكامل، عنوان البريد الإلكتروني، وتفاصيل الدخول الآمنة.</li>
                  <li><strong>البيانات الجسدية والحيوية:</strong> الوزن، الطول، العمر، الجنس، والقياسات البدنية التي تحدد احتياجك من الطاقة.</li>
                  <li><strong>أهداف اللياقة والنشاط:</strong> هدفك الشخصي (خسارة وزن، بناء عضلات، تحسين صحة عامة) ومستوى نشاطك البدني اليومي.</li>
                  <li><strong>التفضيلات والقيود الغذائية:</strong> أنواع الأطعمة المفضلة لديك، الحساسيات الغذائية (مثل حساسية الجلوتين أو المكسرات)، والقيود الغذائية الدينية (مثل الأطعمة الحلال).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚙️</span> 3. كيف نستخدم بياناتك الشخصية
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  نحن نستخدم بياناتك للأغراض التشغيلية وتصميم الخدمة فقط، بما يشتمل على:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li>تحليل القياسات الحيوية وحساب معدلات الأيض الأساسي (BMR) وحرق الطاقة (TDEE).</li>
                  <li>توليد وتخصيص وجبات ومخططات غذائية ورياضية متكاملة تتوافق مع تفضيلاتك وحساسياتك بدقة.</li>
                  <li>تتبع تقدمك البدني ومساعدتك في رصد الإنجازات والالتزام بالبرنامج.</li>
                  <li>مزامنة قائمة المشتريات لتزويدك بملخص دقيق للمكونات التي تحتاج إلى تسوقها.</li>
                  <li>التواصل معك لتقديم الدعم الفني، الإجابة عن الاستفسارات، وتنبيهك بالتغييرات الهامة في المنصة.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🛡️</span> 4. أمن وحماية البيانات
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  نطبق في Njerak.fit أفضل المعايير التقنية العالمية لتأمين بياناتك، بما في ذلك:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li>استخدام بروتوكول نقل البيانات الآمن والمشفر بالكامل <strong>SSL/TLS</strong> لمنع أي محاولة اعتراض للمعلومات.</li>
                  <li>تخزين كلمات المرور والبيانات الحساسة على خوادم محمية ومشفرة باستخدام خوارزميات تشفير أحادية الاتجاه غير قابلة للاختراق.</li>
                  <li><strong>المدفوعات الآمنة:</strong> تتم معالجة المعاملات المالية بالكامل من خلال بوابات دفع عالمية معتمدة وآمنة (مثل Stripe)، ولا نقوم بتخزين تفاصيل بطاقاتك الائتمانية على خوادمنا أبداً.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🤝</span> 5. مشاركة البيانات مع أطراف ثالثة
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  نحن <strong>لا نبيع ولا نؤجر ولا نشارك</strong> بياناتك الشخصية أو الصحية مع أي جهات خارجية أو أطراف ثالثة لأغراض تسويقية أو تجارية على الإطلاق. قد نستخدم فقط خدمات التحليل المجهولة لتحسين أداء المنصة أو بوابات الدفع لإتمام اشتراكك بأمان.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔐</span> 6. حقوقك القانونية على بياناتك
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  بصفتك مستخدماً في Njerak.fit، فإنك تمتلك السيطرة الكاملة على بياناتك، بما يشتمل على:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mr-4">
                  <li>حق الوصول إلى بياناتك الشخصية والحيوية ومراجعتها وتحديثها في أي وقت من الإعدادات.</li>
                  <li>حق طلب حذف حسابك نهائياً وكافة البيانات المرتبطة به من خوادمنا عبر مراسلتنا على البريد الإلكتروني المعتمد.</li>
                </ul>
              </section>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header section (EN) */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Your privacy and data security is our absolute commitment</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                Privacy Policy for <span className="text-emerald-700">Njerak.fit</span>
              </h1>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Privacy Details Grid (EN) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 leading-relaxed">
              
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">📋</span> 1. Introduction
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  At <strong>Njerak.fit</strong>, we consider the security of your personal and health information to be paramount. We are fully committed to protecting your privacy and ensuring your digital experience with us is safe and trustworthy. This policy details what data we collect, how we process it, and how we safeguard it.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔍</span> 2. Data We Collect
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To supply precise physical and nutrition recommendations through AI, we collect:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li><strong>Account Information:</strong> Your full name, email address, and secure login details.</li>
                  <li><strong>Biometric Data:</strong> Weight, height, age, gender, and physical statistics that determine calorie needs.</li>
                  <li><strong>Fitness Goals & Activity:</strong> Your main target (weight loss, muscle gain, general wellness) and daily activity level.</li>
                  <li><strong>Dietary Limits:</strong> Taste preferences, allergies (e.g. gluten, lactose, nuts), and religious constraints (e.g. Halal).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">⚙️</span> 3. How We Use Your Data
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We use your personal and physical variables strictly to tailor our systems:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li>To calculate precise metabolic stats like BMR and daily calorie expenditure (TDEE).</li>
                  <li>To construct customized meal plans, nutrition ratios, and physical workout schemes.</li>
                  <li>To synchronize and build your automated weekly grocery lists.</li>
                  <li>To contact you regarding crucial account updates, system support, or changes in terms.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🛡️</span> 4. Safety & Security Protocols
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We enforce world-class technologies to protect your details:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
                  <li><strong>Connection Encryption:</strong> All traffic between your browser and our servers is secured over <strong>SSL/TLS (HTTPS)</strong>.</li>
                  <li><strong>Secure Payments:</strong> Monetary transactions are handled securely by global payment processors (Stripe). No credit card numbers are stored or saved on our servers.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🤝</span> 5. Third-Party Sharing
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We <strong>never sell, lease, or lease out</strong> your personal, nutritional, or biological information to any third parties for promotional or commercial aims whatsoever.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-lg">🔐</span> 6. Your Rights
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  You possess ultimate control of your data, including the right to view or modify your data anytime, or request permanent deletion of your profile and historical records.
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
