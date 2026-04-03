import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { join } from "path";
import { eventConfig } from "./event-config";

const SMTP_HOST = "smtp.hubapi.com";
const SMTP_PORT = 587;
const SMTP_USER = process.env.HUBSPOT_SMTP_USER;
const SMTP_PASS = process.env.HUBSPOT_SMTP_PASS;
const FROM_NAME = "Moloco Events";
const FROM_EMAIL = "events@moloco.com";

export const emailEnabled = Boolean(SMTP_USER && SMTP_PASS);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

interface EmailRecipient {
  email: string;
  firstName: string;
  company?: string;
}

type TemplateName =
  | "01-confirmation"
  | "02-agenda-7days"
  | "03-logistics-1day"
  | "04-dayof-morning"
  | "05-post-event-attended"
  | "06-post-event-noshow";

const SUBJECTS: Record<TemplateName, string> = {
  "01-confirmation": "You're on the list — Moloco VIP Connect",
  "02-agenda-7days": "One week to go — Moloco VIP Connect",
  "03-logistics-1day": "Tomorrow night — Moloco VIP Connect",
  "04-dayof-morning": "Tonight — Moloco VIP Connect",
  "05-post-event-attended": "Great to see you — Moloco VIP Connect",
  "06-post-event-noshow": "Sorry we missed you — Moloco VIP Connect",
};

function loadTemplate(template: TemplateName, recipient: EmailRecipient): string {
  const filePath = join(process.cwd(), "emails", `${template}.html`);
  let html = readFileSync(filePath, "utf-8");

  // Replace contact tokens
  html = html.replace(/\{\{contact\.firstname\}\}/g, recipient.firstName);
  html = html.replace(/\{\{contact\.email\}\}/g, recipient.email);
  html = html.replace(/\{\{contact\.company\}\}/g, recipient.company || "");
  html = html.replace(/\{\{unsubscribe_link\}\}/g, "#");

  // Replace event-specific tokens with config values
  html = html.replace(/\{\{EVENT_CITY\}\}/g, eventConfig.city);
  html = html.replace(/\{\{EVENT_VENUE\}\}/g, eventConfig.venue);
  html = html.replace(/\{\{EVENT_ADDRESS\}\}/g, eventConfig.venueAddress);
  html = html.replace(/\{\{EVENT_ADDRESS_FULL\}\}/g, eventConfig.venueAddressFull);
  html = html.replace(/\{\{EVENT_DATE\}\}/g, eventConfig.date);
  html = html.replace(/\{\{EVENT_DATE_FULL\}\}/g, eventConfig.dateFull);
  html = html.replace(/\{\{EVENT_TIME\}\}/g, eventConfig.time);
  html = html.replace(/\{\{EVENT_TIMEZONE_ABBR\}\}/g, eventConfig.timezoneAbbr);
  html = html.replace(/\{\{EVENT_TITLE\}\}/g, eventConfig.eventTitle);
  html = html.replace(/\{\{EVENT_SUBTITLE\}\}/g, eventConfig.eventSubtitle);
  html = html.replace(/\{\{SITE_URL\}\}/g, eventConfig.siteUrl);
  html = html.replace(/\{\{MAPS_URL\}\}/g, eventConfig.mapsUrl);
  html = html.replace(/\{\{VENUE_DESCRIPTION\}\}/g, eventConfig.venueDescription);
  html = html.replace(/\{\{VENUE_DIRECTIONS\}\}/g, eventConfig.venueDirections);

  return html;
}

export async function sendEmail(
  template: TemplateName,
  recipient: EmailRecipient
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!transporter) {
    return { success: false, error: "Email not configured (missing SMTP credentials)" };
  }

  try {
    const html = loadTemplate(template, recipient);
    const subject = SUBJECTS[template];

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: recipient.email,
      subject,
      html,
    });

    console.log(`[Email] Sent "${template}" to ${recipient.email}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send "${template}" to ${recipient.email}:`, message);
    return { success: false, error: message };
  }
}

export async function sendConfirmationEmail(recipient: EmailRecipient) {
  return sendEmail("01-confirmation", recipient);
}
