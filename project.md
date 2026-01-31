# Project Guide for AI Coding Agents

This document describes the ENS PayLinks codebase in detail so an AI coding agent can pick up development without needing to re-explore the project from scratch.

---

## Overview

ENS PayLinks is a Next.js 14 web app that lets users pay any ENS name from any EVM chain. The merchant stores payment preferences (token, chain, description) as ENS text records. The payer visits `/pay/name.eth`, the app resolves the config from ENS, gets a cross-chain route from LI.FI, and executes the payment.

**Three sponsor integrations:**
- **ENS**: Name resolution + text record read/write (identity & config layer)
- **LI.FI**: Cross-chain routing via REST API (swap + bridge execution)
- **Circle**: USDC settlement (default receive token for merchants)

---

## Tech Stack & Versions

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.x | App Router, SSR, file-based routing |
| react / react-dom | 18.3.x | UI framework |
| wagmi | 2.12.x | React hooks for Ethereum (accounts, contracts, ENS) |
| viem | 2.21.x | Low-level Ethereum client (ENS resolution, tx building) |
| @rainbow-me/rainbowkit | 2.2.x | Wallet connection modal |
| @tanstack/react-query | 5.59.x | Async state management (used by wagmi) |
| tailwindcss | 3.4.x | Utility-first CSS |
| typescript | 5.6.x | Type checking (strict mode) |

**No smart contracts** — all interactions are client-side via ENS + LI.FI API + direct transfers.

---

## Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── globals.css             # Tailwind directives + dark theme + scrollbar
│   ├── layout.tsx              # Root layout: Web3Provider + Header + Footer
│   ├── page.tsx                # Landing page (client component)
│   ├── pay/[name]/page.tsx     # Payment page (client, dynamic route)
│   └── setup/page.tsx          # Merchant setup page (server component shell)
│
├── components/
│   ├── Header.tsx              # Sticky nav bar with RainbowKit ConnectButton
│   ├── Footer.tsx              # Sponsor attribution footer
│   ├── ENSProfile.tsx          # Displays avatar, name, address, token/chain badges
│   ├── PaymentForm.tsx         # Main payment UI: amount, token selector, route, pay
│   ├── RoutePreview.tsx        # LI.FI quote breakdown (fees, duration, amounts)
│   ├── SetupForm.tsx           # ENS text record writer with multicall
│   └── TransactionStatus.tsx   # Tx lifecycle: wallet confirm → pending → success/error
│
├── hooks/
│   ├── usePaymentConfig.ts     # Calls resolvePaymentConfig(), manages loading/error state
│   ├── useLiFiQuote.ts         # Debounced (600ms) LI.FI quote fetcher
│   └── usePayment.ts           # Transaction execution: executeLiFi() or executeDirect()
│
├── lib/
│   ├── constants.ts            # All config: USDC addresses, ENS keys, chain metadata, etc.
│   ├── chains.ts               # Re-exports wagmi chain objects, helper functions
│   ├── ens.ts                  # resolvePaymentConfig() and resolveENSName() using viem
│   └── lifi.ts                 # getQuote(), getTokens(), formatters — wraps LI.FI REST API
│
└── providers/
    └── Web3Provider.tsx        # wagmi + RainbowKit + React Query provider (client-only)
```

---

## Key Files in Detail

### `src/lib/constants.ts`
Central config file. All magic values live here.

- `USDC_ADDRESSES` — mapping of chainId → USDC contract address (6 chains)
- `ENS_KEYS` — the text record keys we read/write: `com.enspaylinks.token`, `.chainId`, `.description`, `.amount`
- `CHAIN_META` — display name, logo emoji, color, explorer URL per chain
- `LIFI_API` — base URL `https://li.quest/v1`
- `NATIVE_TOKEN` — `0x000...000` (LI.FI's convention for native ETH)
- `CHAIN_OPTIONS` — ordered list for the setup form dropdown
- `PAY_TOKENS` — tokens the payer can select (ETH, USDC)
- `ENS_RESOLVER` — known PublicResolver addresses for mainnet + Sepolia

### `src/lib/ens.ts`
Creates two viem `PublicClient` instances (mainnet + Sepolia). The `NEXT_PUBLIC_TESTNET` env var controls which one is used. Exports:

- `resolvePaymentConfig(name)` — resolves address + 4 text records + avatar in parallel via `Promise.all`. Returns a `PaymentConfig` object.
- `resolveENSName(address)` — reverse resolution (address → name)

### `src/lib/lifi.ts`
Thin wrapper around `https://li.quest/v1`. Exports:

- `getQuote(params)` — calls `/quote` with from/to chain+token+amount+addresses. Returns a `LiFiQuote` with `transactionRequest` that can be sent directly via wagmi.
- `getTokens(chainId)` — calls `/tokens` (not used in UI yet, available for extensions).
- `fmtDuration()`, `fmtUSD()` — display formatters.

### `src/hooks/usePaymentConfig.ts`
React hook that wraps `resolvePaymentConfig()`. Takes an ENS name string, returns `{ config, loading, error }`. Handles cleanup on unmount to avoid stale state.

### `src/hooks/useLiFiQuote.ts`
Takes a `QuoteRequest | null`. Debounces by 600ms (avoids hammering LI.FI on every keystroke). Returns `{ quote, loading, error, refetch }`. Uses JSON.stringify for stable dependency comparison in useCallback.

### `src/hooks/usePayment.ts`
Manages transaction lifecycle state. Two execution methods:
- `executeLiFi(quote)` — sends the `transactionRequest` from a LI.FI quote
- `executeDirect(to, amount, chainId)` — simple native ETH transfer

Returns `{ status, txHash, error, executeLiFi, executeDirect, reset }`.

### `src/components/PaymentForm.tsx`
The core UI component. Logic flow:

1. Reads `config.token` and `config.chainId` to determine merchant's desired receive token/chain
2. Compares payer's current chain to merchant's chain → sets `isCrossChain` flag
3. Resolves source token address (payer's selected token on payer's chain)
4. Resolves destination token address (merchant's preferred token on merchant's chain)
5. Determines if LI.FI routing is needed (cross-chain OR cross-token)
6. If routing needed: fetches LI.FI quote, shows RoutePreview
7. On pay: either `executeLiFi(quote)` or `executeDirect()` for same-chain same-token ETH
8. Shows TransactionStatus during/after tx

### `src/components/SetupForm.tsx`
Writes ENS text records. Logic:

1. User enters ENS name — `usePaymentConfig` verifies it resolves
2. User fills in token, chain, description, suggested amount
3. On save: resolves the ENS PublicResolver address (tries dynamic lookup first, falls back to known addresses)
4. Builds `encodeFunctionData` calls for each `setText(node, key, value)`
5. Batches all calls into a single `multicall` transaction
6. On success: shows shareable payment link

---

## Data Flow

```
User types ENS name → usePaymentConfig hook
  → lib/ens.ts resolvePaymentConfig()
    → viem getEnsAddress() + getEnsText() × 4 + getEnsAvatar()
    → returns PaymentConfig { address, token, chainId, description, avatar, name }

User enters amount → PaymentForm
  → determines fromToken (payer's selection) and toToken (merchant's config)
  → if cross-chain or cross-token: useLiFiQuote hook
    → lib/lifi.ts getQuote()
    → LI.FI returns quote with transactionRequest
  → if LI.FI unavailable (e.g. testnet): falls back to direct ETH transfer

User clicks Pay → usePayment hook
  → if ERC-20 token and quote.estimate.approvalAddress:
    → check allowance via useReadContract (erc20Abi.allowance)
    → if insufficient: show "Approve" button → writeContract(approve)
    → after approval: show "Pay" button
  → if routed: sendTransaction(quote.transactionRequest)
  → if direct/fallback: sendTransaction({ to, value })
  → TransactionStatus tracks: sending → confirming → success/error
```

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | `MISSING_PROJECT_ID` | WalletConnect v2 project ID |
| `NEXT_PUBLIC_TESTNET` | No | `undefined` | Set to `"true"` to resolve ENS on Sepolia |
| `NEXT_PUBLIC_MAINNET_RPC` | No | Public default | Custom Ethereum mainnet RPC URL |
| `NEXT_PUBLIC_SEPOLIA_RPC` | No | Public default | Custom Sepolia RPC URL |
| `CIRCLE_API_KEY` | No | — | Placeholder for Circle API integration |

---

## Supported Chains

| Chain | ID | USDC Address | Testnet |
|-------|----|-------------|---------|
| Ethereum | 1 | `0xA0b8...eB48` | No |
| Base | 8453 | `0x8335...2913` | No |
| Arbitrum | 42161 | `0xaf88...5831` | No |
| Optimism | 10 | `0x0b2C...Ff85` | No |
| Sepolia | 11155111 | `0x1c7D...7238` | Yes |
| Base Sepolia | 84532 | `0x036C...F7e` | Yes |

---

## ENS Text Record Schema

All keys are namespaced under `com.enspaylinks.`:

| Key | Example Value | Purpose |
|-----|---------------|---------|
| `com.enspaylinks.token` | `USDC` | Preferred receive token |
| `com.enspaylinks.chainId` | `8453` | Preferred receive chain ID |
| `com.enspaylinks.description` | `Coffee shop` | Display description |
| `com.enspaylinks.amount` | `5.00` | Suggested payment amount |

---

## Known Limitations & Future Work

### Current Limitations
1. **Token balance validation**: The PaymentForm shows the payer's native balance but does not check if the payer has sufficient ERC-20 balance when paying with USDC. The button should be disabled with a "Insufficient balance" message.

2. **ENS name validation**: No client-side validation that the input is a valid ENS name format before attempting resolution.

3. **LI.FI testnet support**: LI.FI may not return routes for all testnet pairs. On testnets, the app falls back to direct ETH transfers for same-chain payments. Cross-chain testnet payments require LI.FI support for the chain pair.

4. **Circle integration depth**: Currently Circle/USDC is the settlement token, but deeper Circle integration (Programmable Wallets, Gateway, Bridge Kit) is stubbed but not implemented. The `CIRCLE_API_KEY` env var exists but no API routes use it yet.

5. **No payment receipts or history**: Transactions complete and show a success screen with an explorer link, but there's no persistent receipt storage or payment history view.

### Implemented
- **ERC-20 approval flow**: PaymentForm detects when LI.FI's `approvalAddress` needs an allowance, checks current allowance via `erc20Abi.allowance`, and shows a two-step "Approve → Pay" UI.
- **LI.FI fallback**: When LI.FI returns no route (common on testnets), same-chain payments fall back to direct ETH transfer with a yellow banner explaining the fallback. Cross-chain shows a red error suggesting the user switch chains.

### Planned Improvements
- **Circle Programmable Wallets**: Let merchants create a Circle-hosted wallet during setup for those who don't have their own
- **Circle Gateway integration**: Server-side API route to verify USDC settlement and provide fiat off-ramp
- **Payment history**: Store payment metadata (payer, amount, token, chain, tx hash, timestamp) via ENS text records or an offchain index
- **Multi-token support**: Add DAI, WETH, WBTC as receive options with address mappings
- **ENS subname issuance**: Let merchants create payment-specific subnames (`invoice42.merchant.eth`)
- **Mobile optimization**: While responsive, the wallet connection and transaction signing UX could be improved for mobile browsers
- **OG/social meta tags**: Dynamic OG images for `/pay/[name]` pages showing the merchant's avatar and name

---

## Commands

```bash
npm run dev      # Start dev server on :3000
npm run build    # Production build (verifies types + generates static pages)
npm run start    # Serve production build
npm run lint     # Run ESLint
```

---

## Common Development Tasks

### Adding a new supported chain
1. Add the chain to `wagmi/chains` import in `src/providers/Web3Provider.tsx`
2. Add USDC address to `USDC_ADDRESSES` in `src/lib/constants.ts`
3. Add display metadata to `CHAIN_META` in `src/lib/constants.ts`
4. Add it to `CHAIN_OPTIONS` in `src/lib/constants.ts`
5. Add the chain to `supportedChains` in `src/lib/chains.ts`

### Adding a new receive token option
1. Add token contract addresses per chain (like `USDC_ADDRESSES`) in `src/lib/constants.ts`
2. Add it to the token selection array in `src/components/SetupForm.tsx`
3. Update `toTokenAddr` resolution logic in `src/components/PaymentForm.tsx` to handle the new token
4. Add it to `PAY_TOKENS` in `src/lib/constants.ts` if it should be a payer option too

### Adding a new ENS text record
1. Add the key to `ENS_KEYS` in `src/lib/constants.ts`
2. Add the field to `PaymentConfig` interface in `src/lib/ens.ts`
3. Read it in `resolvePaymentConfig()` in `src/lib/ens.ts`
4. Write it in `handleSave()` in `src/components/SetupForm.tsx`
5. Display it in `src/components/ENSProfile.tsx` or `PaymentForm.tsx`

### Adding Circle API integration
1. Create `src/app/api/circle/` directory with route handlers
2. Use the `CIRCLE_API_KEY` env var for authentication
3. Circle Wallets API: `POST /api/circle/wallets` to create merchant wallets
4. Circle Gateway: verify USDC settlement on destination chain
5. Wire up to SetupForm (wallet creation) and TransactionStatus (settlement verification)
