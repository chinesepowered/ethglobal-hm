'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const ensName = trimmed.endsWith('.eth') ? trimmed : `${trimmed}.eth`
    router.push(`/pay/${ensName}`)
  }

  return (
    <div className="flex flex-col items-center pt-16 sm:pt-24 pb-16">
      {/* ---- Hero ---- */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Pay anyone with their{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ENS name
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto">
          Send from any token on any chain. They receive USDC on their preferred
          chain. Powered by ENS, LI.FI, and Circle.
        </p>
      </div>

      {/* ---- Search ---- */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg mb-20">
        <div className="relative group">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vitalik.eth"
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 group-hover:border-white/15 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            Pay
          </button>
        </div>
      </form>

      {/* ---- Features ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        <Card
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
          color="blue"
          title="ENS Identity"
          text="Payment config stored in ENS text records. No sign-ups, no databases, fully on-chain."
        />
        <Card
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          color="purple"
          title="Any Chain"
          text="Pay from Ethereum, Base, Arbitrum, or Optimism. LI.FI finds the cheapest route."
        />
        <Card
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
          title="USDC Settlement"
          text="Merchants always receive USDC. Powered by Circle for reliable stablecoin settlement."
        />
      </div>

      {/* ---- How it works ---- */}
      <div className="w-full max-w-3xl mt-24">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: '1', title: 'Set up', desc: 'Store payment config in your ENS text records' },
            { n: '2', title: 'Share', desc: 'Share your link: /pay/you.eth' },
            { n: '3', title: 'Pay', desc: 'Payer sends from any token on any chain' },
            { n: '4', title: 'Receive', desc: 'You receive USDC on your preferred chain' },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                {s.n}
              </div>
              <h4 className="font-medium text-white mb-1">{s.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- CTA ---- */}
      <div className="mt-16">
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          Set up your payment link
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

/* ---- Feature card ---- */
function Card({
  icon,
  color,
  title,
  text,
}: {
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'green'
  title: string
  text: string
}) {
  const bg = { blue: 'bg-blue-500/10', purple: 'bg-purple-500/10', green: 'bg-green-500/10' }[color]

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
    </div>
  )
}
