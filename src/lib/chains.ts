import { mainnet, base, arbitrum, optimism, sepolia, baseSepolia } from 'wagmi/chains'

export const allChains = [mainnet, sepolia, base, baseSepolia, arbitrum, optimism] as const

export function getChainName(chainId: number): string {
  const chain = allChains.find((c) => c.id === chainId)
  return chain?.name ?? `Chain ${chainId}`
}

export function isTestnet(chainId: number): boolean {
  return chainId === sepolia.id || chainId === baseSepolia.id
}
