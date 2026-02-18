# Setup Guide — Google Workspace Admin API

Complete step-by-step instructions to configure Google Cloud for automated account creation.

---

## Prerequisites

- You are a **Super Admin** on your Google Workspace domain (afrexai.com)
- You have access to [Google Cloud Console](https://console.cloud.google.com)
- You have access to [Google Admin Console](https://admin.google.com)

---

## Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top of the page (next to "Google Cloud")
3. Click **"New Project"**
4. Name it: `AfrexAI Workspace Automation`
5. Click **Create**
6. Make sure the new project is selected in the dropdown

> 📸 *You should see "AfrexAI Workspace Automation" in the top bar*

---

## Step 2: Enable the Admin SDK API

1. In your Google Cloud project, go to **APIs & Services → Library**
   - Direct link: https://console.cloud.google.com/apis/library
2. Search for **"Admin SDK API"**
3. Click on **"Admin SDK API"** in the results
4. Click the blue **"Enable"** button
5. Wait for it to activate (takes a few seconds)

> 📸 *The page should now show "API Enabled" with a green checkmark and usage graphs*

---

## Step 3: Create a Service Account

1. Go to **APIs & Services → Credentials**
   - Direct link: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**
4. Fill in:
   - **Service account name:** `workspace-admin`
   - **Service account ID:** (auto-fills, e.g. `workspace-admin@afrexai-automation.iam.gserviceaccount.com`)
   - **Description:** `Service account for automated Workspace user management`
5. Click **"CREATE AND CONTINUE"**
6. **Skip** the "Grant access" step — click **"CONTINUE"**
7. **Skip** the "Grant users access" step — click **"DONE"**

> 📸 *You should now see "workspace-admin" listed under Service Accounts on the Credentials page*

---

## Step 4: Create and Download the Key

1. On the **Credentials** page, under "Service Accounts", click on **workspace-admin**
2. Go to the **"Keys"** tab
3. Click **"ADD KEY" → "Create new key"**
4. Select **JSON** format
5. Click **"CREATE"**
6. A `.json` file will download automatically

> ⚠️ **This file contains sensitive credentials. Do not share or commit it.**

7. **Rename** the downloaded file to `credentials.json`
8. **Move** it into the `agent-account-creator/` directory (this folder)

> 📸 *You should see a file called `credentials.json` alongside `create-agent.js` in this folder*

---

## Step 5: Enable Domain-Wide Delegation

1. Go back to the **Service Account details** page in Google Cloud Console
   - APIs & Services → Credentials → click on "workspace-admin"
2. Under **"Show domain-wide delegation"**, check/expand it
3. Check **"Enable Google Workspace Domain-wide Delegation"**
4. Click **"SAVE"**
5. Note the **Client ID** (a long number like `123456789012345678901`) — you'll need it next

> 📸 *The "Domain-wide Delegation" section should show as enabled with a Client ID displayed*

> **If you don't see the domain-wide delegation option:**
> - Go to the service account's main page
> - Look for "Advanced settings" or "Domain-wide delegation" section
> - You may need to click "SHOW DOMAIN-WIDE DELEGATION" first

---

## Step 6: Authorize in Google Admin Console

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Security → Access and data control → API controls**
   - Or: **Security → API controls**
   - Direct link: https://admin.google.com/ac/owl/domainwidedelegation
3. Scroll down to **"Domain-wide Delegation"**
4. Click **"MANAGE DOMAIN WIDE DELEGATION"**
5. Click **"Add new"**
6. Enter:
   - **Client ID:** (paste the Client ID from Step 5)
   - **OAuth Scopes:** (paste both, comma-separated):
     ```
     https://www.googleapis.com/auth/admin.directory.user,https://www.googleapis.com/auth/admin.directory.orgunit
     ```
7. Click **"AUTHORIZE"**

> 📸 *You should see a new entry in the domain-wide delegation list with your Client ID and the two scopes*

> **Important:** Copy the scopes exactly as shown above. No spaces after commas.

---

## Step 7: Update config.json

Open `config.json` and verify:

```json
{
  "domain": "afrexai.com",
  "adminEmail": "kalin@afrexai.com",
  "credentialsFile": "./credentials.json"
}
```

- **`adminEmail`** must be a Super Admin account on the domain
- **`credentialsFile`** should point to the JSON key you downloaded

---

## Step 8: Test It

```bash
# Install dependencies (if not done)
npm install

# Test authentication
node test-auth.js
```

**Expected output:**
```
🔐 Testing Google Workspace Admin API authentication...

✅ Authentication successful!

Found X users (showing up to 5):
  - kalin@afrexai.com (Kalin ...)
```

If you get an error:
- **"Not Authorized"** → Domain-wide delegation isn't set up correctly (repeat Step 5-6)
- **"File not found"** → `credentials.json` is missing or misnamed
- **"Invalid grant"** → The admin email in config.json isn't a super admin

---

## Step 9: Create the Accounts

```bash
# Preview what will be created (safe, no changes)
node create-agents.js --all --dry-run

# Create all 9 agent accounts
node create-agents.js --all
```

Passwords are auto-generated and saved to `.created-accounts.json`. **Store them securely and delete that file afterwards.**

---

## Troubleshooting

### "Not Authorized to access this resource/api"
- Ensure domain-wide delegation is enabled (Step 5)
- Ensure the Client ID and scopes are added in Admin Console (Step 6)
- Ensure `adminEmail` in config.json is a Super Admin
- Wait 5-10 minutes — delegation changes can take time to propagate

### "Quota exceeded"
- Google Workspace has rate limits on user creation
- The script creates accounts sequentially with no delay; add a delay if hitting limits

### "Entity already exists"
- The user already exists — the script will skip and continue

### "Invalid Input: orgUnitPath"
- The org unit `/Agents` doesn't exist yet
- The batch script auto-creates it; the single-account script doesn't
- Create it manually: Admin Console → Directory → Organizational units → "+"

---

## Security Checklist

- [ ] `credentials.json` is in `.gitignore` (already configured)
- [ ] `.created-accounts.json` is in `.gitignore` (already configured)
- [ ] Service account has minimal scopes (only user + orgunit management)
- [ ] Credentials file is stored securely / deleted after use
- [ ] Generated passwords are saved in a password manager, then `.created-accounts.json` is deleted
