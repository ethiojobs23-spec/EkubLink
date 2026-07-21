import Link from 'next/link'
import { ArrowRight, Shield, Zap, Users, Receipt, Trophy, ChevronRight, Star, CheckCircle2, Coins } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: <Receipt className="w-6 h-6" />,
      title: 'Receipt Verification',
      description: 'Upload CBE receipts with FT reference numbers. Collectors verify in one tap — preventing duplicate fraud automatically.',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Digital Lottery Draw',
      description: 'Fair and transparent spinning-wheel draws. Or set a pre-agreed rotation schedule. Every member wins exactly once.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Fraud Prevention',
      description: 'Unique CBE reference numbers are checked globally across all groups. No double-submissions, ever.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time Updates',
      description: 'Payment statuses update instantly. All members see who has paid, who is pending, and the current pool balance live.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Easy Invite System',
      description: 'Share a link or 8-digit code to invite members. They join with one tap — no account setup friction.',
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: 'Transparency Board',
      description: 'A public ledger inside every group. History of payments, draws, and winners — full accountability for all.',
    },
  ]

  const steps = [
    { num: '01', title: 'Collector creates an Ekub group', desc: 'Set amount, frequency, members, and CBE account details.' },
    { num: '02', title: 'Members join via invite link', desc: 'Share a code. Members join in seconds.' },
    { num: '03', title: 'Givers transfer via CBE & upload receipt', desc: 'Transfer externally, then upload the CBE receipt in-app.' },
    { num: '04', title: 'Collector verifies & approves', desc: 'FT reference checked for uniqueness. One-click approval.' },
    { num: '05', title: 'Lottery draw when all paid', desc: 'Spin the wheel. One lucky member wins the pool.' },
    { num: '06', title: 'Repeat until everyone wins', desc: 'Cycle resets. Every member wins exactly once per Ekub.' },
  ]

  return (
    <div className="min-h-dvh bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">EkubLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/auth?tab=signup"
              className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-xl font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-sm text-brand-400">
            <Star className="w-3.5 h-3.5" />
            <span>Trusted by Ethiopian savings groups</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Your Traditional Ekub,{' '}
            <span className="text-gradient">Digitized</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Manage rotating savings groups with full transparency, CBE receipt verification, 
            and real-time payment tracking — all in one mobile-friendly app.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth?tab=signup"
              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-95 animate-pulse-glow"
            >
              Start Your Ekub
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/groups/join"
              className="flex items-center justify-center gap-2 glass border border-white/10 hover:border-brand-500/50 text-white px-6 py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-95"
            >
              Join with Code
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 -mt-6 mb-16">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-6 grid grid-cols-3 divide-x divide-white/10">
            {[
              { val: '100%', label: 'Receipt Verified' },
              { val: 'CBE', label: 'Direct Transfers' },
              { val: '0', label: 'Fraud Cases' },
            ].map((s, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-2xl font-bold text-brand-400">{s.val}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Everything you need</h2>
          <p className="text-gray-500 text-center mb-10">Built for the way Ethiopians actually save together</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass rounded-2xl p-5 card-hover">
                <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center mb-3 text-brand-400">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 pb-20 bg-gray-900/50">
        <div className="max-w-2xl mx-auto py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-gray-500 text-center mb-10">Six simple steps to a fully transparent Ekub cycle</p>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4 glass rounded-2xl p-4">
                <div className="shrink-0 w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-brand-400 text-xs font-bold">{s.num}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="max-w-xl mx-auto text-center glass rounded-3xl p-8 sm:p-12">
          <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Ready to start saving smarter?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Create your first digital Ekub group in under 2 minutes. Invite friends, family, or colleagues.
          </p>
          <div className="space-y-2">
            {['No monthly fees', 'Works with CBE & CBEBirr', 'Mobile-first design'].map((t, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                {t}
              </div>
            ))}
          </div>
          <Link
            href="/auth?tab=signup"
            className="mt-6 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95"
          >
            Get Started Free
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-6 text-center text-gray-600 text-xs">
        © 2025 EkubLink. Built with ❤️ for Ethiopian savings communities.
      </footer>
    </div>
  )
}
