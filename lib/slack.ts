// Slack integration for VIP Connect event notifications
// Posts to #vip-connect-events when guests register or check in

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

export const slackEnabled = Boolean(SLACK_WEBHOOK_URL || SLACK_BOT_TOKEN);

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: { type: string; text: string }[];
  fields?: { type: string; text: string }[];
}

async function postToSlack(blocks: SlackBlock[], text: string) {
  if (!slackEnabled) return;

  // Prefer webhook (simpler, no scopes needed for posting)
  if (SLACK_WEBHOOK_URL) {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks, text }),
    });
    if (!res.ok) {
      throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
    }
    return;
  }

  // Fallback to Bot Token + channel ID
  if (SLACK_BOT_TOKEN && SLACK_CHANNEL_ID) {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: SLACK_CHANNEL_ID, blocks, text }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack API failed: ${data.error}`);
    }
  }
}

// -- Notification: New registration --

export async function notifyRegistration(guest: {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  dietary?: string;
}) {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "New Registration", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${guest.firstName} ${guest.lastName}` },
        { type: "mrkdwn", text: `*Company:*\n${guest.company}` },
        { type: "mrkdwn", text: `*Title:*\n${guest.title}` },
        { type: "mrkdwn", text: `*Email:*\n${guest.email}` },
      ],
    },
    ...(guest.dietary && guest.dietary !== "None"
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Dietary:* ${guest.dietary}` },
          },
        ]
      : []),
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Registered at ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}`,
        },
      ],
    },
  ];

  await postToSlack(blocks, `New registration: ${guest.firstName} ${guest.lastName} (${guest.company})`);
}

// -- Notification: Guest checked in --

export async function notifyCheckIn(guest: {
  firstName: string;
  lastName: string;
  company: string;
  checkedInAt: string;
}) {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Guest Checked In", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${guest.firstName} ${guest.lastName}` },
        { type: "mrkdwn", text: `*Company:*\n${guest.company}` },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Checked in at ${guest.checkedInAt}` },
      ],
    },
  ];

  await postToSlack(blocks, `Checked in: ${guest.firstName} ${guest.lastName} (${guest.company})`);
}

// -- Notification: Daily summary (call from cron or manual) --

export async function notifyDailySummary(stats: {
  totalRegistered: number;
  totalCheckedIn: number;
  capacity: number;
  recentRegistrations: { name: string; company: string }[];
}) {
  const spotsLeft = stats.capacity - stats.totalRegistered;
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "VIP Connect — Daily Summary", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Registered:*\n${stats.totalRegistered} / ${stats.capacity}` },
        { type: "mrkdwn", text: `*Spots remaining:*\n${spotsLeft}` },
        { type: "mrkdwn", text: `*Checked in:*\n${stats.totalCheckedIn}` },
        { type: "mrkdwn", text: `*Attendance rate:*\n${stats.totalRegistered > 0 ? Math.round((stats.totalCheckedIn / stats.totalRegistered) * 100) : 0}%` },
      ],
    },
    ...(stats.recentRegistrations.length > 0
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Recent registrations:*\n${stats.recentRegistrations.map((r) => `• ${r.name} — ${r.company}`).join("\n")}`,
            },
          },
        ]
      : []),
  ];

  await postToSlack(blocks, `VIP Connect: ${stats.totalRegistered}/${stats.capacity} registered, ${spotsLeft} spots left`);
}
