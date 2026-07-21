import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, User, Phone, CreditCard, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-dvh bg-gray-950 pb-24">
      <div className="sticky top-0 z-10 glass-dark px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl glass">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold">Profile Settings</h1>
      </div>

      {/* Avatar */}
      <div className="px-4 py-8 text-center">
        <div className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
        </div>
        <p className="font-bold text-lg">{profile?.full_name || 'Your Name'}</p>
        <p className="text-gray-500 text-sm">{user.email}</p>
        <span className={`mt-2 inline-block text-xs px-3 py-1 rounded-full font-medium ${
          profile?.role === 'collector'
            ? 'bg-gold-500/20 text-gold-400'
            : 'bg-brand-600/20 text-brand-400'
        }`}>
          {profile?.role === 'collector' ? '⚡ Collector' : '🌱 Giver'}
        </span>
      </div>

      <div className="px-4">
        <ProfileForm profile={profile} userId={user.id} />
      </div>
    </div>
  )
}
