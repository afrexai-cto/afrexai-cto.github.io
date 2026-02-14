# AfrexAI Vault Guide — 1Password CLI

## Overview

All secrets are stored in 1Password under the **AfrexAI** vault.
Kael (the agent) uses `op read` to inject secrets into commands at runtime.
Secrets are **never** echoed, logged, printed, or stored in files.

## Setup (One-Time)

```bash
# 1. Install 1Password CLI
brew install --cask 1password-cli

# 2. Sign in (creates a session)
op signin

# 3. Create the AfrexAI vault
op vault create "AfrexAI"

# 4. Import existing Stripe keys
op item create --vault AfrexAI \
  --category "API Credential" \
  --title "Stripe" \
  --field "publishable_key=pk_live_XXXXX" \
  --field "secret_key[password]=sk_live_XXXXX"

# 5. Delete the old env file
rm /Users/openclaw/.openclaw/vault/stripe-afrexai.env
```

## Adding New Credentials

```bash
# Generic pattern
op item create --vault AfrexAI \
  --category "API Credential" \
  --title "<Service Name>" \
  --field "key_name[password]=<secret_value>"

# Examples:
# QuickBooks OAuth
op item create --vault AfrexAI \
  --category "API Credential" \
  --title "QuickBooks" \
  --field "client_id=XXXXX" \
  --field "client_secret[password]=XXXXX" \
  --field "refresh_token[password]=XXXXX" \
  --field "realm_id=9341456225186016"

# Google Workspace
op item create --vault AfrexAI \
  --category "API Credential" \
  --title "Google Workspace" \
  --field "service_account[password]=<json_key>"
```

## How Kael Uses Secrets

```bash
# Read a single value (piped directly into a command, never displayed)
op read "op://AfrexAI/Stripe/secret_key" | xargs -I{} curl -u {}:  https://api.stripe.com/v1/charges

# Inject as env vars for a command
op run --env-file=op.env -- node script.js

# op.env format (references, not values):
# STRIPE_SK=op://AfrexAI/Stripe/secret_key
# STRIPE_PK=op://AfrexAI/Stripe/publishable_key
```

## Rules for Kael

1. **NEVER** `echo`, `cat`, `print`, or log a secret value
2. **NEVER** store secrets in files (no .env files, no config files)
3. **ALWAYS** use `op read` or `op run` to inject at runtime
4. **NEVER** include secret values in chat messages
5. If a secret appears in output accidentally, flag it immediately
6. Old vault files (`/Users/openclaw/.openclaw/vault/`) should be migrated and deleted

## Reference Paths

| Service | 1Password Path | Fields |
|---------|---------------|--------|
| Stripe | `op://AfrexAI/Stripe` | `publishable_key`, `secret_key` |
| GitHub | `op://AfrexAI/GitHub` | `token` |
| QuickBooks | `op://AfrexAI/QuickBooks` | `client_id`, `client_secret`, `refresh_token`, `realm_id` |
| Google Workspace | `op://AfrexAI/Google Workspace` | `service_account` |
| Gmail IMAP | `op://AfrexAI/Gmail IMAP` | `email`, `app_password` |

## Biometric Unlock (Recommended)

```bash
# Enable Touch ID for op CLI
op signin --account my.1password.com
# Then in 1Password app: Settings → Developer → Enable CLI integration
```

This lets `op read` calls authenticate via Touch ID instead of master password.
