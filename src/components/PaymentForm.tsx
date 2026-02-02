'use client'

import { useState, useMemo } from 'react'
import { useAccount, useBalance, useChainId, useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits, erc20Abi } from 'viem'
import { ConnectButton } from './ConnectButton'
import { PaymentConfig } from '@/lib/ens'
import { useLiFiQuote } from '@/hooks/useLiFiQuote'
import { usePayment } from '@/hooks/usePayment'
import { USDC_ADDRESSES, CHAIN_META, PAY_TOKENS, NATIVE_TOKEN } from '@/lib/constants'
import { RoutePreview } from './RoutePreview'
import { TransactionStatus } from './TransactionStatus'

const ZERO: `0x${string}` = '0x0000000000000000000000000000000000000000'

export function PaymentForm({ config }: { config: PaymentConfig }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const payment = usePayment()
  const { writeContractAsync } = useWriteContract()

  const [amount, setAmount] = useState(config.suggestedAmount || '')
  const [selectedToken, setSelectedToken] = useState<(typeof PAY_TOKENS)[number]>(PAY_TOKENS[0])
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)

  // ── Merchant destination ──────────────────────────────────────────
  const merchantChainId = config.chainId || 11155111
  const isCrossChain = chainId !== merchantChainId
  const merchantToken = config.token || 'USDC'

  const toTokenAddr =
    merchantToken === 'ETH'
      ? NATIVE_TOKEN
      : USDC_ADDRESSES[merchantChainId] || NATIVE_TOKEN

  // ── Payer state ───────────────────────────────────────────────────
  const isNativeToken = selectedToken.symbol === 'ETH'
  const fromTokenAddr = isNativeToken
    ? NATIVE_TOKEN
    : USDC_ADDRESSES[chainId] || NATIVE_TOKEN

  const { data: balance } = useBalance({ address, chainId })

  const fromAmount = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return '0'
    try {
      return parseUnits(amount, selectedToken.decimals).toString()
    } catch {
      return '0'
    }
  }, [amount, selectedToken.decimals])

  // ── Routing decision ──────────────────────────────────────────────
  const needsRoute = isCrossChain || selectedToken.symbol !== merchantToken

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

  // ── ERC-20 approval ───────────────────────────────────────────────
  const approvalAddress = (quote?.estimate?.approvalAddress ?? ZERO) as `0x${string}`
  const shouldCheckAllowance = !isNativeToken && !!quote && approvalAddress !== ZERO && !!address

  const { data: currentAllowance } = useReadContract({
    address: fromTokenAddr as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address ?? ZERO, approvalAddress],
    query: { enabled: shouldCheckAllowance },
  })

  const needsApproval =
    shouldCheckAllowance &&
    currentAllowance !== undefined &&
    currentAllowance < BigInt(fromAmount || '0') &&
    !approved

  async function handleApprove() {
    if (!approvalAddress || approvalAddress === ZERO) return
    setApproving(true)
    try {
      await writeContractAsync({
        address: fromTokenAddr as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [approvalAddress, BigInt(fromAmount)],
      })
      setApproved(true)
    } catch {
      // user rejected or tx failed — stay on approve step
    } finally {
      setApproving(false)
    }
  }

  // ── Fallback: direct transfer when LI.FI has no route ─────────────
  // Possible on same-chain only (can't bridge without a router).
  const lifiUnavailable = needsRoute && !quoteLoading && !quote && !!quoteError
  const canFallback = lifiUnavailable && !isCrossChain

  // ── Pay handler ───────────────────────────────────────────────────
  async function handlePay() {
    if (!config.address) return

    // LI.FI routed payment
    if (quote && !needsApproval) {
      await payment.executeLiFi(quote)
      return
    }

    // Direct native-token transfer (same chain, same token OR fallback)
    if (!needsRoute || canFallback) {
      await payment.executeDirect(config.address, amount, chainId)
    }
  }

  const validAmount = !!amount && parseFloat(amount) > 0
  const canPay =
    isConnected &&
    validAmount &&
    !needsApproval &&
    (needsRoute ? !!quote || canFallback : true)

  // ── Tx in progress ────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setApproved(false)
          }}
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
              onClick={() => {
                setSelectedToken(t)
                setApproved(false)
              }}
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
      {isConnected && isCrossChain && !lifiUnavailable && (
        <div className="px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-sm text-purple-300">
            Cross-chain payment:{' '}
            <span className="font-medium">{CHAIN_META[chainId]?.name ?? 'Unknown'}</span>
            {' '}&rarr;{' '}
            <span className="font-medium">{CHAIN_META[merchantChainId]?.name ?? 'Unknown'}</span>
          </p>
          <p className="text-xs text-purple-400/60 mt-1">Routed via LI.FI for the best rate</p>
        </div>
      )}

      {/* Route preview (only when LI.FI is active, not in fallback) */}
      {needsRoute && validAmount && isConnected && !canFallback && (
        <RoutePreview quote={quote} loading={quoteLoading} error={quoteError} />
      )}

      {/* Same-chain fallback banner */}
      {canFallback && validAmount && isConnected && (
        <div className="px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-sm text-yellow-300">
            LI.FI routing unavailable on this network
          </p>
          <p className="text-xs text-yellow-400/60 mt-1">
            Sending {selectedToken.symbol} directly to {config.name}
          </p>
        </div>
      )}

      {/* Cross-chain + no route = stuck */}
      {isCrossChain && lifiUnavailable && (
        <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-sm text-red-400">
            Cross-chain routing unavailable on this network pair
          </p>
          <p className="text-xs text-red-400/60 mt-1">
            Switch to{' '}
            <span className="font-medium">{CHAIN_META[merchantChainId]?.name}</span>{' '}
            for a direct payment.
          </p>
        </div>
      )}

      {/* Action area */}
      {!isConnected ? (
        <div className="flex justify-center pt-2">
          <ConnectButton />
        </div>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
        >
          {approving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Approving&hellip;
            </span>
          ) : (
            `Approve ${selectedToken.symbol}`
          )}
        </button>
      ) : (
        <button
          onClick={handlePay}
          disabled={!canPay || quoteLoading}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          {quoteLoading
            ? 'Finding best route...'
            : canFallback
              ? `Pay ${amount || '0'} ${selectedToken.symbol} (direct)`
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
