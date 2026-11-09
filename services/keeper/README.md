# Polaris Guardian Keeper Service

A lightweight, automated keeper daemon built with `@stellar/stellar-sdk` and Soroban RPC. It continuously indexes active escrow contracts and automatically triggers self-healing timeout actions on-chain when contractual breaches occur:
1. **Missed Delivery Deadlines**: Automatically issues refunds back to the client and claims keeper gas rewards.
2. **Expired Review Windows**: Automatically approves payouts to the freelancer and dynamic split recipients, claiming a 1–2% keeper micro-bounty.
3. **Off-Chain Notifications**: Dispatches automated Webhook events and Resend emails to contractual parties.

---

## 🛠️ Configuration (.env)

```env
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
POLARIS_ESCROW_CONTRACT_ID=CCXP7XZN4VGLPYGAK32A32WGL34B4O7M7I4Z2KOD7P6M3WGLUHQPOLAR
POLARIS_GUARDIAN_CONTRACT_ID=CA7GUARDIANCONTRACTIDPOLARISESGROWBREACHREGISTRYTESTNET
KEEPER_SECRET_KEY=S...
POLL_INTERVAL_MS=15000
BREACH_WEBHOOK_URL=https://webhook.site/your-endpoint
RESEND_API_KEY=re_...
ALERT_EMAIL=alerts@polaris-escrow.org
```

---

## 🚀 Running the Keeper

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build and run production
npm run build
npm start
```

---

## 🐳 Docker Deployment

```bash
docker build -t polaris-guardian-keeper .
docker run -d --name keeper --env-file .env polaris-guardian-keeper
```

