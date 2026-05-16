import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Users,
  LineChart,
  Settings,
  X,
  Calendar,
  ShoppingCart,
  Flame,
  MoreHorizontal,
  Bell,
  ChevronRight,
  Zap,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NjerkaLogo from './NjerkaLogo';
import { useAuth } from '../context/AuthProvider';


interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user } = useAuth();
  const navItems = [
    { id: 'insights', label: 'Dashboard', icon: LayoutDashboard, color: 'text-green-700' },
    { id: 'streaks', label: 'Streaks & Rewards', icon: Flame, color: 'text-orange-500' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'text-blue-600' },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'text-green-700' },
    { id: 'grocery', label: 'Grocery List', icon: ShoppingCart, color: 'text-emerald-600' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-green-800' },
    { id: 'progress', label: 'Progress', icon: LineChart, color: 'text-blue-500' },
    { id: 'community', label: 'Community', icon: Users, color: 'text-pink-600' },
    { id: 'subscriptions', label: 'Subscription', icon: Zap, color: 'text-amber-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-500' },
  ];

  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: LineChart },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* ── Logout Confirmation Dialog ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Log Out?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                You'll be returned to the landing page. Your data is always saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-full relative">
        {/* Logo */}
        <div className="p-5 pb-3 flex items-start justify-start border-b border-slate-100">
          <NjerkaLogo size='small' text={true} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-3">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors relative group ${isActive
                  ? 'bg-green-50 text-green-800'
                  : 'text-slate-500 hover:bg-green-50 cursor-pointer hover:text-slate-900 active:scale-[0.98]'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-700 rounded-r-full"
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isActive ? 'bg-green-100' : 'bg-transparent group-hover:bg-slate-100'
                  }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                </div>
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-green-500" />}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-red-100 transition-colors flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm">Log Out</span>
          </button>
        </div>

        {/* Family Plan CTA */}
        <div className="p-4 border-t border-slate-100">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-800 to-green-700 rounded-2xl p-4 text-white relative overflow-hidden cursor-pointer"
            onClick={() => onChangeView('settings')}
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm relative z-10">
              <Users className="w-4 h-4" /> {user?.subscription?.subscriptionTier === "BASIC" ? "Free" : user?.subscription?.subscriptionTier === "PRO" ? "Pro" : "Family"} Plan
            </div>
            <p className="text-xs text-green-200 mb-3 relative z-10 leading-relaxed">
              {user?.subscription?.subscriptionTier === "BASIC" ? "Upgrade to unlock more features" : user?.subscription?.subscriptionTier === "PRO" ? "Upgrade to Family Plan to add more members." : "Manage your family's nutrition."}
            </p>
            <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-xs font-bold py-2 px-3 rounded-xl transition-colors w-fit relative z-10">
              Manage Profiles <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-3 flex items-center justify-between z-20 relative">
          <img src={"./image.png"} alt="Njerka" className="h-10 w-auto object-contain" />

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Full Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="absolute top-[61px] left-0 right-0 bottom-0 bg-white/95 backdrop-blur-xl z-20 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-1 pb-28">
                {navItems.map((item, i) => {
                  const isActive = currentView === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      onClick={() => {
                        onChangeView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${isActive ? 'bg-green-50 text-green-800' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                        <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-400'}`} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                      {isActive && <div className="ml-auto w-2 h-2 bg-green-600 rounded-full" />}
                    </motion.button>
                  );
                })}

                {/* Mobile Logout */}
                <motion.button
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Log Out</span>
                </motion.button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth pb-24 lg:pb-10">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
          <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 px-2 pt-2 pb-4 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-around max-w-md mx-auto">
              {bottomNavItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onChangeView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavActive"
                        className="absolute inset-0 bg-green-50 rounded-2xl"
                      />
                    )}
                    <div className="relative z-10">
                      <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-green-700' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-[10px] font-bold relative z-10 transition-colors ${isActive ? 'text-green-700' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* More Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all relative"
              >
                {isMobileMenuOpen && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute inset-0 bg-slate-100 rounded-2xl"
                  />
                )}
                <div className="relative z-10">
                  {isMobileMenuOpen
                    ? <X className="w-5 h-5 text-slate-700" />
                    : <MoreHorizontal className="w-5 h-5 text-slate-400" />
                  }
                </div>
                <span className={`text-[10px] font-bold relative z-10 ${isMobileMenuOpen ? 'text-slate-700' : 'text-slate-400'}`}>
                  More
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
