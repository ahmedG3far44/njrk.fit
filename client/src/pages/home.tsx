import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeatureCard {
    icon: React.ReactNode;
    title: string;
    description: string;
    iconBg: string;
    size?: "large" | "small";
}

// ─── Hook: Intersection Observer ─────────────────────────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return { ref, inView };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const BoltIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13 2L4.5 13.5H11L10 22L20.5 10.5H14L13 2Z" />
    </svg>
);
const BrainIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5V5a2 2 0 0 0 4 0v-.5A2.5 2.5 0 0 1 18.5 2h.5a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-.5a2.5 2.5 0 0 0 0 5h.5a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-.5A2.5 2.5 0 0 1 16 19.5V19a2 2 0 0 0-4 0v.5A2.5 2.5 0 0 1 9.5 22H9a3 3 0 0 1-3-3v-1a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 0 0-5H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h.5Z" />
    </svg>
);
const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
);
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);
const DumbbellIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h18M3 14.5h18" />
        <rect x="2" y="8" width="2" height="8" rx="1" />
        <rect x="5" y="6" width="2" height="12" rx="1" />
        <rect x="17" y="6" width="2" height="12" rx="1" />
        <rect x="20" y="8" width="2" height="8" rx="1" />
    </svg>
);
const CartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);
const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
const TrendingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
);
const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);
const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0);
    const { ref, inView } = useInView();

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── FadeIn Wrapper ───────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const { ref, inView } = useInView();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// ─── Streak Dots ──────────────────────────────────────────────────────────────
function StreakDots() {
    return (
        <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className={`h-2 rounded-full ${i <= 4 ? "bg-orange-400 w-5" : "bg-gray-200 w-5"}`}
                    style={{ transition: `width 0.3s ease ${i * 100}ms` }}
                />
            ))}
        </div>
    );
}


function HomePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 100);
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
    }, []);

    const largeFeatures: FeatureCard[] = [
        {
            icon: <BrainIcon />, iconBg: "bg-purple-100 text-purple-600",
            title: "AI-Meal-Sync",
            description: "Our AI engine generates recipes based on your unique metabolic rate, religion, dietary preferences, allergies, and taste. Every meal is yours alone.",
            size: "large",
        },
        {
            icon: <UsersIcon />, iconBg: "bg-purple-100 text-purple-500",
            title: "Family Health Hub",
            description: "Manage nutrition for your entire family from one account. Individual calorie targets, shared grocery lists, and family challenge leaderboards.",
            size: "large",
        },
        {
            icon: <CameraIcon />, iconBg: "bg-orange-100 text-orange-500",
            title: "Computer Vision Streaks",
            description: "Use your camera to scan and verify meals. Our AI recognizes food, logs nutrition automatically, and maintains your daily streak like Snapchat.",
            size: "large",
        },
        {
            icon: <DumbbellIcon />, iconBg: "bg-green-100 text-green-600",
            title: "Dynamic Fitness",
            description: "Describe your fitness goal in your own words. Get a personalized weekly plan — whether it's home cardio, gym strength, or yoga recovery.",
            size: "large",
        },
    ];

    const smallFeatures = [
        {
            icon: <CartIcon />, iconBg: "bg-yellow-100 text-yellow-600",
            title: "Smart Grocery Sync",
            description: "Weekly meal plans auto-generate a sorted, categorized shopping list.",
        },
        {
            icon: <CheckCircleIcon />, iconBg: "bg-blue-100 text-blue-600",
            title: "Medical-Grade Insights",
            description: "Upload blood work & InBody scans. Our AI analyzes and adapts your plan.",
        },
        {
            icon: <TrendingIcon />, iconBg: "bg-pink-100 text-pink-600",
            title: "Community Challenges",
            description: "Compete with friends and family on step counts, meal streaks, and goals.",
        },
    ];

    const plans = [
        {
            name: "Basic Plan (Free)",
            sub: "For individuals starting out.",
            price: 0,
            features: ["Advanced AI Meal Gen", "Personalized Workouts", "Auto-Grocery Sync", "Meal Scanning (Camera)", "Priority Support"],
            cta: "Get Individual",
            highlight: false,
        },
        {
            name: "Family Plan",
            sub: "Total health for the household.",
            price: 49,
            features: ["Up to 6 Family Members", "Unified Grocery List", "Family Challenges & Leaderboard", "Parental Controls", "Dietitian Consultation", "All Individual Features"],
            cta: "Create Family Plan",
            highlight: true,
            badge: "✦ BEST VALUE",
        },
        {
            name: "Pro",
            sub: "For the serious health optimizer.",
            price: 29,
            features: ["Everything in Family", "Unlimited Members", "1-on-1 Dietitian Sessions", "InBody Analysis AI", "White-glove Onboarding", "API Access"],
            cta: "Go Pro",
            highlight: false,
        },
    ];

    return (
        <div className="min-h-screen bg-white font-sans overflow-x-hidden">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(109,40,217,0.4)} 70%{box-shadow:0 0 0 12px rgba(109,40,217,0)} 100%{box-shadow:0 0 0 0 rgba(109,40,217,0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes badge-bounce { 0%,100%{transform:translateY(-50%) scale(1)} 50%{transform:translateY(-50%) scale(1.05)} }
        .float-card { animation: float 4s ease-in-out infinite; }
        .float-card-delay { animation: float 4s ease-in-out 1.5s infinite; }
        .pulse-dot { animation: pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite; }
        .badge-bounce { animation: badge-bounce 2s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #6d28d9, #8b5cf6, #a855f7, #6d28d9);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .nav-link { position: relative; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:#6d28d9; transition:width 0.3s ease; }
        .nav-link:hover::after { width:100%; }
        .btn-primary { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(109,40,217,0.4); }
        .btn-primary:active { transform: translateY(0); }
        .plan-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .plan-card:hover { transform: translateY(-6px); }
      `}</style>

            {/* ── NAV ────────────────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-18">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <BoltIcon />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Njerka</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {["Vision", "Features", "Pricing"].map(l => (
                                <a key={l} href={`#${l.toLowerCase()}`} className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                    {l}
                                </a>
                            ))}
                        </div>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors px-3 py-2">Login</Link>
                            <Link to="/register" className="btn-primary bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md">
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors">
                            {menuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-3">
                        {["Features", "Pricing", "Vision"].map(l => (
                            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2 hover:text-purple-700 transition-colors">
                                {l}
                            </a>
                        ))}
                        <div className="flex gap-3 pt-2">
                            <a href="#" className="flex-1 text-center text-sm font-medium text-gray-700 border border-gray-200 py-2.5 rounded-full hover:border-purple-400 transition-colors">Log In</a>
                            <a href="#" className="flex-1 text-center btn-primary bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-full">Get Started</a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────────────────────────────── */}
            <section className="pt-20 lg:pt-24 pb-16 lg:pb-20 bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
                {/* Subtle background blobs */}
                <div className="absolute top-20 right-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        {/* Left */}
                        <div>
                            <div
                                className="inline-flex items-center gap-2 bg-white border border-purple-200 rounded-full px-4 py-1.5 text-sm text-gray-700 shadow-sm mb-6"
                                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(-12px)", transition: "opacity 0.5s ease 100ms, transform 0.5s ease 100ms" }}
                            >
                                <span className="w-2 h-2 rounded-full bg-purple-600 pulse-dot inline-block" />
                                New: Family Mode 2.0 is live
                            </div>

                            <h1
                                className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-black leading-[1.05] text-gray-900 mb-6"
                                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease 250ms, transform 0.6s ease 250ms" }}
                            >
                                Precision<br />
                                Nutrition,<br />
                                <span className="shimmer-text">Powered by AI.</span>
                            </h1>

                            <p
                                className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-md mb-8"
                                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease 400ms, transform 0.6s ease 400ms" }}
                            >
                                The first medical-grade ecosystem that adapts to your biology. Generate personalized meal plans, workouts, and grocery lists for your entire family.
                            </p>

                            <div
                                className="flex flex-col sm:flex-row gap-3 mb-8"
                                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease 550ms, transform 0.6s ease 550ms" }}
                            >
                                <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg text-sm sm:text-base">
                                    Start Your Transformation <ArrowRightIcon />
                                </Link>
                                {/* <Link to="/demo" className="inline-flex items-center justify-center border-2 border-gray-200 hover:border-purple-300 text-gray-700 font-semibold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-colors duration-200">
                                    View Demo
                                </Link> */}
                            </div>

                            <div
                                className="flex flex-col sm:flex-row sm:items-center gap-4"
                                style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 0.6s ease 700ms" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {["bg-rose-400", "bg-amber-400", "bg-blue-400", "bg-green-400"].map((c, i) => (
                                            <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                                                {["A", "B", "C", "D"][i]}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">Loved by <strong className="text-gray-700">10,000+</strong> families</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {["HIPAA Compliant", "Medical-Grade AI", "14-Day Free Trial"].map(b => (
                                        <span key={b} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                                            <span className="text-green-500">✓</span>{b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Hero image + floating cards */}
                        <div
                            className="relative"
                            style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.8s ease 400ms, transform 0.8s ease 400ms" }}
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] max-w-lg mx-auto lg:mx-0">
                                <img
                                    src="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"
                                    alt="Healthy meal prep containers"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Floating card – Family Plan */}
                            <div className="float-card absolute -top-4 -right-2 sm:right-4 lg:-right-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 min-w-[200px]">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <UsersIcon />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Family Plan</p>
                                    <p className="text-sm font-bold text-gray-900">Groceries Synced</p>
                                    <p className="text-[11px] text-green-600 font-medium">✓ 4 members active</p>
                                </div>
                            </div>

                            {/* Floating card – Streak */}
                            <div className="float-card-delay absolute -bottom-4 left-0 sm:left-4 bg-white rounded-2xl shadow-xl px-4 py-3 min-w-[180px]">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Streak</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🔥</span>
                                    <div>
                                        <p className="text-base font-black text-gray-900">Day 12!</p>
                                        <StreakDots />
                                    </div>
                                </div>
                            </div>

                            {/* AI analyzing badge */}
                            <div className="absolute bottom-12 right-0 sm:-right-2 bg-gray-900 text-white rounded-full px-4 py-2 flex items-center gap-2 text-xs font-semibold shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot inline-block" />
                                AI Analyzing...
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VISION ─────────────────────────────────────────────────────── */}
            <section id="vision" className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <FadeIn>
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
                                    <HeartIcon />
                                </div>
                            </FadeIn>
                            <FadeIn delay={100}>
                                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Our Vision</h2>
                                <p className="text-purple-600 font-bold mb-3">The Future of AI Health</p>
                                <p className="text-gray-500 leading-relaxed mb-8">
                                    We believe that health isn't a solo journey. It's built at the dinner table, in the grocery store, and during weekend activities.
                                </p>
                            </FadeIn>
                            <FadeIn delay={200}>
                                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Our Mission</h2>
                                <p className="text-green-600 font-bold mb-3">Sustainable Nutrition Without Deprivation</p>
                                <p className="text-gray-500 leading-relaxed mb-10">
                                    To democratize medical-grade nutrition and fitness science — making it accessible not just to elite athletes, but to busy parents, growing children, and everyone in between. Healthy years added to your family's life.
                                </p>
                            </FadeIn>
                            <FadeIn delay={300}>
                                <div className="flex gap-8">
                                    {[{ end: 98, suffix: "%", label: "Success Rate" }, { end: 2500000, suffix: "+", label: "Meals Planned" }].map(s => (
                                        <div key={s.label} className="border-l-4 border-purple-600 pl-4">
                                            <p className="text-3xl font-black text-gray-900">
                                                <AnimatedCounter end={s.end} suffix={s.suffix} />
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                        <FadeIn delay={200} className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                                <img
                                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
                                    alt="Family cooking together"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-100 rounded-2xl -z-10" />
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────────────────────── */}
            <section id="features" className="py-20 lg:py-28 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn className="text-center mb-14">
                        <p className="text-purple-600 font-bold uppercase tracking-widest text-xs mb-3">WHY NJERKA?</p>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">More Than Just Calorie Counting</h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">We engineer your lifestyle using data, not guesswork.</p>
                    </FadeIn>

                    {/* Large 2x2 grid */}
                    <div className="grid sm:grid-cols-2 gap-5 mb-5">
                        {largeFeatures.map((f, i) => (
                            <FadeIn key={f.title} delay={i * 100}>
                                <div className="card-hover bg-white rounded-2xl p-7 h-full shadow-sm border border-gray-100">
                                    <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-5`}>
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Small 3-col grid */}
                    <div className="grid sm:grid-cols-3 gap-5">
                        {smallFeatures.map((f, i) => (
                            <FadeIn key={f.title} delay={i * 100}>
                                <div className="card-hover bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                                        {f.icon}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ────────────────────────────────────────────────────── */}
            <section id="pricing" className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-gray-500 text-lg">Invest in your health for less than the cost of a coffee a day.</p>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                        {plans.map((plan, i) => (
                            <FadeIn key={plan.name} delay={i * 150}>
                                <div
                                    className={`plan-card relative rounded-3xl p-7 h-full flex flex-col shadow-lg ${plan.highlight
                                        ? "bg-gray-900 text-white shadow-purple-900/30 shadow-2xl scale-100 md:scale-105"
                                        : "bg-white border border-gray-100"
                                        }`}
                                >
                                    {plan.badge && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 badge-bounce bg-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                                            {plan.badge}
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <h3 className={`text-xl font-black mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                                        <p className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.sub}</p>
                                    </div>
                                    <div className="mb-7">
                                        <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-gray-900"}`}>${plan.price}</span>
                                        <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>/mo</span>
                                    </div>
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-start gap-2.5">
                                                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? "bg-purple-600" : "bg-purple-100 text-purple-600"
                                                    }`}>
                                                    <CheckIcon />
                                                </span>
                                                <span className={`text-sm ${plan.highlight ? "text-gray-200" : "text-gray-600"}`}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href="#"
                                        className={`block text-center font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm ${plan.highlight
                                            ? "bg-white text-gray-900 hover:bg-gray-100"
                                            : "bg-gray-100 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                                            }`}
                                    >
                                        {plan.cta}
                                    </a>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto py-16 lg:py-20 px-4">
                <div className="w-full mx-auto">
                    <FadeIn>
                        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <div className="absolute top-8 left-8 w-40 h-40 bg-white rounded-full blur-3xl" />
                                <div className="absolute bottom-8 right-8 w-32 h-32 bg-white rounded-full blur-3xl" />
                            </div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-white text-xs font-semibold mb-6">
                                    <BoltIcon />
                                    Powered by Medical-Grade AI
                                </div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">Join Njerka Today</h2>
                                <p className="text-purple-200 text-base sm:text-lg max-w-xl mx-auto mb-8">
                                    Join thousands of users who have transformed their health with our AI-powered ecosystem. Start your 14-day free trial today.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                                    <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-8 py-3.5 rounded-xl text-sm sm:text-base hover:bg-gray-50">
                                        Start Your Transformation <ArrowRightIcon />
                                    </Link>
                                    <Link to="/login" className="inline-flex items-center justify-center border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-xl text-sm sm:text-base hover:bg-white/10 transition-colors">
                                        Login →
                                    </Link>
                                </div>
                                <p className="text-purple-300 text-xs">No credit card required for trial.</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────────────── */}
            <footer className="bg-white border-t border-gray-100 pt-14 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <a href="#" className="inline-flex items-center gap-2 mb-4 group">
                                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <BoltIcon />
                                </div>
                                <span className="text-xl font-bold text-gray-900">Njerka</span>
                            </a>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                                Empowering families to live healthier, longer lives through medical-grade AI technology and community.
                            </p>
                        </div>

                        {/* Links */}
                        {[
                            { heading: "Product", links: ["Features", "Pricing", "Family Mode", "Reviews"] },
                            { heading: "Company", links: ["About", "Careers", "Blog", "Contact"] },
                            { heading: "Legal", links: ["Privacy", "Terms", "Security"] },
                        ].map(col => (
                            <div key={col.heading}>
                                <p className="text-sm font-bold text-gray-900 mb-4">{col.heading}</p>
                                <ul className="space-y-2.5">
                                    {col.links.map(l => (
                                        <li key={l}>
                                            <a href="#" className="text-sm text-gray-500 hover:text-purple-700 transition-colors">{l}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-400">© 2026 Njerka Inc. All rights reserved.</p>
                        <div className="flex gap-3">
                            {["Twitter", "LinkedIn", "Instagram"].map(s => (
                                <a key={s} href="#"
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center text-gray-400 transition-colors text-xs font-bold"
                                    aria-label={s}>
                                    {s[0]}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}



export default HomePage;
