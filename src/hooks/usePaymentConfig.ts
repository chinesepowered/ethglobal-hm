'use client'

import { useEffect, useState } from 'react'
import { resolvePaymentConfig, PaymentConfig } from '@/lib/ens'

/**
 * Resolves an ENS name to its PayLinks payment configuration.
 * Re-fetches whenever `name` changes.
 */
export function usePaymentConfig(name: string | undefined) {
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!name) {
      setConfig(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    resolvePaymentConfig(name)
      .then((result) => {
        if (cancelled) return
        if (!result.address) {
          setError('ENS name not found or has no address set')
        } else {
          setConfig(result)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to resolve ENS name')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [name])

  return { config, loading, error }
}
