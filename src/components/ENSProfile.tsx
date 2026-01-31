'use client'

import { PaymentConfig } from '@/lib/ens'
import { CHAIN_META } from '@/lib/constants'

export function ENSProfile({ config }: { config: PaymentConfig }) {
  const chain = config.chainId ? CHAIN_META[config.chainId] : null
  const short = config.address
    ? `${config.address.slice(0, 6)}...${config.address.slice(-4)}`
    : null

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
        {config.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.avatar}
            alt={config.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold">
            {config.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-white truncate">{config.name}</h2>
        {short && (
          <p className="text-sm text-gray-500 font-mono">{short}</p>
        )}
        {config.description && (
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
            {config.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            {config.token}
          </span>
          {chain && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
              {chain.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
