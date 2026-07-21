export default function GroupsLoading() {
  return (
    <div className="min-h-dvh bg-gray-950 pb-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-4 border-b border-white/5 sticky top-0 bg-gray-950/80 backdrop-blur z-10 flex items-center justify-between">
        <div className="h-6 w-32 bg-white/10 rounded"></div>
        <div className="h-9 w-24 bg-white/10 rounded-xl"></div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Section 1 */}
        <section>
          <div className="h-5 w-48 bg-white/10 rounded mb-3"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 h-32"></div>
            ))}
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <div className="h-5 w-48 bg-white/10 rounded mb-3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 h-32"></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
