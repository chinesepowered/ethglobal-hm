'use client'

import { useState, useMemo } from 'react'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { PaymentConfig } from '@/lib/ens'
import { useLiFiQuote } from '@/hooks/useLiFiQuote'
import { usePayment } from '@/hooks/usePayment'
import { USDC_ADDRESSES, CHAIN_META, PAY_TOKENS, NATIVE_TOKEN } from '@/lib/constants'
import { RoutePreview } from './RoutePreview'
import { TransactionStatus } from './TransactionStatus'

export function PaymentForm({ config }: { config: PaymentConfig }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const payment = usePayment()

  const [amount, setAmount] = useState(config.suggestedAmount || '')
  const [selectedToken, setSelectedToken] = useState<(typeof PAY_TOKENS)[number]>(PAY_TOKENS[0])

  // Merchant's preferred destination
  const merchantChainId = config.chainId || 11155111
  const isCrossChain = chainId !== merchantChainId
  const merchantUSDC = USDC_ADDRESSES[merchantChainId]

  // Payer's balance
  const { data: balance } = useBalance({ address, chainId })

  // Amount in smallest unit
  const fromAmount = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return '0'
    try {
      return parseUnits(amount, selectedToken.decimals).toString()
    } catch {
      return '0'
    }
  }, [amount, selectedToken.decimals])

  // Token addresses
  const fromTokenAddr =
    selectedToken.symbol === 'USDC'
      ? USDC_ADDRESSES[chainId] || NATIVE_TOKEN
      : selectedToken.address
  const toTokenAddr = merchantUSDC || NATIVE_TOKEN

  // Do we need LI.FI routing? (cross-chain or different token)
  const needsRoute =
    isCrossChain || selectedToken.symbol !== config.token

  // Build LI.FI quote params
  const quoteParams = useMemo(() => {
    if (!needsRoute || !address || !config.address || fromAmount === '0') return null
    return {
      fromChain: chainId,
      toChain: merchantChainId,
      fromToken: fromTokenAddr,
      toToken: toTokenAddr,
      fromAmount,
      fromAddress: address,
      toAddress: config.address,
    }
  }, [needsRoute, address, config.address, chainId, merchantChainId, fromTokenAddr, toTokenAddr, fromAmount])

  const { quote, loading: quoteLoading, error: quoteError } = useLiFiQuote(quoteParams)

  // Pay handler
  async function handlePay() {
    if (!config.address) return

    if (needsRoute && quote) {
      await payment.executeLiFi(quote)
    } else if (!needsRoute && selectedToken.symbol === 'ETH') {
      await payment.executeDirect(config.address, amount, chainId)
    } else if (quote) {
      await payment.executeLiFi(quote)
    }
  }

  const validAmount = !!amount && parseFloat(amount) > 0
  const canPay = isConnected && validAmount && (needsRoute ? !!quote : true)

  // Transaction in progress
  if (payment.status !== 'idle') {
    return (
      <TransactionStatus
        status={payment.status}
        txHash={payment.txHash}
        error={payment.error}
        chainId={chainId}
        recipientName={config.name}
        amount={amount}
        token={selectedToken.symbol}
        onReset={payment.reset}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="any"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Token selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Pay with</label>
        <div className="grid grid-cols-2 gap-2">
          {PAY_TOKENS.map((t) => (
            <button
              key={t.symbol}
              onClick={() => setSelectedToken(t)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selectedToken.symbol === t.symbol
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {t.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      {isConnected && balance && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Your balance</span>
          <span className="text-gray-400">
            {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)}{' '}
            {balance.symbol}
          </span>
        </div>
      )}

      {/* Cross-chain banner */}
      {isConnected && isCrossChain && (
        <div className="px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-sm text-purple-300">
            Cross-chain payment:{' '}
            <span className="font-medium">
              {CHAIN_META[chainId]?.name ?? 'Unknown'}
            </span>{' '}
            &rarr;{' '}
            <span className="font-medium">
              {CHAIN_META[merchantChainId]?.name ?? 'Unknown'}
            </span>
          </p>
          <p className="text-xs text-purple-400/60 mt-1">
            Routed via LI.FI for the best rate
          </p>
        </div>
      )}

      {/* Route preview */}
      {needsRoute && validAmount && isConnected && (
        <RoutePreview quote={quote} loading={quoteLoading} error={quoteError} />
      )}

      {/* Action */}
      {!isConnected ? (
        <div className="flex justify-center pt-2">
          <ConnectButton />
        </div>
      ) : (
        <button
          onClick={handlePay}
          disabled={!canPay || quoteLoading}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          {quoteLoading
            ? 'Finding best route...'
            : `Pay ${amount || '0'} ${selectedToken.symbol}`}
        </button>
      )}

      {/* Sponsors */}
      <div className="flex items-center justify-center gap-3 pt-2 select-none">
        <span className="text-[11px] text-gray-600 uppercase tracking-wider">Powered by</span>
        <span className="text-xs text-blue-400/80 font-medium">ENS</span>
        <span className="text-gray-700">&middot;</span>
        <span className="text-xs text-purple-400/80 font-medium">LI.FI</span>
        <span className="text-gray-700">&middot;</span>
        <span className="text-xs text-green-400/80 font-medium">Circle</span>
      </div>
    </div>
  )
}
