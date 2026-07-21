'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus } from 'lucide-react'

export default function StartRoundButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    const supabase = createClient()

    // Get group info
    const { data: group } = await supabase
      .from('ekub_groups')
      .select('max_members, contribution_amount, frequency')
      .eq('id', groupId)
      .single()

    if (!group) { setLoading(false); return }

    // Create round 1
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (group.frequency === 'weekly' ? 7 : group.frequency === 'biweekly' ? 14 : 30))

    await supabase.from('rounds').insert({
      group_id: groupId,
      round_number: 1,
      status: 'contribution_window',
      total_pool: group.contribution_amount * group.max_members,
      due_date: dueDate.toISOString().split('T')[0],
    })

    await supabase
      .from('ekub_groups')
      .update({ current_round_number: 1, status: 'active' })
      .eq('id', groupId)

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      {loading ? 'Starting...' : 'Start Round 1'}
    </button>
  )
}
