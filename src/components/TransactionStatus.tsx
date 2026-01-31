'use client'

import { useWaitForTransactionReceipt } from 'wagmi'
import { CHAIN_META } from '@/lib/constants'
import type { PaymentStatus } from '@/hooks/usePayment'

interface Props {
  status: PaymentStatus
  txHash: `0x${string}` | undefined
  error: string | null
  chainId: number
  recipientName: string
  amount: string
  token: string
  onReset: () => void
}

export function TransactionStatus({
  status,
  txHash,
  error,
  chainId,
  recipientName,
  amount,
  token,
  onReset,
}: Props) {
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const chain = CHAIN_META[chainId]
  const explorerUrl = txHash ? `${chain?.explorer ?? 'https://etherscan.io'}/tx/${txHash}` : null
  const resolved = isSuccess ? 'success' : status

  return (
    <div className="text-center space-y-6 py-8">
      {/* Icon */}
      <div className="flex justify-center">
        {(resolved === 'sending' || resolved === 'confirming') && (
          <div
            className={`w-16 h-16 rounded-full border-4 border-t-transparent animate-spin ${
              resolved === 'sending' ? 'border-blue-500' : 'border-yellow-500'
            }`}
          />
        )}
        {resolved === 'success' && (
          <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {resolved === 'error' && (
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Label */}
      <div>
        {resolved === 'sending' && (
          <>
            <h3 className="text-lg font-semibold text-white">Confirm in wallet</h3>
            <p className="text-sm text-gray-400 mt-1">
              Sending {amount} {token} to {recipientName}
            </p>
          </>
        )}
        {resolved === 'confirming' && (
          <>
            <h3 className="text-lg font-semibold text-white">Transaction pending</h3>
            <p className="text-sm text-gray-400 mt-1">Waiting for on-chain confirmation&hellip;</p>
          </>
        )}
        {resolved === 'success' && (
          <>
            <h3 className="text-lg font-semibold text-white">Payment sent!</h3>
            <p className="text-sm text-gray-400 mt-1">
              {amount} {token} sent to {recipientName}
            </p>
          </>
        )}
        {resolved === 'error' && (
          <>
            <h3 className="text-lg font-semibold text-white">Payment failed</h3>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </>
        )}
      </div>

      {/* Explorer link */}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View on explorer
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* Reset */}
      {(resolved === 'success' || resolved === 'error') && (
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          {resolved === 'success' ? 'Send another payment' : 'Try again'}
        </button>
      )}
    </div>
  )
}
