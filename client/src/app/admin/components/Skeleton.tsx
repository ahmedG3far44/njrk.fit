export const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-3.5 border-b border-limestone last:border-0">
    <div className="w-8 h-8 rounded-full bg-stone animate-pulse shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="w-32 h-4 bg-stone rounded animate-pulse mb-1.5" />
      <div className="w-24 h-3 bg-stone/60 rounded animate-pulse" />
    </div>
    <div className="w-16 h-5 bg-stone rounded-full animate-pulse shrink-0" />
    <div className="w-20 h-4 bg-stone rounded animate-pulse hidden sm:block" />
    <div className="w-8 h-8 bg-stone rounded-lg animate-pulse shrink-0" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-peak-white rounded-card border border-limestone overflow-hidden">
    <div className="px-4 py-3 border-b border-limestone flex items-center gap-3">
      <div className="w-6 h-4 bg-stone rounded animate-pulse" />
      <div className="w-20 h-4 bg-stone rounded animate-pulse" />
      <div className="w-16 h-4 bg-stone rounded animate-pulse ml-auto" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-peak-white rounded-card border border-limestone p-5">
    <div className="flex items-center justify-between mb-6">
      <div className="w-32 h-5 bg-stone rounded animate-pulse" />
      <div className="w-20 h-4 bg-stone rounded animate-pulse" />
    </div>
    <div className="h-48 bg-stone/40 rounded-xl animate-pulse" />
  </div>
);
