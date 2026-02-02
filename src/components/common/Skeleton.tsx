interface SkeletonProps {
  className?: string;
  count?: number;
}

/** Base shimmer skeleton — use panel-specific skeletons for richer loading states */
export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-socc-border/30 rounded ${className}`}
        />
      ))}
    </div>
  );
}

/** Animated shimmer bar — building block for panel skeletons */
function ShimmerBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-socc-border/20 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-socc-border/30 to-transparent" />
    </div>
  );
}

/** Threat card loading skeleton */
export function ThreatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-socc-border/20 bg-socc-surface/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <ShimmerBar className="w-16 h-5" />
            <ShimmerBar className="w-24 h-4" />
            <div className="ml-auto">
              <ShimmerBar className="w-12 h-5" />
            </div>
          </div>
          <ShimmerBar className="w-full h-4 mb-1.5" />
          <ShimmerBar className="w-3/4 h-3" />
        </div>
      ))}
    </div>
  );
}

/** News item loading skeleton */
export function NewsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0.5 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-2.5 rounded-lg"
        >
          <ShimmerBar className="w-1.5 h-10 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <ShimmerBar className="w-full h-4" />
            <div className="flex items-center gap-2">
              <ShimmerBar className="w-16 h-3" />
              <ShimmerBar className="w-12 h-3" />
              <ShimmerBar className="w-14 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stock card loading skeleton */
export function StockSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-socc-border/20 bg-socc-surface/30"
        >
          <div className="flex items-center justify-between mb-2">
            <ShimmerBar className="w-14 h-5" />
            <ShimmerBar className="w-16 h-4" />
          </div>
          <ShimmerBar className="w-20 h-3 mb-2" />
          <ShimmerBar className="w-full h-12 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Briefing card loading skeleton */
export function BriefingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-socc-border/20 bg-socc-surface/30"
        >
          <div className="flex items-center justify-between mb-3">
            <ShimmerBar className="w-28 h-5" />
            <ShimmerBar className="w-16 h-3" />
          </div>
          <div className="space-y-2">
            <ShimmerBar className="w-full h-3" />
            <ShimmerBar className="w-5/6 h-3" />
            <ShimmerBar className="w-4/6 h-3" />
          </div>
          <div className="mt-3 flex gap-2">
            <ShimmerBar className="w-20 h-5 rounded-full" />
            <ShimmerBar className="w-24 h-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
