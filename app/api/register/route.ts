import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { hubspotEnabled, createOrUpdateContact, getEventRegistrants } from "@/lib/hubspot";
import { emailEnabled, sendConfirmationEmail } from "@/lib/email";
import { slackEnabled, notifyRegistration } from "@/lib/slack";

interface Registrant {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  dietary: string;
  additionalNeeds: string;
  consent: boolean;
  registeredAt: string;
  status: "registered" | "checked-in";
  checkedInAt: string | null;
}

// -- Blob storage (fallback when HubSpot not configured) --

async function getRegistrationsFromBlob(): Promise<Registrant[]> {
  try {
    const { blobs } = await list({ prefix: "registrations/" });
    if (blobs.length === 0) return [];
    const latest = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
    const response = await fetch(latest.url);
    return await response.json();
  } catch {
    return [];
  }
}

async function saveRegistrationsToBlob(registrations: Registrant[]) {
  await put("registrations/data.json", JSON.stringify(registrations), {
    access: "public",
    addRandomSuffix: false,
  });
}

// -- POST: Register a new guest --

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { firstName, lastName, email, company, title, dietary, additionalNeeds, consent } = data;

    if (!firstName || !lastName || !email || !company || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Always save to Blob (keeps demo working and serves as backup)
    const registrations = await getRegistrationsFromBlob();
    if (!registrations.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
      const newRegistrant: Registrant = {
        firstName,
        lastName,
        email,
        company,
        title,
        dietary: dietary || "None",
        additionalNeeds: additionalNeeds || "",
        consent: Boolean(consent),
        registeredAt: new Date().toISOString(),
        status: "registered",
        checkedInAt: null,
      };
      registrations.push(newRegistrant);
      await saveRegistrationsToBlob(registrations);
    }

    // If HubSpot is configured, create/update the contact there too
    if (hubspotEnabled) {
      try {
        await createOrUpdateContact({ firstName, lastName, email, company, title, dietary, additionalNeeds });
        console.log(`[HubSpot] Contact created/updated: ${email}`);
      } catch (err) {
        // Log but don't fail the registration — Blob has the data
        console.error("[HubSpot] Contact creation failed, data saved to Blob:", err);
      }
    }

    // Send confirmation email
    if (emailEnabled) {
      try {
        await sendConfirmationEmail({ email, firstName, company });
        console.log(`[Email] Confirmation sent to ${email}`);
      } catch (err) {
        console.error("[Email] Confirmation failed, registration still saved:", err);
      }
    }

    // Post to Slack
    if (slackEnabled) {
      try {
        await notifyRegistration({ firstName, lastName, email, company, title, dietary });
        console.log(`[Slack] Registration notification sent for ${email}`);
      } catch (err) {
        console.error("[Slack] Notification failed, registration still saved:", err);
      }
    }

    return NextResponse.json({ success: true, registrant: { firstName, lastName, email, company } });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

// -- GET: List all registrations --

export async function GET() {
  try {
    // If HubSpot is configured and has an event, try to read from there
    if (hubspotEnabled) {
      try {
        const hsRegistrants = await getEventRegistrants();
        if (hsRegistrants.length > 0) {
          return NextResponse.json({ registrations: hsRegistrants, source: "hubspot" });
        }
      } catch (err) {
        console.error("[HubSpot] Failed to fetch registrants, falling back to Blob:", err);
      }
    }

    // Fallback to Blob
    const registrations = await getRegistrationsFromBlob();
    return NextResponse.json({ registrations, source: "blob" });
  } catch {
    return NextResponse.json({ registrations: [], source: "blob" });
  }
}
