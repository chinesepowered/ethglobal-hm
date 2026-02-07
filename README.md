# ENS PayLinks

**Cross-chain checkout to `name.eth`**

Pay anyone using their ENS name. Send from any token on any chain -- they receive USDC (or their preferred token) on their preferred chain. No sign-ups, no databases, no intermediaries.

[Slide Deck](https://github.com/chinesepowered/ethglobal-hm/blob/main/public/ENS-PayLinks.pdf)

---

## The Problem

Crypto payments are broken. Sending money to someone means asking for their hex address, confirming you're on the right chain, hoping you picked the right token, and praying the recipient actually wanted to receive on that network. One wrong move and funds are stuck or lost.

## The Solution

ENS PayLinks replaces all of that with a single input: **a name**.

A merchant configures their ENS name once -- preferred token, preferred chain, description -- stored entirely on-chain as ENS text records. Anyone can then pay them by visiting `/pay/merchant.eth`. The app resolves the name, finds the payment config, and routes the transaction cross-chain via LI.FI. The merchant receives USDC on their chain of choice. Done.

## How It Works

```
1. Merchant sets up: writes payment preferences to ENS text records
2. Shares their link: paylinks.app/pay/merchant.eth
3. Payer visits link: sees merchant profile, enters amount, picks any token
4. Cross-chain route: LI.FI finds the best path across chains
5. Settlement: merchant receives USDC on their preferred chain
```

### For Merchants (Setup)

Connect your wallet, enter your ENS name, choose your settlement token and chain. One transaction writes all preferences to ENS via a `multicall` on the PublicResolver. You get a shareable payment link immediately.

### For Payers (Checkout)

Visit `/pay/name.eth`. The app resolves the ENS name to an address and reads the payment configuration from text records. Enter an amount, pick what you want to pay with (ETH, USDC, etc.), and the app handles the rest -- swap, bridge, and deliver in a single flow.

## Architecture

```
                          ENS Text Records
                         ┌─────────────────┐
                         │ pay.token: USDC  │
                         │ pay.chain: 8453  │
                         │ pay.desc: "..."  │
                         └────────┬────────┘
                                  │ resolve
┌─────────┐    ┌──────────┐    ┌──┴───────────┐    ┌──────────────┐
│  Payer   │───▶│ PayLinks │───▶│ LI.FI Router │───▶│  Merchant    │
│ (any     │    │ Frontend │    │ (swap+bridge)│    │ (receives    │
│  chain)  │    └──────────┘    └──────────────┘    │  USDC on     │
└─────────┘                                         │  pref chain) │
                                                    └──────────────┘
```

## Key Integrations

### ENS -- Identity & Configuration Layer
- **Name resolution**: `viem` public client resolves `name.eth` → address, avatar
- **Text records**: Custom keys (`com.enspaylinks.token`, `.chainId`, `.description`, `.amount`) store the full payment config on-chain
- **Record writing**: `multicall` on the ENS PublicResolver batches all `setText` calls into one transaction
- **No hardcoded values**: Everything is resolved live from ENS at page load

### LI.FI -- Cross-Chain Routing
- **Quote API**: Fetches optimal routes across DEXs and bridges
- **Multi-chain**: Supports swaps across Ethereum, Base, Arbitrum, Optimism + testnets
- **Single-tx execution**: Payer signs once; LI.FI handles swap + bridge + delivery
- **Route preview**: Shows fees, estimated time, and path breakdown before signing

## Tech Stack

- **Next.js 14** (App Router, server components + client islands)
- **TypeScript** (strict mode)
- **wagmi v2 + viem v2** (Ethereum interactions, ENS resolution)
- **MetaMask / injected wallet** (wallet connection via wagmi)
- **Tailwind CSS** (dark-mode UI)
- **LI.FI REST API** (cross-chain quotes + execution)

## Running Locally

```bash
git clone https://github.com/chinesepowered/ethglobal-hm
cd ethglobal-hm
npm install
cp .env.example .env
```

Edit `.env`:
```
NEXT_PUBLIC_TESTNET=true   # use Sepolia ENS for testing
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Testing on Sepolia

1. Register an ENS name on Sepolia via [app.ens.domains](https://app.ens.domains) (switch to Sepolia network)
2. Go to `/setup`, connect your wallet on Sepolia, enter your ENS name
3. Set preferred token (USDC) and chain (Sepolia), save -- this writes ENS text records
4. Share `/pay/yourname.eth` -- anyone can now pay you
5. Payer connects on Sepolia, enters amount, executes payment

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing -- ENS name search + feature cards
│   ├── pay/[name]/page.tsx # Payment page -- resolve ENS, show form
│   └── setup/page.tsx      # Merchant setup -- write ENS text records
├── components/             # React components
│   ├── PaymentForm.tsx     # Amount input, token selector, LI.FI quote, pay button
│   ├── SetupForm.tsx       # ENS record writer with multicall + live preview
│   ├── ENSProfile.tsx      # Avatar + name + address + settlement badges
│   ├── RoutePreview.tsx    # LI.FI route breakdown (fees, time, path)
│   └── TransactionStatus.tsx # Progress spinner → success/error + explorer link
├── hooks/                  # React hooks
│   ├── usePaymentConfig.ts # ENS name → PaymentConfig
│   ├── useLiFiQuote.ts     # Debounced LI.FI quote fetcher
│   └── usePayment.ts       # Transaction execution (LI.FI or direct)
├── lib/                    # Pure utilities
│   ├── ens.ts              # viem ENS resolution (address, text records, avatar)
│   ├── lifi.ts             # LI.FI REST API wrapper
│   ├── constants.ts        # USDC addresses, ENS keys, chain metadata
│   └── chains.ts           # Supported chain definitions
└── providers/
    └── Web3Provider.tsx     # wagmi + React Query provider setup
```
