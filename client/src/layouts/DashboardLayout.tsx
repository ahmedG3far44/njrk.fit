import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Flame,
  CalendarDays,
  UtensilsCrossed,
  ShoppingCart,
  Dumbbell,
  TrendingUp,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Users2,
  ChevronRight,
  LucideActivity,
} from 'lucide-react'

// ─── Nav items matching the screenshot order ────────────────────────────────
const navItems = [
  { path: '/dashboard/insights', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/streaks', icon: Flame, label: 'Streaks & Rewards' },
  { path: '/dashboard/schedule', icon: CalendarDays, label: 'Schedule' },
  { path: '/dashboard/nutrition', icon: UtensilsCrossed, label: 'Nutrition' },
  { path: '/dashboard/groceries', icon: ShoppingCart, label: 'Grocery List' },
  { path: '/dashboard/fitness', icon: Dumbbell, label: 'Fitness' },
  { path: '/dashboard/progress', icon: TrendingUp, label: 'Progress' },
  { path: '/dashboard/community', icon: Users, label: 'Community' },
  { path: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

// ─── Brand logo ──────────────────────────────────────────────────────────────
const NjerkaLogo = () => (
  <Link to="/" className="flex items-center gap-2 hover:scale-95 hover:opacity-75 duration-300 cursor-pointer">
    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
      <LucideActivity size={16} className="text-white" />
    </div>
    <span className="text-[1.1rem] font-extrabold tracking-tight text-violet-700">
      Njerka
    </span>
  </Link>
)

// ─── Sidebar content (shared between desktop & mobile) ───────────────────────
interface SidebarContentProps {
  onClose?: () => void
}

const SidebarContent = ({ onClose }: SidebarContentProps) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().then(() => {
      navigate("/login")
    }).catch((error) => {
      console.log(error)
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Logo row ── */}
      <div className="px-5 py-5 flex items-center justify-between">
        <NjerkaLogo />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150
                    ${isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    }
                  `}
                >
                  {/* Active indicator bar */}
                  <span className={`
                    absolute left-0 w-[3px] h-7 rounded-r-full bg-violet-600 transition-opacity
                    ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-0'}
                  `} />

                  <Icon
                    className={`w-[1.1rem] h-[1.1rem] flex-shrink-0 transition-colors
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                    `}
                  />
                  <span className="truncate">{item.label}</span>

                  {/* Active chevron */}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-200" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Family Plan upsell card ── */}
      <div className="px-3 pb-3 pt-2">
        <div className="rounded-2xl bg-violet-600 p-4 text-white relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-violet-500 opacity-50" />
          <div className="absolute -bottom-5 -left-3 w-14 h-14 rounded-full bg-violet-500 opacity-40" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Users2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold">Family Plan</span>
            </div>
            <p className="text-xs text-violet-200 mb-3 leading-relaxed">
              Share nutrition with your whole family.
            </p>
            <Link to="/dashboard/settings" className="w-full flex items-center justify-center gap-1.5 bg-white text-violet-500 text-xs font-semibold py-2 px-3 rounded-xl hover:bg-violet-200 transition-all duration-300 cursor-pointer">
              Manage Profiles
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div> 

      {/* ── User row ── */}
      <div className="px-3 pb-4 pt-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold flex-shrink-0 ring-2 ring-violet-100">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() ?? 'U'
            ) }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-violet-500 hover:text-violet-600 rounded-lg hover:bg-violet-100 transition-colors flex-shrink-0 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main layout ─────────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on resize to lg+
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white border-r border-gray-100">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar backdrop ── */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl shadow-gray-200
          flex flex-col lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Mobile navigation"
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <NjerkaLogo />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout