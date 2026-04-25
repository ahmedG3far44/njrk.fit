import { Link, Outlet } from "react-router-dom"
import {
    Home,
    TrendingUp,
    Calendar,
    Utensils,
    ShoppingCart,
    Dumbbell,
    BarChart3,
    Users,
    CreditCard,
    Settings,
    User2,
    LucideLogOut
} from "lucide-react"

const DashboardPage = () => {
    const routes = [
        { name: "Dashboard", path: "insights", icons: Home },
        { name: "Streaks & Rewards", path: "streaks", icons: TrendingUp },
        { name: "Schedule", path: "schedule", icons: Calendar },
        { name: "Nutrition", path: "nutrition", icons: Utensils },
        { name: "Grocery List", path: "groceries", icons: ShoppingCart },
        { name: "Fitness Plans", path: "fitness", icons: Dumbbell },
        { name: "Progress", path: "progress", icons: BarChart3 },
        { name: "Community", path: "community", icons: Users },
        { name: "Subscription", path: "subscription", icons: CreditCard },
        { name: "Settings", path: "settings", icons: Settings },
    ]
    return (
        <div className="flex">
            <aside className=" border-r flex flex-col justify-between p-4 w-64 min-h-screen">
                <div className="flex flex-col gap-12">
                    <NjerkaLogo />
                    <ul className="space-y-2">
                        {
                            routes.map((route) => (
                                <li key={route.path} className=" p-2 rounded ">
                                    <Link className="flex items-center justify-start gap-2 text-sm" to={`/dashboard/${route.path}`}> <route.icons size={16} /> {route.name}</Link>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <SubscriptionCard />
            </aside>
            <main className="flex-1 p-4">
                <Outlet />
            </main>
        </div>
    )
}

export default DashboardPage



function SubscriptionCard() {
    return (
        <div className="flex flex-col justify-start items-start  p-4 border rounded-md gap-2">
            <div className="flex items-center justify-start gap-2">
                <User2 size={16} />
                <h1 className="font-semibold text-md">Family Plan</h1>
            </div>
            <p className="text-xs text-gray-400">
                share nutrition with you whole family.
            </p>
            <div className="flex flex-col justify-start items-start w-full mt-2 gap-2">
                <button className="rounded-xl px-4 py-2 cursor-pointer text-xs ">Manage Profiles</button>
                <button className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 cursor-pointer text-xs "> <LucideLogOut size={14} /> Logout</button>
            </div>
        </div>
    )
}
function NjerkaLogo() {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-500"></div>
                <h1 className="font-bold text-2xl">Njerka<span className="text-purple-600">.fit</span></h1>
            </div>
            <p className="text-xs text-gray-500">Hi <span className="text-foreground font-semibold">Ahmed, Welcome back!</span></p>
        </div>
    )
}
