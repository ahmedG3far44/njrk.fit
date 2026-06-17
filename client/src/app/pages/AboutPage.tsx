import React from "react";
import { Link } from "react-router-dom";
import NjerkaLogo from "../components/NjerkaLogo";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, Target, Heart, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export const AboutPage: React.FC = () => {
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
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الجيل القادم من التدريب الشخصي</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                عن منصة <span className="text-green-700">Njerak.fit</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                شريكك الصحي الذكي المتكامل لتحقيق أهدافك الغذائية والبدنية بدقة متناهية وسهولة مطلقة باستخدام أحدث تقنيات الذكاء الاصطناعي.
              </p>
            </div>

            {/* Vision & Mission Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">رؤيتنا</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  أن نكون المنصة العربية الرائدة عالمياً التي تجعل نمط الحياة الصحي والرياضي المتكامل متاحاً وممكناً لكل فرد وعائلة، من خلال كسر حواجز التكلفة العالية وصعوبات التخطيط التقليدي اليدوي.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">رسالتنا</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  تمكين المستخدمين من إحداث تغيير حقيقي ومستدام في صحتهم عبر تقديم خطط وجبات ذكية وبرامج تدريبية متطورة مصممة خصيصاً بناءً على قياساتهم الحيوية، حساسياتهم الغذائية وتفضيلاتهم الشخصية.
                </p>
              </div>
            </div>

            {/* Core Values / Features */}
            <div className="space-y-6 pt-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center">ما الذي يجعل Njerak.fit فريداً؟</h2>
              
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">ذكاء اصطناعي فائق الدقة</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      نقوم بتحليل قياساتك الحيوية ومستوى نشاطك لتوليد خطط تغذية وتمارين مخصصة 100% تطابق احتياجات جسمك من السعرات الحرارية والماكروز تلقائياً.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🥗</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">مراعاة الحساسية والقيود الغذائية</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      سواء كنت نباتياً، تتبع نظام كيتو، تعاني من حساسية الألبان أو المكسرات، أو تتبع قيوداً دينية محددة، فإن النظام يتجنب المكونات الممنوعة تماماً ويصمم بدائل آمنة ولذيذة.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">تزامن قائمة المشتريات التلقائي</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      يقوم النظام بتجميع كافة المكونات اللازمة لخطتك الغذائية الأسبوعية وتلخيصها في قائمة تسوق ذكية مقسمة حسب الفئات لتسهيل عملية الشراء والطهي.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">التكامل العائلي والمجموعات</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      ندعم نظام المجموعات والاشتراكات العائلية لتمكين العائلات من التخطيط الجماعي والتحفيز المستمر ومشاركة الوجبات بسهولة فائقة لترسيخ عادات صحية مشتركة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Hero Section (EN) */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Next Generation of Personal Training</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                About <span className="text-green-700">Njerak.fit</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Your intelligent, all-in-one health partner to achieve your fitness and nutritional goals with ultimate precision and absolute ease using advanced AI.
              </p>
            </div>

            {/* Vision & Mission Cards (EN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Our Vision</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  To be the leading global platform making a healthy, structured lifestyle accessible and achievable for every individual and family, breaking the barriers of high coaching costs and manual planning.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Our Mission</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  To empower users to make real, sustainable health changes by delivering precision meal plans and advanced workouts customized exactly to their biometric profiles, dietary limits, and taste.
                </p>
              </div>
            </div>

            {/* Core Values / Features (EN) */}
            <div className="space-y-6 pt-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center">What Makes Njerak.fit Unique?</h2>
              
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Ultra-Precise AI Core</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      We analyze your physical markers and lifestyle to generate 100% personalized meal and training plans that perfectly balance your calories and macros automatically.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🥗</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Allergies & Restrictions Handled</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Whether you are vegan, keto, lactose-intolerant, or have religious meal restrictions, the system completely avoids restricted ingredients and devises delicious alternatives.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Automated Grocery List Sync</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      The platform aggregates all necessary ingredients from your weekly meal plan and builds a categorized smart shopping list for painless checkout.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 flex gap-4 items-start">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Family & Group Integration</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Our system supports shared family subscriptions to plan healthy diets, coordinate group metrics, and build positive lifestyle habits together.
                    </p>
                  </div>
                </div>
              </div>
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
