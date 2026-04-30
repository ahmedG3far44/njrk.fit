// DashboardSkeleton.tsx
// Drop-in loading skeleton that mirrors the Njerka dashboard layout exactly.
// Uses only Tailwind CSS — no extra dependencies required.

const Shimmer = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
)

// ─── Streak Banner ────────────────────────────────────────────────────────────
const StreakBannerSkeleton = () => (
  <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 flex items-center justify-between gap-4">
    {/* Left: icon + text */}
    <div className="flex items-center gap-4">
      <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="space-y-2">
        <Shimmer className="h-7 w-40 rounded-md" />
        <Shimmer className="h-3.5 w-28 rounded-md" />
        <Shimmer className="h-3 w-48 rounded-md" />
      </div>
    </div>
    {/* Right: day circles + rewards */}
    <div className="hidden sm:flex items-center gap-6">
      <div className="flex items-center gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Shimmer className="w-9 h-9 rounded-full" />
            <Shimmer className="h-2.5 w-4 rounded-sm" />
          </div>
        ))}
      </div>
      <Shimmer className="h-5 w-24 rounded-md" />
    </div>
  </div>
)

// ─── Stat Cards (Water / Sleep / Steps) ───────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Shimmer className="w-8 h-8 rounded-lg" />
      <Shimmer className="h-3.5 w-10 rounded-md" />
    </div>
    <div className="space-y-1.5">
      <Shimmer className="h-9 w-24 rounded-md" />
      <Shimmer className="h-3.5 w-12 rounded-md" />
    </div>
    <Shimmer className="h-1.5 w-full rounded-full" />
  </div>
)

// ─── Nutrition Snapshot ───────────────────────────────────────────────────────
const NutritionSnapshotSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <Shimmer className="h-4 w-36 rounded-md" />
          <Shimmer className="h-3 w-28 rounded-md" />
        </div>
      </div>
      <Shimmer className="h-7 w-20 rounded-lg" />
    </div>
    {/* Macro rows */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="w-2.5 h-2.5 rounded-full" />
            <Shimmer className="h-3.5 w-16 rounded-md" />
          </div>
          <Shimmer className="h-3.5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  </div>
)

// ─── Upcoming Meal Card ────────────────────────────────────────────────────────
const UpcomingMealSkeleton = () => (
  <div className="bg-amber-50/60 rounded-2xl border border-amber-100 overflow-hidden flex flex-col">
    {/* Image placeholder */}
    <Shimmer className="w-full h-40 rounded-none bg-amber-100" />
    <div className="p-5 space-y-2">
      <Shimmer className="h-3 w-28 rounded-md" />
      <Shimmer className="h-5 w-36 rounded-md" />
    </div>
  </div>
)

// ─── Next Workout Card ─────────────────────────────────────────────────────────
const NextWorkoutSkeleton = () => (
  <div className="bg-violet-100/60 rounded-2xl border border-violet-200 p-6 space-y-5 flex flex-col justify-between min-h-[220px]">
    <div className="flex items-center gap-2">
      <Shimmer className="w-8 h-8 rounded-lg bg-violet-200" />
      <Shimmer className="h-3.5 w-28 rounded-md bg-violet-200" />
      <Shimmer className="w-2 h-2 rounded-full bg-violet-300 ml-1" />
    </div>
    <div className="space-y-2">
      <Shimmer className="h-9 w-48 rounded-md bg-violet-200" />
      <Shimmer className="h-3.5 w-56 rounded-md bg-violet-200" />
    </div>
    <Shimmer className="h-4 w-28 rounded-md bg-violet-200" />
  </div>
)

// ─── Live Challenge Card ───────────────────────────────────────────────────────
const LiveChallengeSkeleton = () => (
  <div className="bg-gray-800 rounded-2xl p-5 space-y-3 min-h-[160px] flex flex-col justify-end">
    <Shimmer className="h-3 w-28 rounded-md bg-gray-700" />
    <Shimmer className="h-6 w-36 rounded-md bg-gray-700" />
    <Shimmer className="h-3.5 w-44 rounded-md bg-gray-700" />
  </div>
)

// ─── Grocery List Card ─────────────────────────────────────────────────────────
const GroceryListSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shimmer className="w-8 h-8 rounded-lg" />
        <Shimmer className="h-3.5 w-16 rounded-md" />
      </div>
      <Shimmer className="w-4 h-4 rounded-sm" />
    </div>
    <Shimmer className="h-5 w-32 rounded-md" />
    <Shimmer className="h-3.5 w-44 rounded-md" />
    <div className="space-y-2">
      <Shimmer className="h-1.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Shimmer className="h-3 w-20 rounded-md" />
        <Shimmer className="h-3 w-8 rounded-md" />
      </div>
    </div>
  </div>
)

// ─── Rewards Card ─────────────────────────────────────────────────────────────
const RewardsSkeleton = () => (
  <div className="bg-orange-100/60 rounded-2xl border border-orange-200 p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shimmer className="w-8 h-8 rounded-lg bg-orange-200" />
        <Shimmer className="h-3.5 w-16 rounded-md bg-orange-200" />
      </div>
      <Shimmer className="w-4 h-4 rounded-sm bg-orange-200" />
    </div>
    <Shimmer className="h-10 w-28 rounded-md bg-orange-200" />
    <Shimmer className="h-3.5 w-40 rounded-md bg-orange-200" />
    <Shimmer className="h-2 w-full rounded-full bg-orange-200" />
  </div>
)

// ─── Full Dashboard Skeleton ──────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <>
    {/* Inject keyframe once */}
    <style>{`
      @keyframes shimmer {
        100% { transform: translateX(200%); }
      }
    `}</style>

    <div className="space-y-5 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* 1. Streak Banner */}
      <StreakBannerSkeleton />

      {/* 2. Stat Cards — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* 3. Nutrition Snapshot — full width */}
      <NutritionSnapshotSkeleton />

      {/* 4. Upcoming Meal + Next Workout — 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UpcomingMealSkeleton />
        <NextWorkoutSkeleton />
      </div>

      {/* 5. Live Challenge + Grocery List + Rewards — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LiveChallengeSkeleton />
        <GroceryListSkeleton />
        <RewardsSkeleton />
      </div>
    </div>
  </>
)

export default DashboardSkeleton