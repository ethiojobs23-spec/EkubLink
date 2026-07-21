'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  transactionId: string
  groupId: string
  verifierId: string
}

export default function VerifyButtons({ transactionId, groupId, verifierId }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setLoading('approve')
    const supabase = createClient()
    await supabase.from('transactions').update({
      status: 'verified_paid',
      verified_at: new Date().toISOString(),
      verified_by: verifierId,
    }).eq('id', transactionId)

    // Check if all members of this round are now paid
    const { data: tx } = await supabase
      .from('transactions')
      .select('round_id, group_id')
      .eq('id', transactionId)
      .single()

    if (tx) {
      const { count: paidCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('round_id', tx.round_id)
        .eq('status', 'verified_paid')

      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', tx.group_id)

      if (paidCount === memberCount && (paidCount || 0) > 0) {
        await supabase.from('rounds').update({ status: 'draw_ready' }).eq('id', tx.round_id)
      }
    }

    router.refresh()
    setLoading(null)
  }

  const handleReject = async () => {
    if (!showRejectInput) { setShowRejectInput(true); return }
    setLoading('reject')
    const supabase = createClient()
    await supabase.from('transactions').update({
      status: 'rejected',
      collector_notes: notes || 'Rejected by collector',
      verified_at: new Date().toISOString(),
      verified_by: verifierId,
    }).eq('id', transactionId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      {showRejectInput && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={2}
          className="w-full bg-gray-900 border border-red-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/40 resize-none"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          {showRejectInput ? 'Confirm Reject' : 'Reject'}
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Verify & Approve
        </button>
      </div>
    </div>
  )
}
