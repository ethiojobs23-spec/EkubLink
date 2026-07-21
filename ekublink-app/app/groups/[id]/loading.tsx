export default function GroupDetailLoading() {
  return (
    <div className="min-h-dvh bg-gray-950 pb-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="sticky top-0 bg-gray-950/80 backdrop-blur z-20 border-b border-white/5 pt-6 pb-4 px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white/10 rounded-xl"></div>
          <div className="h-6 w-48 bg-white/10 rounded"></div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Info Card Skeleton */}
        <div className="bg-white/5 rounded-2xl p-5 h-40"></div>

        {/* Current Round Skeleton */}
        <div className="bg-white/5 rounded-2xl p-5 h-48"></div>

        {/* Member Grid Skeleton */}
        <div>
          <div className="h-5 w-40 bg-white/10 rounded mb-3"></div>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-16"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
