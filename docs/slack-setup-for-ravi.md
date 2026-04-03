# VIP Connect Bot — Slack App Setup

## What it does

Posts notifications to **#vip-connect-events** when:
- A guest registers for a VIP Connect event (name, company, title)
- A guest checks in at the venue (name, company, time)
- Daily summary of registration stats (optional, manual trigger)

No commands, no interactive features — it only posts messages.

## What we need from IT

### Option A: Incoming Webhook (simplest)

1. Go to https://api.slack.com/apps → **Create New App** → **From manifest**
2. Paste the contents of `slack-app-manifest.yaml` from this repo
3. Install to workspace
4. Go to **Incoming Webhooks** → activate → **Add New Webhook to Workspace**
5. Select **#vip-connect-events** as the channel
6. Copy the webhook URL — send it to Paul

We need **one env var** on Vercel:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../xxx
```

### Option B: Bot Token (more control, same result)

1. Same app creation steps as above
2. After installing, go to **OAuth & Permissions**
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
4. Get the channel ID for #vip-connect-events (right-click channel → View channel details → copy ID at bottom)

We need **two env vars** on Vercel:
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...
```

### Recommendation

**Option A** is all we need. The bot only posts messages — no slash commands, no interactivity, no reading messages. A webhook is the right tool.

## Scopes requested

| Scope | Why |
|-------|-----|
| `chat:write` | Post messages to the channel the bot is added to |
| `chat:write.public` | Post to public channels without being invited first |
| `incoming-webhook` | Send messages via webhook URL |

No user scopes. No message reading. No file access. No admin permissions.

## What the messages look like

**Registration:**
> **New Registration**
> Name: Sarah Chen | Company: Walmart
> Title: VP Digital Commerce | Email: sarah@walmart.com
> _Registered at Mar 23, 4:30 PM_

**Check-in:**
> **Guest Checked In**
> Name: Sarah Chen | Company: Walmart
> _Checked in at 7:15 PM_

## Questions for Ravi

1. Can you create the app using the manifest, or would you prefer we submit it through a different process?
2. Any naming conventions for Slack apps in the Moloco workspace?
3. Does #vip-connect-events already exist, or should we create it?
