import { NextRequest, NextResponse } from "next/server";
import { eventConfig } from "@/lib/event-config";

// Generates an .ics calendar file for the VIP Connect dinner
// Usage: GET /api/calendar?name=Paul&email=paul@example.com

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Guest";
  const email = searchParams.get("email") || "";

  const agendaLines = eventConfig.agendaShort
    .map((item) => `${item.time} — ${item.label}`)
    .join("\\n");

  const event = {
    title: eventConfig.calendarTitle,
    location: `${eventConfig.venue}, ${eventConfig.venueAddressFull}`,
    description: [
      eventConfig.heroDescription,
      "",
      agendaLines,
      "",
      "Dress code: Smart casual",
      "Your QR check-in code will be in your confirmation email.",
      "",
      "Questions? Reply to your confirmation email.",
    ].join("\\n"),
    start: eventConfig.calendarDateStart,
    end: eventConfig.calendarDateEnd,
    timezone: eventConfig.timezone,
  };

  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${eventConfig.calendarUidPrefix}-${email || "guest"}@moloco.com`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moloco//VIP Connect//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${eventConfig.timezone}`,
    "BEGIN:DAYLIGHT",
    "DTSTART:20260329T020000",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    `TZNAME:${eventConfig.timezoneAbbr}`,
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${event.timezone}:${event.start}`,
    `DTEND;TZID=${event.timezone}:${event.end}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${event.description}`,
    `ORGANIZER;CN=Moloco Events:mailto:events@moloco.com`,
    email ? `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}` : "",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${eventConfig.calendarTitle} tomorrow evening at ${eventConfig.time.toLowerCase()} ${eventConfig.timezoneAbbr}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${eventConfig.calendarTitle} in 2 hours — ${eventConfig.venue}, ${eventConfig.venueAddress}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="moloco-vip-connect.ics"`,
    },
  });
}
