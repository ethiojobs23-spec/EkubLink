'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, UserCircle } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  // Don't show on landing or auth pages
  if (pathname === '/' || pathname.startsWith('/auth')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
                active
                  ? 'text-brand-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-brand-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
