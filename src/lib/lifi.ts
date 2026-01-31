import { LIFI_API } from './constants'

/* ------------------------------------------------------------------ */
/*  Types (subset of LI.FI response)                                  */
/* ------------------------------------------------------------------ */

export interface LiFiToken {
  address: string
  symbol: string
  decimals: number
  chainId: number
  name: string
  logoURI?: string
}

export interface LiFiEstimate {
  fromAmount: string
  toAmount: string
  toAmountMin: string
  approvalAddress: string
  feeCosts: { name: string; amountUSD: string }[]
  gasCosts: { amountUSD: string }[]
  executionDuration: number
  fromAmountUSD: string
  toAmountUSD: string
}

export interface LiFiTransactionRequest {
  data: string
  to: string
  value: string
  from: string
  chainId: number
  gasPrice?: string
  gasLimit?: string
}

export interface LiFiQuote {
  id: string
  type: string
  tool: string
  action: {
    fromChainId: number
    fromAmount: string
    fromToken: LiFiToken
    toChainId: number
    toToken: LiFiToken
    slippage: number
    fromAddress: string
    toAddress: string
  }
  estimate: LiFiEstimate
  transactionRequest?: LiFiTransactionRequest
}

export interface QuoteRequest {
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  fromAmount: string
  fromAddress: string
  toAddress: string
  slippage?: number
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

export async function getQuote(params: QuoteRequest): Promise<LiFiQuote> {
  const qs = new URLSearchParams({
    fromChain: params.fromChain.toString(),
    toChain: params.toChain.toString(),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    slippage: (params.slippage ?? 0.03).toString(),
  })

  const res = await fetch(`${LIFI_API}/quote?${qs}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `LI.FI quote error ${res.status}`)
  }
  return res.json()
}

export async function getTokens(chainId: number): Promise<LiFiToken[]> {
  const res = await fetch(`${LIFI_API}/tokens?chains=${chainId}`)
  if (!res.ok) throw new Error('Failed to fetch tokens')
  const data = await res.json()
  return data.tokens?.[chainId] ?? []
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  return `~${Math.floor(seconds / 60)}m`
}

export function fmtUSD(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
