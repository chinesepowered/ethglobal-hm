'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useState, useRef, useEffect } from 'react'
import { CHAIN_META } from '@/lib/constants'

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, chains } = useSwitchChain()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
      >
        Connect Wallet
      </button>
    )
  }

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const chainName = chain ? (CHAIN_META[chain.id]?.name ?? chain.name) : 'Unknown'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        {chain && (
          <span className="text-xs text-gray-400">{chainName}</span>
        )}
        <span className="text-sm text-white font-medium">{short}</span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Chain switcher */}
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Network</p>
            <div className="space-y-0.5">
              {chains.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    switchChain({ chainId: c.id })
                    setOpen(false)
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    c.id === chain?.id
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {CHAIN_META[c.id]?.name ?? c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Disconnect */}
          <button
            onClick={() => {
              disconnect()
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/5 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
