import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Coins, Clock, CheckCircle2, Trophy } from 'lucide-react'
import { formatCurrency, formatDate, frequencyLabel } from '@/lib/utils'
import { EkubGroup } from '@/lib/types'

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: collectedGroups } = await supabase
    .from('ekub_groups')
    .select('*')
    .eq('collector_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('ekub_groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const memberGroupsList = (memberGroups || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => (Array.isArray(m.ekub_groups) ? m.ekub_groups[0] : m.ekub_groups) as EkubGroup)
    .filter((g: EkubGroup) => g && g.collector_id !== user.id)

  const isCollector = profile?.role === 'collector'

  return (
    <div className="min-h-dvh bg-gray-950 pb-24">
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold flex-1">My Ekub Groups</h1>
        {isCollector && (
          <Link href="/groups/new" className="text-xs bg-brand-600 px-3 py-1.5 rounded-xl font-medium">
            + New
          </Link>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">
        {isCollector && collectedGroups && collectedGroups.length > 0 && (
          <div>
            <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Groups I Manage</h2>
            <div className="space-y-3">
              {collectedGroups.map((g: EkubGroup) => <GroupCard key={g.id} group={g} badge="⚡ Collector" />)}
            </div>
          </div>
        )}

        {memberGroupsList.length > 0 && (
          <div>
            <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Groups I've Joined</h2>
            <div className="space-y-3">
              {memberGroupsList.map((g: EkubGroup) => <GroupCard key={g.id} group={g} badge="🌱 Member" />)}
            </div>
          </div>
        )}

        {(!collectedGroups || collectedGroups.length === 0) && memberGroupsList.length === 0 && (
          <div className="text-center py-16">
            <Coins className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No groups yet</p>
            <p className="text-gray-600 text-sm mt-1">
              {isCollector ? 'Create your first Ekub to get started.' : 'Join an Ekub using an invite code.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function GroupCard({ group, badge }: { group: EkubGroup; badge: string }) {
  const statusColor: Record<string, string> = {
    forming: 'text-blue-400',
    active: 'text-brand-400',
    completed: 'text-gray-400',
    cancelled: 'text-red-400',
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="glass rounded-2xl p-4 card-hover">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-gray-500">{badge}</span>
            </div>
            <p className="font-semibold truncate">{group.name}</p>
          </div>
          <span className={`text-xs font-medium capitalize ${statusColor[group.status]}`}>
            {group.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-900/50 rounded-xl p-2">
            <Coins className="w-3.5 h-3.5 text-brand-400 mx-auto mb-0.5" />
            <p className="text-xs font-medium">{(group.contribution_amount / 1000).toFixed(0)}k ETB</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-2">
            <Clock className="w-3.5 h-3.5 text-gold-400 mx-auto mb-0.5" />
            <p className="text-xs font-medium capitalize">{group.frequency}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mx-auto mb-0.5" />
            <p className="text-xs font-medium">Rd {group.current_round_number}/{group.max_members}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
