'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GroupMember } from '@/lib/types'
import { Loader2, Trophy, RotateCw } from 'lucide-react'

interface Props {
  groupId: string
  roundId: string
  members: GroupMember[]
}

export default function DrawButton({ groupId, roundId, members }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<GroupMember | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [currentHighlight, setCurrentHighlight] = useState<number>(-1)
  const router = useRouter()

  const eligibleMembers = members.filter(m => !m.has_won)

  const startDraw = () => {
    if (eligibleMembers.length === 0) return
    setSpinning(true)
    setWinner(null)

    let count = 0
    const totalSpins = 20 + Math.floor(Math.random() * 10)
    const interval = setInterval(() => {
      setCurrentHighlight(Math.floor(Math.random() * eligibleMembers.length))
      count++
      if (count >= totalSpins) {
        clearInterval(interval)
        const picked = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)]
        setCurrentHighlight(-1)
        setWinner(picked)
        setSpinning(false)
        setShowModal(true)
      }
    }, 100)
  }

  const confirmWinner = async () => {
    if (!winner) return
    setConfirming(true)
    const supabase = createClient()

    // Update round with winner
    await supabase.from('rounds').update({
      winner_id: winner.user_id,
      status: 'payout_pending',
      draw_date: new Date().toISOString(),
    }).eq('id', roundId)

    // Mark member as won
    await supabase.from('group_members').update({ has_won: true })
      .eq('group_id', groupId).eq('user_id', winner.user_id)

    setConfirming(false)
    setShowModal(false)
    router.refresh()
  }

  return (
    <>
      <div className="glass rounded-2xl p-4">
        <p className="font-bold text-sm mb-1">🎉 All members paid!</p>
        <p className="text-xs text-gray-500 mb-4">Ready to draw the lottery winner for this round.</p>

        {/* Member tiles with lottery animation */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {eligibleMembers.map((m, i) => (
            <div
              key={m.id}
              className={`rounded-xl p-2 text-center text-xs transition-all duration-100 ${
                spinning && currentHighlight === i
                  ? 'bg-brand-500 text-white scale-105 shadow-lg shadow-brand-500/30'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <div className="font-bold text-base mb-0.5">
                {(m.profile?.full_name || '?')[0].toUpperCase()}
              </div>
              <div className="truncate">{m.profile?.full_name?.split(' ')[0] || 'Member'}</div>
            </div>
          ))}
        </div>

        <button
          onClick={startDraw}
          disabled={spinning || eligibleMembers.length === 0}
          className="w-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-gray-900 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {spinning ? (
            <><RotateCw className="w-4 h-4 animate-spin" /> Drawing...</>
          ) : (
            <><Trophy className="w-4 h-4" /> Start Lottery Draw</>
          )}
        </button>
      </div>

      {/* Winner Modal */}
      {showModal && winner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-2xl font-bold mb-1">We have a winner!</h2>
            <p className="text-gray-400 text-sm mb-4">The lottery draw has selected</p>
            <div className="bg-brand-600/20 border border-brand-500/30 rounded-2xl p-4 mb-6">
              <div className="w-16 h-16 gradient-brand rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                {(winner.profile?.full_name || '?')[0].toUpperCase()}
              </div>
              <p className="font-bold text-xl text-brand-400">{winner.profile?.full_name}</p>
              <p className="text-xs text-gray-500 mt-1">Slot #{winner.slot_number}</p>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Transfer the total pool to their CBE account and upload the payout receipt.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 glass hover:bg-white/10 rounded-2xl py-3 text-sm font-medium transition-colors"
              >
                Redraw
              </button>
              <button
                onClick={confirmWinner}
                disabled={confirming}
                className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-2xl py-3 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Winner
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
