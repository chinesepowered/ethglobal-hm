import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { ENS_KEYS } from './constants'

export interface PaymentConfig {
  address: `0x${string}` | null
  token: string
  chainId: number | null
  description: string | null
  suggestedAmount: string | null
  avatar: string | null
  name: string
}

// Dedicated clients for ENS resolution (always mainnet or sepolia, regardless of user's connected chain)
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC || undefined),
})

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || undefined),
})

function getClient() {
  return process.env.NEXT_PUBLIC_TESTNET === 'true' ? sepoliaClient : mainnetClient
}

/**
 * Resolve an ENS name to its full payment configuration.
 * Reads the address, avatar, and PayLinks-specific text records.
 */
export async function resolvePaymentConfig(name: string): Promise<PaymentConfig> {
  const client = getClient()
  const normalized = normalize(name)

  const [address, token, chainId, description, amount, avatar] = await Promise.all([
    client.getEnsAddress({ name: normalized }).catch(() => null),
    client.getEnsText({ name: normalized, key: ENS_KEYS.token }).catch(() => null),
    client.getEnsText({ name: normalized, key: ENS_KEYS.chainId }).catch(() => null),
    client.getEnsText({ name: normalized, key: ENS_KEYS.description }).catch(() => null),
    client.getEnsText({ name: normalized, key: ENS_KEYS.amount }).catch(() => null),
    client.getEnsAvatar({ name: normalized }).catch(() => null),
  ])

  return {
    address,
    token: token || 'USDC',
    chainId: chainId ? parseInt(chainId, 10) : null,
    description,
    suggestedAmount: amount,
    avatar,
    name,
  }
}

/**
 * Reverse-resolve an address to an ENS name.
 */
export async function resolveENSName(address: `0x${string}`): Promise<string | null> {
  const client = getClient()
  return client.getEnsName({ address }).catch(() => null)
}
