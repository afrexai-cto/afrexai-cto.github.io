# 🔑 API Keys Setup Guide

Get all 26 systems fully operational. Keys are listed in **priority order** — highest-impact keys first.

---

## Priority Tiers

### 🔴 Tier 1 — Core (unlocks the most systems)

| # | 1Password Item | Field(s) | Unlocks Systems | Get It | Est. Cost/mo |
|---|---------------|----------|-----------------|--------|-------------|
| 1 | **Anthropic** | `api_key` | security-council, urgent-email-detection, platform-health, advisory-council, humanizer, prompt-engineering, meeting-actions | [console.anthropic.com](https://console.anthropic.com/) | $20–100+ (usage) |
| 2 | **Google-Workspace-OAuth** | `credentials`, `client_id`, `client_secret`, `refresh_token`, `encryption-key` | google-workspace, urgent-email-detection, daily-briefing, personal-crm | [console.cloud.google.com](https://console.cloud.google.com/) | Free (OAuth) |
| 3 | **Google-Gemini** | `api_key` | image-gen, video-analysis, knowledge-base | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier / $0–50 |
| 4 | **OpenAI** | `api_key` | personal-crm (embeddings), video-pipeline (embeddings), knowledge-base (alt) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $5–30 (usage) |
| 5 | **Telegram-Bot** | `token`, `forum_chat_id` | messaging-setup, daily-briefing, earnings-reports, health-monitoring | [t.me/BotFather](https://t.me/BotFather) | Free |

### 🟡 Tier 2 — Productivity & Tracking

| # | 1Password Item | Field(s) | Unlocks Systems | Get It | Est. Cost/mo |
|---|---------------|----------|-----------------|--------|-------------|
| 6 | **Asana** | `access-token`, `workspace-gid`, `video-pipeline-project-gid` | asana-integration, video-pipeline | [app.asana.com/0/developer-console](https://app.asana.com/0/developer-console) | Free (Basic) |
| 7 | **Slack-Bot** | `bot_token`, `signing_secret` | messaging-setup, video-pipeline | [api.slack.com/apps](https://api.slack.com/apps) | Free |
| 8 | **SlackBot** | `app-token` | video-pipeline (socket mode) | Same app as above | Free |
| 9 | **TwitterAPI** | `bearer-token`, `user_id` | social-tracker, video-pipeline | [developer.x.com](https://developer.x.com/) | $100 (Basic) / Free (read-limited) |
| 10 | **YouTube-Data-API** | `api_key`, `channel_id` | social-tracker | [console.cloud.google.com](https://console.cloud.google.com/) → YouTube Data API v3 | Free (10k units/day) |
| 11 | **Fathom** | `api_key` | meeting-actions | [fathom.video](https://fathom.video/) | $19–39 |
| 12 | **Todoist** | `api_key`, `project_id` | meeting-actions | [app.todoist.com/app/settings/integrations/developer](https://app.todoist.com/app/settings/integrations/developer) | Free |

### 🟢 Tier 3 — Social & CRM

| # | 1Password Item | Field(s) | Unlocks Systems | Get It | Est. Cost/mo |
|---|---------------|----------|-----------------|--------|-------------|
| 13 | **Instagram-Graph-API** | `access_token`, `account_id` | social-tracker | [developers.facebook.com](https://developers.facebook.com/) → Instagram Graph API | Free |
| 14 | **TikTok-API** | `access_token`, `username` | social-tracker | [developers.tiktok.com](https://developers.tiktok.com/) | Free |
| 15 | **Beehiiv** | `api_key`, `publication_id` | newsletter-crm | [app.beehiiv.com/settings/integrations](https://app.beehiiv.com/settings/integrations) | $0–99 (plan-dependent) |
| 16 | **HubSpot** | `api_key` | newsletter-crm | [developers.hubspot.com](https://developers.hubspot.com/) | Free (CRM) |

### 🔵 Tier 4 — Finance & Media

| # | 1Password Item | Field(s) | Unlocks Systems | Get It | Est. Cost/mo |
|---|---------------|----------|-----------------|--------|-------------|
| 17 | **Financial-Modeling-Prep** | `api_key` | earnings-reports | [financialmodelingprep.com/developer](https://site.financialmodelingprep.com/developer) | Free (250 req/day) / $14+ |
| 18 | **Alpha-Vantage** | `api_key` | earnings-reports | [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) | Free (25 req/day) / $50+ |
| 19 | **Google-Cloud** | `project_id`, `service_account_key` | video-gen (Veo API) | [console.cloud.google.com](https://console.cloud.google.com/) → Vertex AI | $0–100+ (usage) |
| 20 | **DB-Backups** | `encryption_password` | db-backups | Self-generated passphrase | Free |

---

## Systems → Keys Matrix

| System | Required Keys | Status Without Keys |
|--------|--------------|-------------------|
| advisory-council | Anthropic | ❌ No AI analysis |
| asana-integration | Asana | ❌ Mock data only |
| daily-briefing | Google-Workspace-OAuth, Telegram-Bot | ⚠️ Local sample data only |
| dashboard | None (reads from other systems) | ✅ Works |
| db-backups | DB-Backups | ⚠️ Unencrypted backups |
| earnings-reports | Financial-Modeling-Prep, Alpha-Vantage | ❌ No market data |
| git-auto-sync | None | ✅ Works |
| google-workspace | Google-Workspace-OAuth | ❌ No Gmail/Calendar/Drive |
| health-monitoring | None (local checks) | ✅ Works |
| health-tracker | None | ✅ Works |
| humanizer | None (rule-based) | ✅ Works |
| image-gen | Google-Gemini | ❌ No image generation |
| knowledge-base | Google-Gemini | ⚠️ No embeddings/search |
| meeting-actions | Fathom, Todoist, Google-Workspace-OAuth | ❌ No meeting ingestion |
| messaging-setup | Telegram-Bot, Slack-Bot | ❌ No messaging |
| model-cost-tracker | None (local tracking) | ✅ Works |
| newsletter-crm | Beehiiv, HubSpot | ❌ Mock data only |
| personal-crm | Google-Workspace-OAuth, OpenAI | ❌ No Gmail scan or embeddings |
| platform-health | Anthropic (optional) | ⚠️ Works without AI analysis |
| prompt-engineering | None (linter is local) | ✅ Works |
| security-council | Anthropic | ❌ No AI analysis |
| security-safety | None (local tools) | ✅ Works |
| social-tracker | YouTube-Data-API, Instagram-Graph-API, TwitterAPI, TikTok-API | ❌ Mock data only |
| urgent-email-detection | Google-Workspace-OAuth, Anthropic | ❌ No email scanning |
| video-analysis | Google-Gemini | ❌ No video analysis |
| video-gen | Google-Cloud | ❌ No video generation |
| video-pipeline | Asana, SlackBot, TwitterAPI, OpenAI | ❌ No pipeline |

---

## Step-by-Step Setup

### 1. Create 1Password Items

```bash
# Anthropic
op item create --vault AfrexAI --category "API Credential" \
  --title "Anthropic" \
  'api_key[password]=sk-ant-...'

# Google Gemini
op item create --vault AfrexAI --category "API Credential" \
  --title "Google-Gemini" \
  'api_key[password]=AI...'

# OpenAI
op item create --vault AfrexAI --category "API Credential" \
  --title "OpenAI" \
  'api_key[password]=sk-...'

# Telegram Bot
op item create --vault AfrexAI --category "API Credential" \
  --title "Telegram-Bot" \
  'token[password]=123456:ABC...' \
  'forum_chat_id[text]=-100...'

# Asana
op item create --vault AfrexAI --category "API Credential" \
  --title "Asana" \
  'access-token[password]=1/...' \
  'workspace-gid[text]=...' \
  'video-pipeline-project-gid[text]=...'

# Slack Bot
op item create --vault AfrexAI --category "API Credential" \
  --title "Slack-Bot" \
  'bot_token[password]=xoxb-...' \
  'signing_secret[password]=...'

# SlackBot (socket mode token)
op item create --vault AfrexAI --category "API Credential" \
  --title "SlackBot" \
  'bot-token[password]=xoxb-...' \
  'app-token[password]=xapp-...' \
  'signing-secret[password]=...'

# Twitter/X API
op item create --vault AfrexAI --category "API Credential" \
  --title "TwitterAPI" \
  'bearer-token[password]=AAAA...' \
  'user_id[text]=...'

# YouTube Data API
op item create --vault AfrexAI --category "API Credential" \
  --title "YouTube-Data-API" \
  'api_key[password]=AIza...' \
  'channel_id[text]=UC...'

# Instagram Graph API
op item create --vault AfrexAI --category "API Credential" \
  --title "Instagram-Graph-API" \
  'access_token[password]=IGQV...' \
  'account_id[text]=...'

# TikTok API
op item create --vault AfrexAI --category "API Credential" \
  --title "TikTok-API" \
  'access_token[password]=...' \
  'username[text]=...'

# Beehiiv
op item create --vault AfrexAI --category "API Credential" \
  --title "Beehiiv" \
  'api_key[password]=...' \
  'publication_id[text]=pub_...'

# HubSpot
op item create --vault AfrexAI --category "API Credential" \
  --title "HubSpot" \
  'api_key[password]=pat-...'

# Financial Modeling Prep
op item create --vault AfrexAI --category "API Credential" \
  --title "Financial-Modeling-Prep" \
  'api_key[password]=...'

# Alpha Vantage
op item create --vault AfrexAI --category "API Credential" \
  --title "Alpha-Vantage" \
  'api_key[password]=...'

# Google Cloud (for Veo video gen)
op item create --vault AfrexAI --category "API Credential" \
  --title "Google-Cloud" \
  'project_id[text]=...' \
  'service_account_key[password]=<base64-encoded-json>'

# Google Workspace OAuth
op item create --vault AfrexAI --category "Secure Note" \
  --title "Google-Workspace-OAuth" \
  'credentials[text]=<full-oauth-json>' \
  'client_id[text]=...' \
  'client_secret[password]=...' \
  'refresh_token[password]=...' \
  'encryption-key[password]=<generated-passphrase>'

# Fathom
op item create --vault AfrexAI --category "API Credential" \
  --title "Fathom" \
  'api_key[password]=fth_...'

# Todoist
op item create --vault AfrexAI --category "API Credential" \
  --title "Todoist" \
  'api_key[password]=...' \
  'project_id[text]=...'

# DB Backups
op item create --vault AfrexAI --category "Password" \
  --title "DB-Backups" \
  'encryption_password[password]=<strong-passphrase>'
```

### 2. Verify

```bash
node systems/setup/check-keys.js
```

### 3. Google OAuth Flow (one-time)

```bash
cd systems/google-workspace
node auth.js   # Opens browser, complete OAuth, saves refresh token
```

---

## Cost Summary

| Tier | Monthly Estimate |
|------|-----------------|
| Free APIs (Telegram, YouTube, Asana, Todoist, etc.) | $0 |
| Anthropic (usage-based) | $20–100 |
| OpenAI (embeddings) | $5–15 |
| Google Gemini | $0–50 |
| Twitter/X Basic | $0–100 |
| Fathom | $19–39 |
| Google Cloud / Vertex AI | $0–100 |
| **Total estimate** | **$50–400/mo** |
