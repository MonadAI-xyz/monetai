# MonetAI Smart Contracts

## Overview
MonetAI is a governance token and DAO system built on Monad blockchain.

## Setup

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
forge install
```

3. Create `.env` file:
```bash
cp .env.example .env
# Add your private key to .env
```

## Testing
```bash
forge test
forge coverage
```

## Deployment

Deploy to Monad testnet:
```bash
forge script script/MonetAI.s.sol:MonetAIDeploy --rpc-url https://testnet-rpc.monad.xyz/ --broadcast -vvv
```

The deployed addresses will be logged in the console and saved to `deploy/monad_testnet_deployment.json`.

## Contract Verification

### Verify Token Contract
```bash
export TOKEN_ADDRESS=$(jq -r '.token' deploy/monad_testnet_deployment.json)
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org' \
  $TOKEN_ADDRESS \
  src/MonetAI.sol:MonetAI
```

### Verify Governor Contract
```bash
export GOVERNOR_ADDRESS=$(jq -r '.governor' deploy/monad_testnet_deployment.json)
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org' \
  $GOVERNOR_ADDRESS \
  src/MonetAIGovernor.sol:MonetAIGovernor
```

## Deployed Contracts (Monad Testnet)

Contract addresses are stored in `deploy/monad_testnet_deployment.json`. You can view them with:
```bash
jq '.' deploy/monad_testnet_deployment.json
```

## Contract Architecture

### MonetAI Token
- ERC20 token with governance capabilities
- Implements ERC20Votes for governance
- Role-based access control for minting, burning, and pausing

### MonetAIGovernor
- Governance contract for protocol decisions
- Voting delay: 1 day
- Voting period: 1 week
- Proposal threshold: 500,000 tokens
