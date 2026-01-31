'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            P
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">
            Pay<span className="text-blue-400">Links</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/setup"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            Accept Payments
          </Link>
          <ConnectButton
            accountStatus="avatar"
            showBalance={false}
            chainStatus="icon"
          />
        </div>
      </div>
    </header>
  )
}
