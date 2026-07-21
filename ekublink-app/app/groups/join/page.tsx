'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Loader2, Hash } from 'lucide-react'
import Link from 'next/link'

export default function JoinGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{ name: string; contribution_amount: number; max_members: number; frequency: string } | null>(null)

  const supabase = createClient()

  const lookup = async () => {
    if (code.length < 6) return
    const { data } = await supabase
      .from('ekub_groups')
      .select('id, name, contribution_amount, max_members, frequency, status')
      .eq('invite_code', code.toUpperCase().trim())
      .single()
    setPreview(data || null)
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: group } = await supabase
      .from('ekub_groups')
      .select('id, max_members, status')
      .eq('invite_code', code.toUpperCase().trim())
      .single()

    if (!group) { setError('Invalid invite code. Please check and try again.'); setLoading(false); return }
    if (group.status === 'completed' || group.status === 'cancelled') {
      setError('This Ekub group is no longer accepting members.'); setLoading(false); return
    }

    // Check member count
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)

    if ((count || 0) >= group.max_members) {
      setError('This group is full. No more members can join.'); setLoading(false); return
    }

    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      slot_number: (count || 0) + 1,
    })

    if (joinError) {
      if (joinError.code === '23505') setError('You are already a member of this group.')
      else setError(joinError.message)
      setLoading(false)
      return
    }

    router.push(`/groups/${group.id}`)
  }

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">
      <div className="px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold">Join an Ekub Group</h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-sm mx-auto w-full">
        <div className="text-center">
          <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">Enter Invite Code</h2>
          <p className="text-gray-500 text-sm">Ask the Ekub Collector for the 8-character group code</p>
        </div>

        <div>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setPreview(null)
                setError('')
              }}
              onBlur={lookup}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full glass rounded-2xl pl-12 pr-4 py-4 text-xl font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-700 uppercase"
            />
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            Code is 8 characters (e.g. AB12CD34)
          </p>
        </div>

        {preview && (
          <div className="glass rounded-2xl p-4 border border-brand-500/20">
            <p className="text-xs text-brand-400 mb-2 font-medium">Group Found ✓</p>
            <p className="font-bold text-base mb-1">{preview.name}</p>
            <div className="text-sm text-gray-400 space-y-0.5">
              <div>💰 {preview.contribution_amount.toLocaleString()} ETB / {preview.frequency}</div>
              <div>👥 {preview.max_members} total members</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading || code.length < 6}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white py-4 rounded-2xl font-semibold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Joining...' : 'Join Ekub Group'}
        </button>
      </div>
    </div>
  )
}
