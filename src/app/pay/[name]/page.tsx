'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'
import { ENSProfile } from '@/components/ENSProfile'
import { PaymentForm } from '@/components/PaymentForm'

export default function PayPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)
  const { config, loading, error } = usePaymentConfig(name)

  return (
    <div className="max-w-md mx-auto pt-4 sm:pt-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-6">
        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Resolving {name}&hellip;</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Name not found</h3>
            <p className="text-sm text-gray-400">{error}</p>
            <p className="text-sm text-gray-500 mt-3">
              Make sure the ENS name is registered and has an address set.
            </p>
          </div>
        )}

        {/* Ready */}
        {config && (
          <>
            <ENSProfile config={config} />
            <div className="border-t border-white/[0.06] pt-6">
              <PaymentForm config={config} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
