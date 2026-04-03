const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_EVENT_ID = process.env.HUBSPOT_EVENT_ID;
const HUBSPOT_BASE = "https://api.hubapi.com";

// HubSpot is primary when configured, Blob is fallback
export const hubspotEnabled = Boolean(HUBSPOT_TOKEN);

async function hubspotFetch(path: string, options: { method?: string; body?: unknown } = {}) {
  const url = `${HUBSPOT_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot ${res.status}: ${text}`);
  }
  return res.json();
}

// -- Contacts --

interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  dietary: string;
  additionalNeeds: string;
}

export async function createOrUpdateContact(data: ContactInput): Promise<string> {
  const properties: Record<string, string> = {
    firstname: data.firstName,
    lastname: data.lastName,
    email: data.email,
    company: data.company,
    jobtitle: data.title,
    dietary_restrictions: data.dietary || "None",
    additional_needs: data.additionalNeeds || "",
  };

  try {
    const response = await hubspotFetch("/crm/v3/objects/contacts", {
      method: "POST",
      body: { properties },
    });
    const contactId = response.id;

    if (HUBSPOT_EVENT_ID) {
      await registerContactToEvent(data.email);
    }

    return contactId;
  } catch (err: unknown) {
    const message = String(err);
    // If contact already exists (409 conflict), update instead
    if (message.includes("409") || message.includes("CONFLICT")) {
      const searchRes = await hubspotFetch("/crm/v3/objects/contacts/search", {
        method: "POST",
        body: {
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: data.email }],
          }],
        },
      });
      const contactId = searchRes.results?.[0]?.id;
      if (!contactId) throw new Error("Contact conflict but not found by email");

      await hubspotFetch(`/crm/v3/objects/contacts/${contactId}`, {
        method: "PATCH",
        body: { properties },
      });

      if (HUBSPOT_EVENT_ID) {
        await registerContactToEvent(data.email);
      }

      return contactId;
    }
    throw err;
  }
}

// -- Marketing Events --

async function registerContactToEvent(email: string) {
  if (!HUBSPOT_EVENT_ID) return;

  await hubspotFetch(`/marketing/v3/marketing-events/events/${HUBSPOT_EVENT_ID}/moloco/upsert`, {
    method: "POST",
    body: {
      inputs: [{ email, interactionDateTime: new Date().toISOString() }],
    },
  });
}

export async function markAttended(email: string) {
  if (!HUBSPOT_EVENT_ID) return;

  await hubspotFetch(`/marketing/v3/marketing-events/events/${HUBSPOT_EVENT_ID}/moloco/attend`, {
    method: "POST",
    body: {
      inputs: [{ email, interactionDateTime: new Date().toISOString() }],
    },
  });
}

// -- Read registrations from HubSpot --

export interface HubSpotRegistrant {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  dietary: string;
  additionalNeeds: string;
  registeredAt: string;
  status: "registered" | "checked-in";
  checkedInAt: string | null;
}

interface HubSpotContactResult {
  id: string;
  properties: Record<string, string | null>;
}

export async function getEventRegistrants(): Promise<HubSpotRegistrant[]> {
  if (!HUBSPOT_EVENT_ID) return [];

  const eventData = await hubspotFetch(`/marketing/v3/marketing-events/events/${HUBSPOT_EVENT_ID}/moloco`);

  if (eventData.attendees) {
    return eventData.attendees.map((a: HubSpotContactResult) => ({
      firstName: a.properties.firstname || "",
      lastName: a.properties.lastname || "",
      email: a.properties.email || "",
      company: a.properties.company || "",
      title: a.properties.jobtitle || "",
      dietary: a.properties.dietary_restrictions || "None",
      additionalNeeds: a.properties.additional_needs || "",
      registeredAt: a.properties.createdate || new Date().toISOString(),
      status: a.properties.hs_marketing_event_attendance === "ATTENDED" ? "checked-in" as const : "registered" as const,
      checkedInAt: a.properties.hs_marketing_event_attendance === "ATTENDED"
        ? new Date(a.properties.hs_last_marketing_event_attendance_date || "").toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : null,
    }));
  }

  return [];
}
