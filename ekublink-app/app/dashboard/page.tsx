import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Plus, Users, Coins, ArrowRight, Bell, TrendingUp,
  Clock, CheckCircle2, Trophy, AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate, groupStatusLabel } from '@/lib/utils'
import { EkubGroup } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get groups the user is in (as collector or member)
  const { data: collectedGroups } = await supabase
    .from('ekub_groups')
    .select('*, group_members(count)')
    .eq('collector_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id, ekub_groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const allGroups: EkubGroup[] = [
    ...(collectedGroups || []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((memberGroups || []).map((m: any) => (Array.isArray(m.ekub_groups) ? m.ekub_groups[0] : m.ekub_groups) as EkubGroup).filter(Boolean)),
  ]

  // Deduplicate
  const uniqueGroups = Array.from(
    new Map(allGroups.map(g => [g.id, g])).values()
  )

  const isCollector = profile?.role === 'collector'
  const totalPool = uniqueGroups.reduce((sum, g) => sum + (g.contribution_amount * (g.max_members || 0)), 0)

  return (
    <div className="min-h-dvh bg-gray-950 pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-gray-500 text-sm">Good day,</p>
            <h1 className="text-xl font-bold">{profile?.full_name || user.email}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 glass rounded-xl flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <Link
              href="/profile"
              className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center text-white text-sm font-bold"
            >
              {(profile?.full_name || 'U')[0].toUpperCase()}
            </Link>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isCollector ? 'bg-gold-500/20 text-gold-400' : 'bg-brand-600/20 text-brand-400'
        }`}>
          {isCollector ? '⚡ Collector' : '🌱 Giver'}
        </span>
      </div>

      {/* Stats Card */}
      <div className="px-4 mb-6">
        <div className="gradient-brand rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <p className="text-white/70 text-xs mb-1 relative">Total Active Pool</p>
          <p className="text-3xl font-bold text-white relative">{formatCurrency(totalPool)}</p>
          <div className="mt-3 flex gap-4 relative">
            <div>
              <p className="text-white/50 text-xs">Groups</p>
              <p className="text-white font-semibold">{uniqueGroups.length}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Active</p>
              <p className="text-white font-semibold">{uniqueGroups.filter(g => g.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {isCollector ? (
            <Link
              href="/groups/new"
              className="glass rounded-2xl p-4 flex flex-col gap-2 card-hover active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">New Ekub</p>
                <p className="text-gray-500 text-xs">Create a group</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/groups/join"
              className="glass rounded-2xl p-4 flex flex-col gap-2 card-hover active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Join Ekub</p>
                <p className="text-gray-500 text-xs">Enter invite code</p>
              </div>
            </Link>
          )}
          <Link
            href="/groups"
            className="glass rounded-2xl p-4 flex flex-col gap-2 card-hover active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 bg-gold-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">My Groups</p>
              <p className="text-gray-500 text-xs">View all Ekubs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* My Groups */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">My Ekub Groups</h2>
          <Link href="/groups" className="text-brand-400 text-xs flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {uniqueGroups.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Coins className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-1">No groups yet</p>
            <p className="text-gray-600 text-sm mb-4">
              {isCollector ? 'Create your first Ekub group to get started.' : 'Join an Ekub group using an invite code.'}
            </p>
            <Link
              href={isCollector ? '/groups/new' : '/groups/join'}
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              {isCollector ? <Plus className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {isCollector ? 'Create Ekub' : 'Join Ekub'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueGroups.slice(0, 5).map(group => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <div className="glass rounded-2xl p-4 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{group.name}</p>
                      <p className="text-gray-500 text-xs">{formatDate(group.start_date)}</p>
                    </div>
                    <StatusBadge status={group.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      <span>{formatCurrency(group.contribution_amount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{group.max_members} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="capitalize">{group.frequency}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Round {group.current_round_number} of {group.max_members}
                    </span>
                    <div className="text-xs text-brand-400 font-medium flex items-center gap-1">
                      View details <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    forming: { color: 'bg-blue-500/20 text-blue-400', label: 'Forming' },
    active: { color: 'bg-brand-600/20 text-brand-400', label: 'Active' },
    completed: { color: 'bg-gray-600/20 text-gray-400', label: 'Done' },
    cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
  }
  const s = map[status] || map.forming
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
      {s.label}
    </span>
  )
}
