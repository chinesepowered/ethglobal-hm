// USDC contract addresses by chain ID
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',       // Ethereum Mainnet
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',     // Base
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',    // Arbitrum One
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',       // Optimism
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',    // Base Sepolia
}

// ENS text record keys used by PayLinks
export const ENS_KEYS = {
  token: 'com.enspaylinks.token',
  chainId: 'com.enspaylinks.chainId',
  description: 'com.enspaylinks.description',
  amount: 'com.enspaylinks.amount',
} as const

// Chain display metadata
export const CHAIN_META: Record<number, { name: string; logo: string; color: string; explorer: string }> = {
  1:        { name: 'Ethereum',      logo: '\u039E', color: '#627EEA', explorer: 'https://etherscan.io' },
  8453:     { name: 'Base',          logo: '\u{1F535}', color: '#0052FF', explorer: 'https://basescan.org' },
  42161:    { name: 'Arbitrum',      logo: '\u{1F537}', color: '#28A0F0', explorer: 'https://arbiscan.io' },
  10:       { name: 'Optimism',      logo: '\u{1F534}', color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
  11155111: { name: 'Sepolia',       logo: '\u039E', color: '#627EEA', explorer: 'https://sepolia.etherscan.io' },
  84532:    { name: 'Base Sepolia',  logo: '\u{1F535}', color: '#0052FF', explorer: 'https://sepolia.basescan.org' },
}

// LI.FI API base
export const LIFI_API = 'https://li.quest/v1'

// Native token placeholder address used by LI.FI
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

// Chain options for the setup form
export const CHAIN_OPTIONS = [
  { id: 11155111, name: 'Sepolia (Testnet)' },
  { id: 84532,    name: 'Base Sepolia (Testnet)' },
  { id: 1,        name: 'Ethereum' },
  { id: 8453,     name: 'Base' },
  { id: 42161,    name: 'Arbitrum' },
  { id: 10,       name: 'Optimism' },
] as const

// Token options for payers
export const PAY_TOKENS = [
  { symbol: 'ETH',  address: NATIVE_TOKEN, decimals: 18 },
  { symbol: 'USDC', address: 'USDC',       decimals: 6 },
] as const

// ENS Public Resolver addresses (for writing text records)
export const ENS_RESOLVER: Record<number, `0x${string}`> = {
  1:        '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
  11155111: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
}
