import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { eventConfig } from "@/lib/event-config";

// GET /api/qr?email=paul@example.com
// Returns a QR code PNG encoding a check-in URL.
// When scanned by a phone camera: opens the check-in page directly.
// When scanned by our built-in scanner: parses the URL to extract the email.

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email parameter required" }, { status: 400 });
  }

  // Encode as a URL — works with any QR scanner
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : eventConfig.siteUrl;
  // Include name in the URL so the welcome page works without a database lookup
  const name = request.nextUrl.searchParams.get("name") || "";
  const payload = `${baseUrl}/welcome?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

  const qrBuffer = await QRCode.toBuffer(payload, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#040078",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache",
    },
  });
}
