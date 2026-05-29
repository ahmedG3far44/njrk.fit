import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthProvider';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const currentPath = location.pathname;
  const activeItem = navItems.find(item => currentPath === item.path)?.id || 'dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-stone overflow-hidden font-sans">
      {/* Logout Confirm */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-peak-white rounded-container p-6 max-w-sm w-full shadow-modal"
            >
              <div className="w-12 h-12 bg-ember/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-ember" />
              </div>
              <h3 className="text-heading text-summit-black text-center mb-2">Log Out?</h3>
              <p className="text-body text-trail-gray text-center mb-6">
                You'll need to log in again to access the admin panel.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-2.5 rounded-button border border-limestone font-semibold text-trail-gray text-sm hover:bg-stone transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-button bg-ember text-peak-white font-bold text-sm hover:opacity-90 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-pebble border-r border-limestone h-full shrink-0">
        <div className="p-5 pb-4 flex items-center gap-2.5 border-b border-limestone">
          <div className="w-8 h-8 rounded-lg bg-forest-canopy flex items-center justify-center">
            <Shield className="w-4 h-4 text-peak-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-summit-black">Njerka</span>
            <span className="text-label text-dust block leading-none mt-0.5">Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors relative group ${
                  isActive
                    ? 'bg-forest-floor text-forest-canopy'
                    : 'text-trail-gray hover:bg-stone hover:text-summit-black'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-forest-canopy rounded-r-full"
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  isActive ? 'bg-forest-canopy/10' : 'bg-transparent group-hover:bg-limestone/50'
                }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-forest-canopy' : 'text-dust'}`} />
                </div>
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-forest-canopy" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-limestone pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-forest-canopy/10 flex items-center justify-center">
              <span className="text-xs font-bold text-forest-canopy">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-summit-black truncate">{admin?.name || 'Admin'}</p>
              <p className="text-label text-dust">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ember/80 hover:bg-ember/5 hover:text-ember transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-peak-white border-b border-limestone px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-canopy flex items-center justify-center">
              <Shield className="w-4 h-4 text-peak-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-summit-black">Njerka</span>
              <span className="text-label text-dust block leading-none mt-0.5">Admin</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-trail-gray hover:bg-stone rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute top-[57px] left-0 right-0 bottom-0 bg-peak-white/98 z-20 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-1 pb-28">
                {navItems.map((item, i) => {
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                        isActive ? 'bg-forest-floor text-forest-canopy' : 'text-trail-gray hover:bg-stone'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-forest-canopy/10' : 'bg-stone'
                      }`}>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-forest-canopy' : 'text-dust'}`} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                      {isActive && <div className="ml-auto w-2 h-2 bg-forest-canopy rounded-full" />}
                    </Link>
                  );
                })}

                <div className="pt-4 mt-4 border-t border-limestone">
                  <div className="flex items-center gap-3 px-4 py-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-forest-canopy/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-forest-canopy">
                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-summit-black">{admin?.name || 'Admin'}</p>
                      <p className="text-label text-dust">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowLogout(true); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium text-ember/80 hover:bg-ember/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-ember/5">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Log Out</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
