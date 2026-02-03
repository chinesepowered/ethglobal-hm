'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { namehash } from 'viem/ens'
import { normalize } from 'viem/ens'
import { encodeFunctionData } from 'viem'
import { ENS_KEYS, CHAIN_OPTIONS, ENS_RESOLVER } from '@/lib/constants'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

// Minimal PublicResolver ABI for setText + multicall
const RESOLVER_ABI = [
  {
    name: 'setText',
    type: 'function' as const,
    inputs: [
      { name: 'node', type: 'bytes32' as const },
      { name: 'key', type: 'string' as const },
      { name: 'value', type: 'string' as const },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'multicall',
    type: 'function' as const,
    inputs: [{ name: 'data', type: 'bytes[]' as const }],
    outputs: [{ name: 'results', type: 'bytes[]' as const }],
    stateMutability: 'nonpayable' as const,
  },
] as const

type Step = 'form' | 'saving' | 'done'

export function SetupForm() {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()

  const [ensName, setEnsName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedChain, setSelectedChain] = useState(11155111)
  const [token, setToken] = useState('USDC')
  const [suggestedAmount, setSuggestedAmount] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [saveError, setSaveError] = useState<string | null>(null)

  const { config: existingConfig } = usePaymentConfig(ensName || undefined)
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  // Only subscribe to transaction receipt when we have a valid hash
  useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } })

  // Get resolver for the ENS name (dynamic lookup or fallback to known address)
  async function getResolver(): Promise<`0x${string}` | null> {
    if (!ensName) return null

    // Try dynamic lookup first
    try {
      if (publicClient) {
        const resolver = await publicClient.getEnsResolver({ name: normalize(ensName) })
        if (resolver) return resolver
      }
    } catch {
      // Fallback to known addresses
    }

    // Fallback to static addresses
    if (chain?.id && ENS_RESOLVER[chain.id]) {
      return ENS_RESOLVER[chain.id]
    }

    return null
  }

  async function handleSave() {
    if (!ensName) return
    setSaveError(null)
    setStep('saving')

    try {
      const resolverAddr = await getResolver()
      if (!resolverAddr) {
        throw new Error('Could not find ENS resolver. Make sure you are on Ethereum mainnet or Sepolia.')
      }

      const node = namehash(normalize(ensName))

      // Build multicall data for all text records at once
      const records: [string, string][] = [
        [ENS_KEYS.token, token],
        [ENS_KEYS.chainId, selectedChain.toString()],
      ]
      if (description) records.push([ENS_KEYS.description, description])
      if (suggestedAmount) records.push([ENS_KEYS.amount, suggestedAmount])

      const calls = records.map(([key, value]) =>
        encodeFunctionData({
          abi: RESOLVER_ABI,
          functionName: 'setText',
          args: [node, key, value],
        }),
      )

      const hash = await writeContractAsync({
        address: resolverAddr,
        abi: RESOLVER_ABI,
        functionName: 'multicall',
        args: [calls],
      })

      setTxHash(hash)
      setStep('done')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'shortMessage' in err
          ? (err as { shortMessage: string }).shortMessage
          : err instanceof Error
            ? err.message
            : 'Failed to save'
      setSaveError(msg)
      setStep('form')
    }
  }

  /* ------ Not connected ------ */
  if (!isConnected) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-semibold text-white">Connect your wallet</h2>
        <p className="text-gray-400 text-sm">
          Connect the wallet that owns your ENS name to configure payments.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  /* ------ Done ------ */
  if (step === 'done') {
    const payLink =
      typeof window !== 'undefined'
        ? `${window.location.origin}/pay/${ensName}`
        : `/pay/${ensName}`

    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Payment link ready!</h2>
          <p className="text-gray-400 text-sm mt-2">Share this link to receive payments:</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
          <code className="text-blue-400 text-sm truncate">{payLink}</code>
          <button
            onClick={() => navigator.clipboard.writeText(payLink)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/15 transition-colors flex-shrink-0"
          >
            Copy
          </button>
        </div>
      </div>
    )
  }

  /* ------ Form ------ */
  return (
    <div className="space-y-6">
      {/* ENS name */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Your ENS name</label>
        <input
          type="text"
          value={ensName}
          onChange={(e) => setEnsName(e.target.value)}
          placeholder="yourname.eth"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
        />
        {existingConfig?.address && (
          <p className="text-xs text-green-400 mt-1.5">
            Resolves to {existingConfig.address.slice(0, 6)}&hellip;
            {existingConfig.address.slice(-4)}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Coffee shop payments"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
        />
      </div>

      {/* Token */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Receive payments in</label>
        <div className="grid grid-cols-2 gap-2">
          {['USDC', 'ETH'].map((t) => (
            <button
              key={t}
              onClick={() => setToken(t)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                token === t
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chain */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Receive on chain</label>
        <select
          value={selectedChain}
          onChange={(e) => setSelectedChain(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none cursor-pointer"
        >
          {CHAIN_OPTIONS.map((c) => (
            <option key={c.id} value={c.id} className="bg-gray-900">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Suggested amount */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Suggested amount (optional)</label>
        <input
          type="number"
          value={suggestedAmount}
          onChange={(e) => setSuggestedAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="any"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Error */}
      {saveError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-sm text-red-400">{saveError}</p>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!ensName || step === 'saving'}
        className="w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
      >
        {step === 'saving' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving to ENS&hellip;
          </span>
        ) : (
          'Save Payment Config'
        )}
      </button>

      {/* Chain warning */}
      {chain && !ENS_RESOLVER[chain.id] && (
        <p className="text-xs text-yellow-400 text-center">
          Switch to Ethereum Mainnet or Sepolia to write ENS records.
        </p>
      )}

      {/* Preview */}
      {ensName && (
        <div className="border-t border-white/10 pt-6 mt-2">
          <p className="text-sm text-gray-500 mb-3">Payment page preview</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {ensName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{ensName}</p>
                {description && (
                  <p className="text-xs text-gray-400 truncate">{description}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {token}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {CHAIN_OPTIONS.find((c) => c.id === selectedChain)?.name}
              </span>
              {suggestedAmount && (
                <span className="text-xs text-gray-500">
                  Suggested: {suggestedAmount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
