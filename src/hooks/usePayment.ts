'use client'

import { useState } from 'react'
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { LiFiQuote } from '@/lib/lifi'

export type PaymentStatus = 'idle' | 'sending' | 'confirming' | 'success' | 'error'

export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const { sendTransactionAsync } = useSendTransaction()

  /** Execute a LI.FI routed payment. */
  async function executeLiFi(quote: LiFiQuote) {
    try {
      setStatus('sending')
      setError(null)

      if (!quote.transactionRequest) {
        throw new Error('No transaction data in quote')
      }

      const tx = quote.transactionRequest
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || '0'),
        chainId: tx.chainId,
      })

      setTxHash(hash)
      setStatus('confirming')
      return hash
    } catch (err: unknown) {
      setStatus('error')
      const msg =
        err && typeof err === 'object' && 'shortMessage' in err
          ? (err as { shortMessage: string }).shortMessage
          : err instanceof Error
            ? err.message
            : 'Transaction failed'
      setError(msg)
      return undefined
    }
  }

  /** Execute a direct native-token transfer (same chain, ETH). */
  async function executeDirect(to: `0x${string}`, amount: string, chainId: number) {
    try {
      setStatus('sending')
      setError(null)

      const hash = await sendTransactionAsync({
        to,
        value: parseEther(amount),
        chainId,
      })

      setTxHash(hash)
      setStatus('confirming')
      return hash
    } catch (err: unknown) {
      setStatus('error')
      const msg =
        err && typeof err === 'object' && 'shortMessage' in err
          ? (err as { shortMessage: string }).shortMessage
          : err instanceof Error
            ? err.message
            : 'Transaction failed'
      setError(msg)
      return undefined
    }
  }

  function reset() {
    setStatus('idle')
    setTxHash(undefined)
    setError(null)
  }

  return { status, txHash, error, executeLiFi, executeDirect, reset }
}
