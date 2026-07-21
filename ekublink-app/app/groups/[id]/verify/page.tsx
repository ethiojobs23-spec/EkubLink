import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Transaction } from '@/lib/types'
import VerifyButtons from './VerifyButtons'

interface Params { params: Promise<{ id: string }> }

export default async function VerifyPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Verify user is collector
  const { data: group } = await supabase
    .from('ekub_groups')
    .select('*, collector_id')
    .eq('id', id)
    .single()

  if (!group || group.collector_id !== user.id) redirect(`/groups/${id}`)

  // Get current round's pending transactions
  const { data: pendingTxs } = await supabase
    .from('transactions')
    .select('*, member:profiles(*)')
    .eq('group_id', id)
    .eq('status', 'pending_verification')
    .order('created_at', { ascending: true })

  const { data: verifiedTxs } = await supabase
    .from('transactions')
    .select('*, member:profiles(*)')
    .eq('group_id', id)
    .eq('status', 'verified_paid')
    .order('verified_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-dvh bg-gray-950 pb-24">
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <Link href={`/groups/${id}`} className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold">Receipt Verification</h1>
          <p className="text-xs text-gray-500">{group.name}</p>
        </div>
      </div>

      {/* Pending */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-sm">Pending Review</h2>
          {pendingTxs && pendingTxs.length > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
              {pendingTxs.length}
            </span>
          )}
        </div>

        {!pendingTxs || pendingTxs.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-brand-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No pending receipts to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTxs.map((tx: Transaction) => (
              <div key={tx.id} className="glass rounded-2xl overflow-hidden border border-yellow-500/20">
                {/* Receipt image if available */}
                {tx.receipt_url && (
                  <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={tx.receipt_url}
                      alt="CBE Receipt"
                      className="w-full max-h-40 object-cover"
                    />
                    <div className="px-4 py-1.5 bg-yellow-500/10 flex items-center gap-1 text-xs text-yellow-400">
                      <ExternalLink className="w-3 h-3" />
                      View full receipt
                    </div>
                  </a>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{tx.member?.full_name}</p>
                      <p className="text-xs text-gray-500">{tx.member?.phone_number}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <InfoRow label="Amount" value={formatCurrency(tx.amount)} highlight />
                    <InfoRow
                      label="CBE Reference"
                      value={tx.transaction_reference}
                      mono
                    />
                    <InfoRow label="Payment Date" value={formatDateTime(tx.payment_date)} />
                    <InfoRow label="Submitted" value={formatDateTime(tx.created_at)} />
                  </div>

                  <VerifyButtons transactionId={tx.id} groupId={id} verifierId={user.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified */}
      {verifiedTxs && verifiedTxs.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="font-bold text-sm mb-3">Recently Verified</h2>
          <div className="space-y-2">
            {verifiedTxs.map((tx: Transaction) => (
              <div key={tx.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tx.member?.full_name}</p>
                  <p className="text-xs text-gray-500 font-mono">{tx.transaction_reference}</p>
                </div>
                <span className="text-xs text-brand-400 font-medium">{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-brand-400' : 'text-white'} ${mono ? 'font-mono text-xs tracking-wide' : ''}`}>
        {value}
      </span>
    </div>
  )
}
