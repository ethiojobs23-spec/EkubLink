import { Bell, Coins } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-gray-950 pb-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="h-4 w-16 bg-white/10 rounded mb-2"></div>
            <div className="h-6 w-32 bg-white/10 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/5 rounded-xl"></div>
            <div className="w-9 h-9 bg-white/10 rounded-xl"></div>
          </div>
        </div>
        <div className="h-5 w-20 bg-white/5 rounded-full mt-2"></div>
      </div>

      {/* Stats Card Skeleton */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-5 h-32">
          <div className="h-3 w-24 bg-white/10 rounded mb-3"></div>
          <div className="h-8 w-40 bg-white/20 rounded mb-4"></div>
          <div className="flex gap-4">
            <div className="h-8 w-12 bg-white/10 rounded"></div>
            <div className="h-8 w-12 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 h-24"></div>
          <div className="bg-white/5 rounded-2xl p-4 h-24"></div>
        </div>
      </div>

      {/* My Groups Skeleton */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 bg-white/10 rounded"></div>
          <div className="h-3 w-12 bg-white/5 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/5 rounded-2xl p-4 h-32"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
