'use client'

import { useEffect, useState, useRef } from 'react'
import { getQuote, LiFiQuote, QuoteRequest } from '@/lib/lifi'

/**
 * Fetches a LI.FI quote with debouncing.
 * Returns null when params are incomplete.
 */
export function useLiFiQuote(params: QuoteRequest | null) {
  const [quote, setQuote] = useState<LiFiQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Reset when params become null
    if (!params || !params.fromAmount || params.fromAmount === '0') {
      setQuote(null)
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const result = await getQuote(params)
        if (!controller.signal.aborted) {
          setQuote(result)
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Failed to get quote'
          setError(message)
          setQuote(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 600) // Debounce 600ms

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
    // Stringify params for stable dependency comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return { quote, loading, error }
}
