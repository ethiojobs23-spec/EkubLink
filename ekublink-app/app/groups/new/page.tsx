'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { Frequency, DrawMode } from '@/lib/types'

export default function NewGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    name: '',
    description: '',
    contribution_amount: '',
    frequency: 'monthly' as Frequency,
    max_members: '',
    start_date: '',
    draw_mode: 'random' as DrawMode,
    cbe_account_number: '',
    cbe_account_name: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: group, error: err } = await supabase
      .from('ekub_groups')
      .insert({
        collector_id: user.id,
        name: form.name,
        description: form.description || null,
        contribution_amount: parseFloat(form.contribution_amount),
        frequency: form.frequency,
        max_members: parseInt(form.max_members),
        start_date: form.start_date,
        draw_mode: form.draw_mode,
        cbe_account_number: form.cbe_account_number,
        cbe_account_name: form.cbe_account_name,
        status: 'forming',
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Add the collector themselves as first member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      slot_number: 1,
    })

    router.push(`/groups/${group.id}`)
  }

  const totalPayout = parseFloat(form.contribution_amount || '0') * parseInt(form.max_members || '0')

  return (
    <div className="min-h-dvh bg-gray-950 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <button onClick={() => step === 1 ? router.back() : setStep(s => s - 1)} className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">Create New Ekub</h1>
          <p className="text-xs text-gray-500">Step {step} of 2</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full gradient-brand rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {step === 1 ? (
          <>
            <div>
              <h2 className="text-lg font-bold mb-4">Group Details</h2>
            </div>

            <Field label="Group Name" hint="e.g. 'Office Friends Monthly Ekub'">
              <input
                name="name" type="text" required value={form.name} onChange={handleChange}
                placeholder="Monthly Office Ekub"
                className="input-field"
              />
            </Field>

            <Field label="Description (optional)">
              <textarea
                name="description" rows={2} value={form.description} onChange={handleChange}
                placeholder="Rules, purpose, or notes..."
                className="input-field resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contribution (ETB)">
                <input
                  name="contribution_amount" type="number" required min="1" value={form.contribution_amount} onChange={handleChange}
                  placeholder="2000"
                  className="input-field"
                />
              </Field>
              <Field label="Total Members">
                <input
                  name="max_members" type="number" required min="2" max="100" value={form.max_members} onChange={handleChange}
                  placeholder="10"
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Frequency">
                <select name="frequency" value={form.frequency} onChange={handleChange} className="input-field bg-gray-900">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
              <Field label="Draw Mode">
                <select name="draw_mode" value={form.draw_mode} onChange={handleChange} className="input-field bg-gray-900">
                  <option value="random">Random Lottery</option>
                  <option value="scheduled">Scheduled Queue</option>
                </select>
              </Field>
            </div>

            <Field label="Start Date">
              <input
                name="start_date" type="date" required value={form.start_date} onChange={handleChange}
                className="input-field bg-gray-900"
              />
            </Field>

            {totalPayout > 0 && (
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-brand-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    Total payout per round: <span className="text-brand-400 font-bold">
                      {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0 }).format(totalPayout)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Each member contributes {form.contribution_amount} ETB per round</p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!form.name || !form.contribution_amount || !form.max_members || !form.start_date) {
                  setError('Please fill all required fields')
                  return
                }
                setError('')
                setStep(2)
              }}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all"
            >
              Next: CBE Account Details
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold mb-1">CBE Account Details</h2>
              <p className="text-gray-500 text-sm">Members will transfer contributions to this account.</p>
            </div>

            <div className="glass rounded-2xl p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount per round</span>
                <span className="font-medium">{form.contribution_amount} ETB × {form.max_members} members</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total payout</span>
                <span className="font-bold text-brand-400">{totalPayout.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Frequency</span>
                <span className="capitalize font-medium">{form.frequency}</span>
              </div>
            </div>

            <Field label="Your CBE Account Number">
              <input
                name="cbe_account_number" type="text" required value={form.cbe_account_number} onChange={handleChange}
                placeholder="1000XXXXXXXXXX"
                className="input-field font-mono"
              />
            </Field>

            <Field label="Account Holder Name (as on CBE)">
              <input
                name="cbe_account_name" type="text" required value={form.cbe_account_name} onChange={handleChange}
                placeholder="ABEBE BEKELE"
                className="input-field uppercase"
              />
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!form.cbe_account_number || !form.cbe_account_name) {
                  setError('CBE account details are required')
                  return
                }
                handleSubmit()
              }}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : '🎉 Create Ekub Group'}
            </button>
          </>
        )}
        {error && step === 1 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field::placeholder { color: #4b5563; }
        .input-field:focus { border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1); }
        .input-field option { background: #111827; }
      `}</style>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block font-medium">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
