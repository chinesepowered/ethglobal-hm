# Deploying ENS PayLinks

## Quick Deploy (Vercel)

The fastest path. Vercel has native Next.js support.

### 1. Prerequisites

**ENS Name on Sepolia** (required for testing the demo)
1. Go to [app.ens.domains](https://app.ens.domains)
2. Switch your wallet to Sepolia network
3. Search and register a `.eth` name (free on testnet)
4. Make sure the name resolves to your address

### 2. Deploy to Vercel

#### Option A: One-click deploy

Push this repo to GitHub, then:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Set the environment variables (see step 3 below)
4. Click Deploy

#### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Set environment variables via `vercel env add` or in the dashboard after deploy.

### 3. Environment Variables

Set these in the Vercel dashboard under **Settings > Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_TESTNET` | `true` | Yes (for Sepolia demo) |
| `NEXT_PUBLIC_MAINNET_RPC` | Your Ethereum RPC URL (e.g. Alchemy/Infura) | Recommended |
| `NEXT_PUBLIC_SEPOLIA_RPC` | Your Sepolia RPC URL | Recommended |

**Why custom RPCs?** The default public RPCs have rate limits. During a live demo, you want reliability. Get a free key from [alchemy.com](https://www.alchemy.com) or [infura.io](https://www.infura.io).

### 4. Post-Deploy Checklist

After deployment, verify each step of the demo flow:

- [ ] Landing page loads at your Vercel URL
- [ ] Wallet connects via MetaMask (or any injected wallet)
- [ ] Navigate to `/setup`, enter your Sepolia ENS name
- [ ] Set USDC + Sepolia, click Save — ENS text records write successfully
- [ ] Navigate to `/pay/yourname.eth` — ENS profile resolves (avatar, address, badges)
- [ ] Enter amount, select ETH, click Pay — transaction goes through on Sepolia
- [ ] Success screen shows with Sepolia Etherscan link
- [ ] Transaction visible on [sepolia.etherscan.io](https://sepolia.etherscan.io)

### 5. Custom Domain (optional)

In Vercel dashboard:
1. Go to **Settings > Domains**
2. Add your domain
3. Update DNS records as instructed

---

## Local Development

```bash
git clone https://github.com/chinesepowered/ethglobal-hm
cd ethglobal-hm
npm install
cp .env.example .env
```

Edit `.env`:
```
NEXT_PUBLIC_TESTNET=true
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Alternative: Deploy to Railway / Render

These platforms also support Next.js:

**Railway:**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

**Render:**
1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Start command: `npm run start`
5. Add environment variables in the dashboard

---

## Demo Day Tips

1. **Pre-fund your wallets.** Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com) or [cloud.google.com/application/web3/faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia). Fund both your merchant wallet and a separate payer wallet.

2. **Pre-register your ENS name.** Don't register during the demo — do it beforehand on [app.ens.domains](https://app.ens.domains) (Sepolia).

3. **Pre-configure text records.** Run through `/setup` once before the demo so the payment page is ready. During the demo you can show the setup flow, but have a backup name already configured.

4. **Use two browser profiles.** One for the merchant (setup), one for the payer (checkout). This makes the demo flow clearer.

5. **Custom RPC endpoints.** Public RPCs can be slow. Use Alchemy or Infura free tier to avoid failed requests during the demo.

6. **Set `NEXT_PUBLIC_TESTNET=true`.** This makes ENS resolution use Sepolia. Without it, the app resolves on Ethereum mainnet.

7. **Test the full flow once before presenting.** ENS text record writes take a block confirmation. Make sure you've done a full run-through so you know the timing.
