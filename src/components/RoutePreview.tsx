'use client'

import { LiFiQuote, fmtDuration, fmtUSD } from '@/lib/lifi'

interface Props {
  quote: LiFiQuote | null
  loading: boolean
  error: string | null
}

export function RoutePreview({ quote, loading, error }: Props) {
  if (loading) {
    return (
      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Finding best route via LI.FI...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!quote) return null

  const totalFees = [
    ...quote.estimate.feeCosts.map((f) => parseFloat(f.amountUSD || '0')),
    ...quote.estimate.gasCosts.map((g) => parseFloat(g.amountUSD || '0')),
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Route</span>
        <span className="text-white font-medium capitalize">{quote.tool}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">You send</span>
        <span className="text-white">{fmtUSD(quote.estimate.fromAmountUSD)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">They receive</span>
        <span className="text-green-400 font-medium">
          {fmtUSD(quote.estimate.toAmountUSD)}
        </span>
      </div>
      {totalFees > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Fees</span>
          <span className="text-gray-500">{fmtUSD(totalFees)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Est. time</span>
        <span className="text-gray-300">
          {fmtDuration(quote.estimate.executionDuration)}
        </span>
      </div>
    </div>
  )
}
