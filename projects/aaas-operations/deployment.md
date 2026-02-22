# AaaS Deployment Runbook

**Version:** 1.0 | **Last Updated:** 2026-02-22

---

## Prerequisites

Before deploying a customer instance, ensure you have:

- [ ] Hetzner Cloud account with API token in 1Password (`op://AfrexAI/Hetzner/api_token`)
- [ ] SSH key "aaas-deploy" registered in Hetzner Cloud console
- [ ] Customer config directory prepared (see Customer Config section below)
- [ ] Anthropic API key for customer instance in 1Password
- [ ] Customer's integration credentials (Gmail OAuth, Slack bot token, etc.)

---

## Customer Config Directory Structure

Before deploying, create the customer config directory:

```
customers/<customer-slug>/
├── SOUL.md              # Agent persona customised for customer
├── AGENTS.md            # Workspace rules
├── USER.md              # Customer profile & preferences
├── TOOLS.md             # Customer-specific tool notes
├── op.env               # 1Password references (never plaintext secrets)
├── agents/              # Multi-agent configs (if full swarm tier)
│   ├── agent-1/SOUL.md
│   └── agent-2/SOUL.md
└── integrations.md      # Which integrations are active & config notes
```

---

## Manual Deployment Steps

### Step 1: Create VPS

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create new server:
   - **Name:** `aaas-<customer-slug>`
   - **Location:** Falkenstein (FSN1) — cheapest EU location
   - **Image:** Ubuntu 24.04
   - **Type:** CX31 (2 vCPU, 8GB RAM, 80GB SSD) — €8.49/mo
   - **SSH Key:** Select "aaas-deploy"
   - **Labels:** `service=aaas`, `customer=<customer-slug>`
3. Note the IP address

### Step 2: Initial Server Setup

```bash
ssh root@<SERVER_IP>

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Create openclaw user
useradd -m -s /bin/bash openclaw
mkdir -p /home/openclaw/.openclaw/workspace-main
chown -R openclaw:openclaw /home/openclaw
```

### Step 3: Install OpenClaw

```bash
# Install OpenClaw (adjust for actual distribution method)
npm install -g @anthropic/openclaw

# Or if distributed as binary:
# curl -fsSL https://install.openclaw.dev | bash
```

### Step 4: Deploy Customer Configs

```bash
# From your local machine:
scp -r customers/<customer-slug>/* root@<SERVER_IP>:/home/openclaw/.openclaw/workspace-main/
ssh root@<SERVER_IP> "chown -R openclaw:openclaw /home/openclaw/.openclaw"
```

### Step 5: Configure Systemd Service

```bash
ssh root@<SERVER_IP>

cat > /etc/systemd/system/openclaw.service <<'EOF'
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/home/openclaw/.openclaw/workspace-main
ExecStart=/usr/bin/openclaw gateway start --foreground
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw
```

### Step 6: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable
```

### Step 7: Verify Deployment

```bash
# Check service status
systemctl status openclaw

# Check logs
journalctl -u openclaw -f

# Health check
curl http://localhost:3000/health
```

### Step 8: DNS & SSL

1. Add DNS A record: `<customer-slug>.aaas.afrexai.com` → `<SERVER_IP>`
2. Install Certbot:
   ```bash
   apt-get install -y certbot
   certbot certonly --standalone -d <customer-slug>.aaas.afrexai.com
   ```
3. Configure OpenClaw to use SSL cert (or use nginx reverse proxy)

### Step 9: Setup Monitoring

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Add HTTP monitor: `http://<SERVER_IP>:3000/health`
3. Set check interval: 5 minutes
4. Alert contacts: ops@afrexai.com + customer email (optional)

### Step 10: 48-Hour Burn-In

1. Confirm all cron jobs are firing (check logs at 08:00 and 20:00 GMT)
2. Verify integration connections (email, Slack, etc.)
3. Review agent outputs for quality
4. Check resource usage: `ssh root@<IP> "htop -bn1 | head -20"`

---

## Automated Deployment

Once comfortable with manual process, use:

```bash
./deploy-customer.sh <customer-slug> ./customers/<customer-slug>/
```

See `deploy-customer.sh` for details.

---

## Rollback

If deployment fails:

1. **Delete VPS:** `hcloud server delete aaas-<customer-slug>` or via console
2. **Remove DNS:** Delete the A record
3. **Remove monitor:** Delete UptimeRobot monitor
4. **Notify customer:** If post-kickoff, send apology + reschedule

---

## Updating a Customer Instance

```bash
ssh root@<SERVER_IP>

# Update OpenClaw
npm update -g @anthropic/openclaw

# Restart service
systemctl restart openclaw

# Verify
systemctl status openclaw
curl http://localhost:3000/health
```

For config changes, scp updated files and restart:

```bash
scp -r customers/<slug>/updated-file.md root@<IP>:/home/openclaw/.openclaw/workspace-main/
ssh root@<IP> "chown openclaw:openclaw /home/openclaw/.openclaw/workspace-main/updated-file.md && systemctl restart openclaw"
```
