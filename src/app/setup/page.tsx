import { SetupForm } from '@/components/SetupForm'

export default function SetupPage() {
  return (
    <div className="max-w-md mx-auto pt-4 sm:pt-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Accept Payments</h1>
        <p className="text-gray-400 text-sm">
          Configure your ENS name to receive payments from anyone, on any chain.
          Your preferences are stored as ENS text records &mdash; fully on-chain.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <SetupForm />
      </div>
    </div>
  )
}
