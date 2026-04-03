import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { hubspotEnabled, markAttended } from "@/lib/hubspot";
import { slackEnabled, notifyCheckIn } from "@/lib/slack";

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

async function getRegistrations(): Promise<Registrant[]> {
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

async function saveRegistrations(registrations: Registrant[]) {
  await put("registrations/data.json", JSON.stringify(registrations), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Always update Blob (keeps demo working and serves as backup)
    const registrations = await getRegistrations();
    const index = registrations.findIndex((r) => r.email.toLowerCase() === email.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    registrations[index].status = "checked-in";
    registrations[index].checkedInAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    await saveRegistrations(registrations);

    // If HubSpot is configured, mark as attended there too
    if (hubspotEnabled) {
      try {
        await markAttended(email);
        console.log(`[HubSpot] Marked attended: ${email}`);
      } catch (err) {
        console.error("[HubSpot] Failed to mark attended, Blob updated:", err);
      }
    }

    // Post to Slack
    if (slackEnabled) {
      try {
        const guest = registrations[index];
        await notifyCheckIn({
          firstName: guest.firstName,
          lastName: guest.lastName,
          company: guest.company,
          checkedInAt: guest.checkedInAt || "now",
        });
        console.log(`[Slack] Check-in notification sent for ${email}`);
      } catch (err) {
        console.error("[Slack] Check-in notification failed:", err);
      }
    }

    return NextResponse.json({ success: true, guest: registrations[index] });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
