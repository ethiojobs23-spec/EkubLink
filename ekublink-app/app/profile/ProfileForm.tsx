'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, LogOut } from 'lucide-react'
import { Profile } from '@/lib/types'

export default function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    cbe_account_number: profile?.cbe_account_number || '',
    cbe_account_name: profile?.cbe_account_name || '',
    role: profile?.role || 'giver',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('profiles').update(form).eq('id', userId)
    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Personal Info</h2>
        <div className="space-y-3">
          <Field label="Full Name">
            <input
              name="full_name" type="text" value={form.full_name} onChange={handleChange}
              placeholder="Abebe Bekele"
              className="input-field"
            />
          </Field>
          <Field label="Phone Number">
            <input
              name="phone_number" type="tel" value={form.phone_number} onChange={handleChange}
              placeholder="+251 9XX XXX XXXX"
              className="input-field"
            />
          </Field>
          <Field label="Your Role">
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="giver">Giver (Member)</option>
              <option value="collector">Collector (Admin)</option>
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">CBE Account (for payouts)</h2>
        <div className="space-y-3">
          <Field label="CBE Account Number">
            <input
              name="cbe_account_number" type="text" value={form.cbe_account_number} onChange={handleChange}
              placeholder="1000XXXXXXXXXX"
              className="input-field font-mono"
            />
          </Field>
          <Field label="Account Holder Name">
            <input
              name="cbe_account_name" type="text" value={form.cbe_account_name} onChange={handleChange}
              placeholder="ABEBE BEKELE"
              className="input-field uppercase"
            />
          </Field>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          This is where payout is sent when you win a lottery draw.
        </p>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
      </button>

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full glass hover:bg-red-500/10 border border-red-500/20 text-red-400 py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

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
      `}</style>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block font-medium">{label}</label>
      {children}
    </div>
  )
}
