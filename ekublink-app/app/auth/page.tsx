'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Coins, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin'

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'giver' as 'giver' | 'collector',
  })

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
          role: form.role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update profile role (trigger creates row, but we need to set role)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ role: form.role, phone_number: form.phone, full_name: form.full_name })
        .eq('id', data.user.id)
    }

    window.location.href = '/dashboard'
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">EkubLink</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">
              {tab === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-gray-500 text-sm">
              {tab === 'signin'
                ? 'Sign in to your EkubLink account'
                : 'Start your digital savings journey'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="glass rounded-2xl p-1 flex mb-6">
            <button
              onClick={() => { setTab('signin'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === 'signin' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === 'signup' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            {tab === 'signup' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Full Name</label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    placeholder="Abebe Bekele"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+251 9XX XXX XXXX"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">I want to</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-gray-900 text-white"
                  >
                    <option value="giver">Join as a Giver (Member)</option>
                    <option value="collector">Create as a Collector (Admin)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email Address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="abebe@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full glass rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
