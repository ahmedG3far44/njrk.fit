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
  Check,
  UserCheck,
  Clock,
  Target,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import NjerkaLogo from "./NjerkaLogo";
import { useAuth } from "../context/AuthProvider";
import { Navigate } from "react-router-dom";
import { familyService, PendingInvitation } from "../services/familyService";
import { toast } from "sonner";

interface Notification {
  id: string;
  type:
    | "friend_request"
    | "family_invite"
    | "meal_reminder"
    | "team_invite"
    | "training_reminder";
  title: string;
  message: string;
  avatar?: string;
  time: string;
  invitationId?: string;
  isLocal?: boolean;
  isRead?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onChangeView,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user } = useAuth();

  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondedNotifs, setRespondedNotifs] = useState<
    Record<string, "accepted" | "declined">
  >({});

  const loadLocalNotifications = () => {
    const enabled = localStorage.getItem("daily_reminder_enabled") !== "false";
    if (!enabled) {
      return [];
    }
    const stored = localStorage.getItem("local_notifications");
    let localNotifs = stored ? JSON.parse(stored) : [];

    // Seed a default notification if enabled and no local notifications ever stored
    if (
      localNotifs.length === 0 &&
      !localStorage.getItem("local_notifications_seeded")
    ) {
      const seedNotif = {
        id: `local_meal_${Date.now()}`,
        type: "meal_reminder" as const,
        title: "Meal Reminder",
        message:
          "Welcome to Njerka! Time for your scheduled healthy meal! Make sure to log your calories.",
        time: "Just now",
        isLocal: true,
        isRead: false,
      };
      localNotifs = [seedNotif];
      localStorage.setItem("local_notifications", JSON.stringify(localNotifs));
      localStorage.setItem("local_notifications_seeded", "true");
    }

    return localNotifs;
  };

  const fetchInvitations = async (showLoading = false) => {
    if (showLoading) setLoadingInvitations(true);
    try {
      const response = await familyService.getFamily();

      // Map pending invitations to notification format
      const inviteNotifications: Notification[] =
        response.pendingInvitations.map((invite: PendingInvitation) => ({
          id: invite.id,
          type: "family_invite" as const,
          title: invite.user?.name || "Family Invitation",
          message: `${invite.user?.name || "Someone"} invited you to join their family plan`,
          avatar: invite.user?.avatarUrl,
          time: "Just now",
          invitationId: invite.id,
        }));

      const localNotifs = loadLocalNotifications();
      setNotifications([...inviteNotifications, ...localNotifs]);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      const localNotifs = loadLocalNotifications();
      setNotifications(localNotifs);
    } finally {
      if (showLoading) setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations(false);
    }
  }, [user]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchInvitations(false);
    };
    window.addEventListener("localNotificationsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("localNotificationsUpdated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchInvitations(true);
    }
  }, [showNotifications]);

  const handleNotifResponse = async (
    id: string,
    response: "accepted" | "declined",
  ) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif?.invitationId) return;

    setRespondingId(id);
    try {
      const action = response === "accepted" ? "accept" : "reject";
      await familyService.respondToInvitation(notif.invitationId, action);

      setRespondedNotifs((prev) => ({ ...prev, [id]: response }));
      toast.success(
        response === "accepted"
          ? "Invitation accepted!"
          : "Invitation declined",
      );

      // Remove from list after a delay
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 1500);
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
      toast.error("Failed to respond. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleMarkAsRead = (id: string) => {
    const stored = localStorage.getItem("local_notifications");
    if (stored) {
      const localNotifs = JSON.parse(stored);
      const updated = localNotifs.map((n: any) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      localStorage.setItem("local_notifications", JSON.stringify(updated));

      // Update state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      toast.success("Notification marked as read");
    }
  };

  const dismissNotif = (id: string) => {
    const isLocal = notifications.find((n) => n.id === id)?.isLocal;
    if (isLocal) {
      const stored = localStorage.getItem("local_notifications");
      if (stored) {
        const localNotifs = JSON.parse(stored);
        const filtered = localNotifs.filter((n: any) => n.id !== id);
        localStorage.setItem("local_notifications", JSON.stringify(filtered));
      }
      toast.success("Notification removed");
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const notifCount = notifications.filter((n) => !respondedNotifs[n.id]).length;

  const notifTypeIcon = (type: string) => {
    if (type === "friend_request")
      return <UserCheck className="w-4 h-4 text-green-700" />;
    if (type === "family_invite")
      return <Users className="w-4 h-4 text-green-600" />;
    if (type === "meal_reminder")
      return <Clock className="w-4 h-4 text-orange-500" />;
    if (type === "team_invite")
      return <Target className="w-4 h-4 text-green-500" />;
    if (type === "training_reminder")
      return <Dumbbell className="w-4 h-4 text-green-700" />;
    return <Bell className="w-4 h-4 text-slate-500" />;
  };
  const navItems = [
    {
      id: "insights",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-green-700",
    },
    {
      id: "streaks",
      label: "Streaks & Rewards",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      id: "nutrition",
      label: "Nutrition",
      icon: Utensils,
      color: "text-green-700",
    },
    {
      id: "grocery",
      label: "Grocery List",
      icon: ShoppingCart,
      color: "text-emerald-600",
    },
    {
      id: "fitness",
      label: "Fitness",
      icon: Dumbbell,
      color: "text-green-800",
    },
    {
      id: "progress",
      label: "Progress",
      icon: LineChart,
      color: "text-blue-500",
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      color: "text-pink-600",
    },
    {
      id: "subscriptions",
      label: "Subscription",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      color: "text-slate-500",
    },
  ];

  const bottomNavItems = [
    { id: "insights", path: "/insights", label: "Home", icon: LayoutDashboard },
    { id: "nutrition", path: "/nutrition", label: "Nutrition", icon: Utensils },
    { id: "fitness", path: "/fitness", label: "Fitness", icon: Dumbbell },
    { id: "progress", path: "/progress", label: "Progress", icon: LineChart },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

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
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Log Out?
              </h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                You'll be returned to the landing page. Your data is always
                saved.
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
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-full relative">
        {/* Logo */}
        <div className="p-5 pb-3 flex items-start justify-start border-b border-slate-100">
          <NjerkaLogo size="small" text={true} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-3">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors relative group ${
                  isActive
                    ? "bg-green-50 text-green-800"
                    : "text-slate-500 hover:bg-green-50 cursor-pointer hover:text-slate-900 active:scale-[0.98]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-700 rounded-r-full"
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-green-100"
                      : "bg-transparent group-hover:bg-slate-100"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 ${isActive ? item.color : ""}`}
                  />
                </div>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-green-500" />
                )}
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
            onClick={() => onChangeView("settings")}
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm relative z-10">
              <Users className="w-4 h-4" />{" "}
              {user?.subscription?.subscriptionTier === "BASIC"
                ? "Free"
                : user?.subscription?.subscriptionTier === "PRO"
                  ? "Pro"
                  : "Family"}{" "}
              Plan
            </div>
            <p className="text-xs text-green-200 mb-3 relative z-10 leading-relaxed">
              {user?.subscription?.subscriptionTier === "BASIC"
                ? "Upgrade to unlock more features"
                : user?.subscription?.subscriptionTier === "PRO"
                  ? "Upgrade to Family Plan to add more members."
                  : "Manage your family's nutrition."}
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
          <NjerkaLogo size="small" text={false} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white scale-75 origin-top-right">
                  {notifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <MoreHorizontal className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Floating Bell Button for Desktop & Tablet */}
        <button
          onClick={() => setShowNotifications(true)}
          className="hidden lg:flex absolute top-6 right-10 z-40 items-center justify-center p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {notifCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
              {notifCount}
            </span>
          )}
        </button>

        {/* Notification Sidebar */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-0 w-screen min-h-screen z-50 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: 320 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 320 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col h-full"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-900 to-green-700 text-white">
                  <div>
                    <h3 className="font-bold text-lg">Notification Center</h3>
                    <p className="text-green-200 text-sm">
                      {notifCount} new notifications
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingInvitations ? (
                    <div className="text-center py-12 text-slate-400">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
                      <p className="font-medium">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">All caught up!</p>
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        className={`bg-white border rounded-2xl p-4 shadow-sm ${
                          respondedNotifs[notif.id] || notif.isRead
                            ? "opacity-60 border-slate-100 bg-slate-50/50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-1">
                          <div className="relative flex-shrink-0">
                            {notif.avatar ? (
                              <img
                                src={notif.avatar}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                {notifTypeIcon(notif.type)}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                              {notifTypeIcon(notif.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {notif.title}
                              </span>
                              <button
                                onClick={() => dismissNotif(notif.id)}
                                className="text-slate-300 hover:text-slate-500 flex-shrink-0 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-slate-400 text-[10px] mt-1">
                              {notif.time}
                            </p>
                          </div>
                        </div>

                        {notif.isLocal && !notif.isRead && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Mark as read
                            </button>
                          </div>
                        )}

                        {notif.isLocal && notif.isRead && (
                          <div className="mt-3 flex justify-end">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 select-none">
                              <Check className="w-3 h-3 text-slate-400" /> Read
                            </span>
                          </div>
                        )}

                        {notif.type === "family_invite" &&
                          !respondedNotifs[notif.id] && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() =>
                                  handleNotifResponse(notif.id, "accepted")
                                }
                                disabled={respondingId === notif.id}
                                className="flex-1 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {respondingId === notif.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Accept
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleNotifResponse(notif.id, "declined")
                                }
                                disabled={respondingId === notif.id}
                                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {respondingId === notif.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Decline"
                                )}
                              </button>
                            </div>
                          )}

                        {respondedNotifs[notif.id] && (
                          <div
                            className={`text-xs font-bold text-center py-1.5 rounded-xl mt-3 ${respondedNotifs[notif.id] === "accepted" ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"}`}
                          >
                            {respondedNotifs[notif.id] === "accepted"
                              ? "✓ Accepted"
                              : "✕ Declined"}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                      transition={{
                        delay: i * 0.03,
                        duration: 0.2,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                      onClick={() => {
                        onChangeView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                        isActive
                          ? "bg-green-50 text-green-800"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-100" : "bg-slate-100"}`}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isActive ? item.color : "text-slate-400"}`}
                        />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-green-600 rounded-full" />
                      )}
                    </motion.button>
                  );
                })}

                {/* Mobile Logout */}
                <motion.button
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: navItems.length * 0.03,
                    duration: 0.2,
                    ease: [0.23, 1, 0.32, 1],
                  }}
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
                const isActive = currentView === item.id; // Treat "insights" as "home" for bottom nav
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onChangeView(item.path);
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
                      <item.icon
                        className={`w-5 h-5 transition-colors ${isActive ? "text-green-700" : "text-slate-400"}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold relative z-10 transition-colors ${isActive ? "text-green-700" : "text-slate-400"}`}
                    >
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
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-slate-700" />
                  ) : (
                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold relative z-10 ${isMobileMenuOpen ? "text-slate-700" : "text-slate-400"}`}
                >
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
