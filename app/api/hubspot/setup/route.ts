import { NextRequest, NextResponse } from "next/server";

// One-time setup endpoint to create the marketing event in HubSpot
// and ensure custom properties exist.
// Call this once: POST /api/hubspot/setup with the event details.

const HUBSPOT_BASE = "https://api.hubapi.com";

async function hubspotFetch(path: string, options: { method?: string; body?: unknown } = {}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN!;
  const url = `${HUBSPOT_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: { raw: text } };
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "HUBSPOT_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const data = await request.json();
  const results: string[] = [];

  // Step 1: Create custom contact properties if they don't exist
  const customProperties = [
    { name: "dietary_restrictions", label: "Dietary Restrictions", type: "string", fieldType: "text", groupName: "contactinformation" },
    { name: "additional_needs", label: "Additional Needs", type: "string", fieldType: "text", groupName: "contactinformation" },
    { name: "place_card_company", label: "Place Card Company", type: "string", fieldType: "text", groupName: "contactinformation" },
    { name: "place_card_title", label: "Place Card Title", type: "string", fieldType: "text", groupName: "contactinformation" },
  ];

  for (const prop of customProperties) {
    const res = await hubspotFetch("/crm/v3/properties/contacts", { method: "POST", body: prop });
    if (res.ok) {
      results.push(`Created property: ${prop.name}`);
    } else if (res.status === 409 || res.data?.category === "CONFLICT") {
      results.push(`Property already exists: ${prop.name}`);
    } else {
      results.push(`Failed to create property ${prop.name}: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }

  // Step 2: Create the marketing event
  const eventName = data.eventName || "VIP Connect Dinner";
  const eventDate = data.eventDate || "2026-06-15T19:00:00Z";
  const externalEventId = data.externalEventId || `moloco-vip-connect-${Date.now()}`;

  const eventRes = await hubspotFetch("/marketing/v3/marketing-events/events", {
    method: "POST",
    body: {
      eventName,
      eventType: "VIP Dinner",
      startDateTime: eventDate,
      eventOrganizer: "Moloco",
      eventDescription: "Moloco VIP Connect — an intimate dinner for senior marketing leaders",
      externalEventId,
      externalAccountId: "moloco",
    },
  });

  if (eventRes.ok) {
    results.push(`Created marketing event: ${eventName} (ID: ${externalEventId})`);
    results.push(`Set HUBSPOT_EVENT_ID=${externalEventId} in your .env.local and on Vercel`);
    return NextResponse.json({ success: true, event: eventRes.data, externalEventId, results });
  } else {
    results.push(`Failed to create event: ${eventRes.status} ${JSON.stringify(eventRes.data)}`);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/hubspot/setup",
    body: {
      eventName: "VIP Connect Dinner (optional, defaults to this)",
      eventDate: "2026-06-15T19:00:00Z (optional)",
      externalEventId: "moloco-vip-connect-xxx (optional, auto-generated)",
    },
    description: "Creates custom contact properties and a marketing event in HubSpot. Run once.",
  });
}
