import React from 'react';
import {
  ArrowRight, CheckCircle, Users, Heart, TrendingUp, Star,
  Check, Camera, Brain, Dumbbell, ShoppingCart, Leaf
} from 'lucide-react';
import { motion } from 'motion/react';
import njerkaLogo from '/image.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const pricingPlans = [
  {
    name: 'Individual',
    price: 12,
    features: ['Advanced AI Meal Gen', 'Personalized Workouts', 'Auto-Grocery Sync', 'Meal Scanning (Camera)', 'Priority Support'],
    buttonText: 'Get Individual',
  },
  {
    name: 'Family Plan',
    price: 29,
    isBest: true,
    features: ['Up to 6 Family Members', 'Unified Grocery List', 'Family Challenges & Leaderboard', 'Parental Controls', 'Dietitian Consultation', 'All Individual Features'],
    buttonText: 'Create Family Plan',
  },
  {
    name: 'Pro',
    price: 49,
    features: ['Everything in Family', 'Unlimited Members', '1-on-1 Dietitian Sessions', 'InBody Analysis AI', 'White-glove Onboarding', 'API Access'],
    buttonText: 'Go Pro',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={njerkaLogo} alt="Njerka" className="h-10 w-auto object-contain" />
            <span className="font-extrabold text-xl text-green-800 tracking-tight">Njerka</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-green-700 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-green-700 transition-colors">Pricing</a>
            <a href="#vision" className="hover:text-green-700 transition-colors">Vision</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-slate-600 font-semibold hover:text-green-700 transition-colors hidden sm:block text-sm">
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 transition-all active:translate-y-0 text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 overflow-hidden relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-100/70 rounded-full blur-3xl -z-10 mix-blend-multiply"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 2 }}
          className="absolute top-20 right-0 w-[600px] h-[600px] bg-emerald-100/60 rounded-full blur-3xl -z-10 mix-blend-multiply"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/50 rounded-full blur-3xl -z-10 mix-blend-multiply"
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white border border-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm mb-8 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600" />
              </span>
              New: Family Mode 2.0 is live
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold leading-[1.08] mb-6 tracking-tight text-slate-900">
              Precision Nutrition,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-800 via-green-600 to-emerald-700">
                Powered by AI.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
              The first medical-grade ecosystem that adapts to your biology. Generate personalized meal plans, workouts, and grocery lists for your entire family.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className="bg-gradient-to-r from-green-800 to-green-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-200/60 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                Start Your Transformation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <button
                onClick={onLogin}
                className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:border-slate-300"
              >
                View Demo
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span>Loved by <span className="text-slate-900 font-bold">10,000+</span> families</span>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-6 flex flex-wrap gap-3">
              {['HIPAA Compliant', 'Medical-Grade AI', '14-Day Free Trial'].map(badge => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" /> {badge}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGhlYWx0aHklMjBtZWFsJTIwcHJlcCUyMGJvd2xzJTIwb3ZlcmhlYWR8ZW58MXx8fHwxNzc2NDU2MDg2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Njerka Nutrition"
                className="rounded-3xl shadow-2xl border-8 border-white hover:scale-[1.02] transition-transform duration-500"
              />
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}
                className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 w-60"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">🔥</div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Streak</p>
                  <p className="font-black text-slate-900 text-lg">Start yours!</p>
                  <div className="flex gap-0.5 mt-1">
                    {Array(7).fill(0).map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full flex-1 ${i < 0 ? 'bg-orange-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1.5 }}
                className="absolute -top-10 -right-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 w-60"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Family Plan</p>
                  <p className="font-black text-slate-900">Coming Soon</p>
                  <p className="text-xs text-green-600 font-semibold mt-0.5">Enable in settings</p>
                </div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl"
              >
                <Brain className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold">AI Analyzing...</span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section id="vision" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 mb-8">
                <Heart className="w-8 h-8 fill-current" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Vision</h2>
              <p className="text-xl text-green-700 font-semibold mb-4">The Future of AI Health</p>
              <p className="text-lg text-slate-500 mb-6 leading-relaxed">
                We believe that health isn't a solo journey. It's built at the dinner table, in the grocery store, and during weekend activities.
              </p>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-xl text-green-600 font-semibold mb-4">Sustainable Nutrition Without Deprivation</p>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                To democratize medical-grade nutrition and fitness science — making it accessible not just to elite athletes, but to busy parents, growing children, and everyone in between.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-4 border-green-700 pl-6">
                  <h4 className="font-bold text-2xl text-slate-900 mb-1">98%</h4>
                  <p className="text-slate-500 text-sm">Success Rate</p>
                </div>
                <div className="border-l-4 border-green-600 pl-6">
                  <h4 className="font-bold text-2xl text-slate-900 mb-1">2.5M+</h4>
                  <p className="text-slate-500 text-sm">Meals Planned</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-800 to-green-600 rounded-3xl rotate-3 opacity-20 transform translate-y-4 translate-x-4" />
              <img
                src="https://images.unsplash.com/photo-1758874961000-d8b11690ce22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBjb29raW5nJTIwaGVhbHRoeSUyMG1lYWwlMjBraXRjaGVuJTIwaGFwcHl8ZW58MXx8fHwxNzY4NzA1OTI3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Family Cooking Healthy Meal"
                className="rounded-3xl shadow-xl relative z-10 w-full h-[500px] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-green-700 font-bold tracking-wider uppercase text-sm">Why Njerka?</span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4 mt-2">More Than Just Calorie Counting</h2>
            <p className="text-slate-500 text-lg">We engineer your lifestyle using data, not guesswork.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { title: 'AI-Meal-Sync', desc: 'Our AI engine generates recipes based on your unique metabolic rate, religion, dietary preferences, allergies, and taste. Every meal is yours alone.', icon: <Brain />, color: 'bg-green-100 text-green-700', glow: 'hover:shadow-green-100' },
              { title: 'Family Health Hub', desc: 'Manage nutrition for your entire family from one account. Individual calorie targets, shared grocery lists, and family challenge leaderboards.', icon: <Users />, color: 'bg-emerald-100 text-emerald-700', glow: 'hover:shadow-emerald-100' },
              { title: 'Computer Vision Streaks', desc: 'Use your camera to scan and verify meals. Our AI recognizes food, logs nutrition automatically, and maintains your daily streak like Snapchat.', icon: <Camera />, color: 'bg-orange-100 text-orange-600', glow: 'hover:shadow-orange-100' },
              { title: 'Dynamic Fitness', desc: "Describe your fitness goal in your own words. Get a personalized weekly plan — whether it's home cardio, gym strength, or yoga recovery.", icon: <Dumbbell />, color: 'bg-green-100 text-green-800', glow: 'hover:shadow-green-100' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl ${feature.glow} hover:-translate-y-1 transition-all duration-300 group`}
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(feature.icon as React.ReactElement, { className: 'w-7 h-7' })}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
            {[
              { title: 'Smart Grocery Sync', desc: 'Weekly meal plans auto-generate a sorted, categorized shopping list.', icon: <ShoppingCart />, color: 'bg-yellow-100 text-yellow-600' },
              { title: 'Medical-Grade Insights', desc: 'Upload blood work & InBody scans. Our AI analyzes and adapts your plan.', icon: <CheckCircle />, color: 'bg-blue-100 text-blue-600' },
              { title: 'Community Challenges', desc: 'Compete with friends and family on step counts, meal streaks, and goals.', icon: <TrendingUp />, color: 'bg-red-100 text-red-600' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.4 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex gap-4"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(feature.icon as React.ReactElement, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 text-lg">Invest in your health for less than the cost of a coffee a day.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {pricingPlans.map((plan) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                className={`p-8 rounded-3xl border transition-colors bg-white ${
                  plan.isBest 
                    ? 'relative bg-green-900 text-white shadow-2xl scale-105 z-10'
                    : 'hover:border-green-200'
                }`}
                style={plan.isBest ? { boxShadow: '0 0 0 2px #166534, 0 25px 50px -12px rgba(22,101,52,0.45)' } : {}}
              >
                {plan.isBest && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg shadow-green-200 whitespace-nowrap">
                    ✨ BEST VALUE
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.isBest ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.isBest ? 'text-green-200' : 'text-slate-500'}`}>
                  {plan.name === 'Individual' && 'For individuals starting out.'}
                  {plan.name === 'Family Plan' && 'Total health for the household.'}
                  {plan.name === 'Pro' && 'For the serious health optimizer.'}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.isBest ? 'text-white' : 'text-slate-900'}`}>${plan.price}</span>
                  <span className={plan.isBest ? 'text-green-200' : 'text-slate-500'}>/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((item) => (
                    <li key={item} className={`flex items-center gap-3 text-sm ${plan.isBest ? 'text-green-100' : 'text-slate-600'}`}>
                      <div className={`rounded-full p-0.5 flex-shrink-0 ${plan.isBest ? 'bg-green-700' : ''}`}>
                        <Check className={`w-3 h-3 ${plan.isBest ? 'text-white' : 'text-green-600'}`} />
                      </div> {item}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${
                    plan.isBest 
                      ? 'bg-white text-green-900 hover:bg-green-50' 
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 rounded-[2.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold mb-8 border border-white/20">
                <Leaf className="w-4 h-4" /> Powered by Medical-Grade AI
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">Join Njerka Today</h2>
              <p className="text-green-100 text-xl mb-10 leading-relaxed">
                Join thousands of users who have transformed their health with our AI-powered ecosystem. Start your 14-day free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onGetStarted}
                  className="bg-white text-green-800 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
                >
                  Start Your Transformation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="bg-white/10 border border-white/30 backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Log In
                </button>
              </div>
              <p className="mt-8 text-sm text-green-200 opacity-80">No credit card required for trial.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={njerkaLogo} alt="Njerka" className="h-12 w-auto object-contain" />
                <span className="font-extrabold text-xl text-green-800 tracking-tight">Njerka</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering families to live healthier, longer lives through medical-grade AI technology and community.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-green-700">Features</a></li>
                <li><a href="#pricing" className="hover:text-green-700">Pricing</a></li>
                <li><a href="#" className="hover:text-green-700">Family Mode</a></li>
                <li><a href="#" className="hover:text-green-700">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-green-700">About</a></li>
                <li><a href="#" className="hover:text-green-700">Careers</a></li>
                <li><a href="#" className="hover:text-green-700">Blog</a></li>
                <li><a href="#" className="hover:text-green-700">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-green-700">Privacy</a></li>
                <li><a href="#" className="hover:text-green-700">Terms</a></li>
                <li><a href="#" className="hover:text-green-700">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">© 2026 Njerka Inc. All rights reserved. Nourish · Move · Thrive</p>
            <div className="flex gap-3">
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <div key={s} className="w-8 h-8 bg-slate-100 hover:bg-green-100 hover:text-green-700 rounded-full flex items-center justify-center text-slate-400 cursor-pointer transition-colors text-xs font-bold">
                  {s[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};