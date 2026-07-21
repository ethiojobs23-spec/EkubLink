import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowLeft, Users, Coins, Copy, Share2, Settings,
  CheckCircle2, Clock, XCircle, Trophy, ChevronRight,
  Plus, Loader2
} from 'lucide-react'
import { formatCurrency, formatDate, frequencyLabel, generateInviteLink } from '@/lib/utils'
import { EkubGroup, GroupMember, Round, Transaction } from '@/lib/types'
import DrawButton from './DrawButton'
import StartRoundButton from './StartRoundButton'

interface Params { params: Promise<{ id: string }> }

export default async function GroupDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: group, error } = await supabase
    .from('ekub_groups')
    .select(`
      *,
      collector:profiles!ekub_groups_collector_id_fkey(*),
      group_members(*, profile:profiles(*))
    `)
    .eq('id', id)
    .single()

  if (error || !group) notFound()

  const isCollector = group.collector_id === user.id
  const isMember = group.group_members?.some((m: GroupMember) => m.user_id === user.id)
  if (!isCollector && !isMember) redirect('/dashboard')

  // Get current round
  const { data: currentRound } = await supabase
    .from('rounds')
    .select(`*, transactions(*, member:profiles(*)), winner:profiles!rounds_winner_id_fkey(*)`)
    .eq('group_id', id)
    .eq('round_number', group.current_round_number)
    .single()

  // Get all rounds
  const { data: allRounds } = await supabase
    .from('rounds')
    .select('*, winner:profiles!rounds_winner_id_fkey(*)')
    .eq('group_id', id)
    .order('round_number', { ascending: false })

  const members: GroupMember[] = group.group_members || []
  const totalPaidThisRound = currentRound?.transactions?.filter(
    (t: Transaction) => t.status === 'verified_paid'
  ).length || 0

  const paidPercent = members.length > 0 ? Math.round((totalPaidThisRound / members.length) * 100) : 0
  const allPaid = totalPaidThisRound === members.length && members.length > 0
  const inviteLink = generateInviteLink(group.invite_code)

  const myTransaction = currentRound?.transactions?.find(
    (t: Transaction) => t.member_id === user.id
  )

  return (
    <div className="min-h-dvh bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{group.name}</h1>
          <p className="text-xs text-gray-500">
            {frequencyLabel(group.frequency)} · {formatCurrency(group.contribution_amount)}/member
          </p>
        </div>
        {isCollector && (
          <Link href={`/groups/${id}/settings`} className="p-2 rounded-xl glass">
            <Settings className="w-4 h-4 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Status & Pool Card */}
      <div className="px-4 py-4">
        <div className="gradient-brand rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="text-white/70 text-xs mb-1">Current Pool</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(group.contribution_amount * members.length)}
          </div>
          <div className="mt-3 flex gap-4 text-sm relative">
            <div>
              <div className="text-white/50 text-xs">Round</div>
              <div className="text-white font-semibold">
                {group.current_round_number}/{group.max_members}
              </div>
            </div>
            <div>
              <div className="text-white/50 text-xs">Members</div>
              <div className="text-white font-semibold">{members.length}/{group.max_members}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs">Paid this round</div>
              <div className="text-white font-semibold">{totalPaidThisRound}/{members.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {currentRound && (
        <div className="px-4 mb-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Round {currentRound.round_number} Progress</span>
              <span className="text-xs text-brand-400">{paidPercent}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full gradient-brand rounded-full transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{totalPaidThisRound} verified</span>
              <span>{members.length - totalPaidThisRound} remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Action CTA for Giver */}
      {!isCollector && currentRound && (
        <div className="px-4 mb-4">
          {!myTransaction ? (
            <Link
              href={`/groups/${id}/round/${currentRound.id}/upload`}
              className="block glass border border-brand-500/30 rounded-2xl p-4 text-center"
            >
              <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Plus className="w-5 h-5 text-brand-400" />
              </div>
              <p className="font-semibold text-sm mb-0.5">Submit Payment Receipt</p>
              <p className="text-xs text-gray-500">Upload your CBE transfer receipt for Round {currentRound.round_number}</p>
            </Link>
          ) : (
            <div className={`glass rounded-2xl p-4 border ${
              myTransaction.status === 'verified_paid' ? 'border-brand-500/30' :
              myTransaction.status === 'pending_verification' ? 'border-yellow-500/30' :
              'border-red-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <TransactionIcon status={myTransaction.status} />
                <div>
                  <p className="font-semibold text-sm">
                    {myTransaction.status === 'verified_paid' ? '✅ Payment Verified' :
                     myTransaction.status === 'pending_verification' ? '⏳ Pending Verification' :
                     '❌ Payment Rejected'}
                  </p>
                  <p className="text-xs text-gray-500">Ref: {myTransaction.transaction_reference}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collector: Start Round / Draw Button */}
      {isCollector && (
        <div className="px-4 mb-4 space-y-3">
          {group.current_round_number === 0 && (
            <StartRoundButton groupId={id} />
          )}
          {currentRound && allPaid && (
            <DrawButton groupId={id} roundId={currentRound.id} members={members} />
          )}
          {currentRound && !allPaid && currentRound.status === 'contribution_window' && (
            <Link
              href={`/groups/${id}/verify`}
              className="flex items-center justify-between glass border border-yellow-500/20 rounded-2xl p-4"
            >
              <div>
                <p className="font-semibold text-sm">Verify Receipts</p>
                <p className="text-xs text-gray-500">
                  {currentRound.transactions?.filter((t: Transaction) => t.status === 'pending_verification').length || 0} pending review
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )}
        </div>
      )}

      {/* Invite Card (forming status) */}
      {group.status === 'forming' && members.length < group.max_members && (
        <div className="px-4 mb-4">
          <div className="glass rounded-2xl p-4">
            <p className="font-semibold text-sm mb-1">Invite Members</p>
            <p className="text-xs text-gray-500 mb-3">
              {group.max_members - members.length} spots remaining
            </p>
            <div className="bg-gray-900 rounded-xl p-3 flex items-center justify-between mb-2">
              <code className="text-brand-400 text-sm font-mono font-bold tracking-widest">
                {group.invite_code}
              </code>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button className="w-full flex items-center justify-center gap-2 glass hover:bg-white/10 rounded-xl p-2.5 text-sm transition-colors">
              <Share2 className="w-4 h-4 text-brand-400" />
              Share invite link
            </button>
          </div>
        </div>
      )}

      {/* Transparency Board — Members */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-sm mb-3">Member Status Board</h2>
        <div className="space-y-2">
          {members.map((member: GroupMember) => {
            const tx = currentRound?.transactions?.find(
              (t: Transaction) => t.member_id === member.user_id
            )
            return (
              <div key={member.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                  {(member.profile?.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profile?.full_name || 'Unknown'}
                    {member.user_id === group.collector_id && (
                      <span className="ml-1 text-xs text-gold-400">⚡</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600">
                    {member.has_won ? '🏆 Already won' : `Slot #${member.slot_number || '?'}`}
                  </p>
                </div>
                <MemberStatusBadge tx={tx} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Past Rounds */}
      {allRounds && allRounds.length > 0 && (
        <div className="px-4">
          <h2 className="font-bold text-sm mb-3">Round History</h2>
          <div className="space-y-2">
            {allRounds.map((round: Round) => (
              <div key={round.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  round.status === 'completed' ? 'bg-brand-600/20 text-brand-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  #{round.round_number}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {round.winner ? `🏆 ${round.winner.full_name} won` : roundStatusText(round.status)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {round.winner ? formatCurrency(group.contribution_amount * members.length) : '—'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  round.status === 'completed' ? 'bg-brand-600/20 text-brand-400' :
                  round.status === 'contribution_window' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {round.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TransactionIcon({ status }: { status: string }) {
  if (status === 'verified_paid') return <CheckCircle2 className="w-8 h-8 text-brand-400 shrink-0" />
  if (status === 'pending_verification') return <Clock className="w-8 h-8 text-yellow-400 shrink-0" />
  return <XCircle className="w-8 h-8 text-red-400 shrink-0" />
}

function MemberStatusBadge({ tx }: { tx?: Transaction }) {
  if (!tx) return <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">🔴 Unpaid</span>
  if (tx.status === 'verified_paid') return <span className="text-xs px-2 py-1 rounded-full bg-brand-600/20 text-brand-400">🟢 Paid</span>
  if (tx.status === 'pending_verification') return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">🟡 Pending</span>
  return <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">❌ Rejected</span>
}

function roundStatusText(status: string): string {
  const map: Record<string, string> = {
    contribution_window: 'Collecting contributions',
    draw_ready: 'Ready to draw',
    drawing: 'Draw in progress',
    payout_pending: 'Payout pending',
    completed: 'Completed',
  }
  return map[status] || status
}
