"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import jsQR from "jsqr";
import { eventConfig } from "@/lib/event-config";

type AttendeeStatus = "registered" | "checked-in";

interface Attendee {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  status: AttendeeStatus;
  checkedInAt: string | null;
  dietary: string;
}

// No demo guests — only real registrations from the form

const journeySteps = [
  { title: "Invitation", desc: "Email with event details and a personal RSVP link" },
  { title: "Landing page", desc: "Browse the evening: agenda, venue, atmosphere" },
  { title: "Registration", desc: "One form, under a minute, straight to HubSpot" },
  { title: "Confirmation", desc: "Calendar invite and a personal QR code" },
  { title: "Reminders", desc: "One week, one day, morning-of. Automatic" },
  { title: "Arrival", desc: "QR scan at the door. Checked in", active: true },
  { title: "Follow-up", desc: "Thank you next morning. No-shows get a note" },
];

function CheckInContent() {
  const searchParams = useSearchParams();
  const scanEmail = searchParams.get("scan");
  const [guests, setGuests] = useState<Attendee[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Attendee | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanHandled, setScanHandled] = useState(false);

  // Load real registrations from API and merge with demo guests
  const loadGuests = useCallback(async () => {
    try {
      const res = await fetch("/api/register");
      const data = await res.json();
      if (data.registrations && data.registrations.length > 0) {
        const apiGuests: Attendee[] = data.registrations.map((r: { firstName: string; lastName: string; email: string; company: string; title: string; dietary: string; status: string; checkedInAt: string | null }, i: number) => ({
          id: `REG${String(i + 1).padStart(3, "0")}`,
          name: `${r.firstName} ${r.lastName}`,
          company: r.company,
          title: r.title,
          email: r.email,
          status: (r.status || "registered") as AttendeeStatus,
          checkedInAt: r.checkedInAt || null,
          dietary: r.dietary || "None",
        }));
        // Merge: real registrations first, then demo guests (excluding any email matches)
        setGuests(apiGuests);
      }
    } catch {
      // Keep demo guests on error
    }
  }, []);

  useEffect(() => {
    loadGuests();
    // Refresh every 15 seconds so check-ins from other devices appear
    const interval = setInterval(loadGuests, 15000);
    return () => clearInterval(interval);
  }, [loadGuests]);

  const checkedIn = guests.filter((g) => g.status === "checked-in").length;
  const total = guests.length;

  const filteredGuests = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.company.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase())
  );

  const checkInGuest = async (id: string) => {
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;

    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    // Update locally immediately
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: "checked-in" as AttendeeStatus, checkedInAt: now } : g))
    );
    setSelectedGuest({ ...guest, status: "checked-in", checkedInAt: now });

    // Persist to API
    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guest.email }),
      });
    } catch {
      // Local state already updated
    }
  };

  const downloadCSV = () => {
    const headers = ["Name", "Company", "Title", "Email", "Dietary", "Status", "Checked In At"];
    const rows = guests.map((g) => [
      g.name,
      g.company,
      g.title,
      g.email,
      g.dietary,
      g.status === "checked-in" ? "Checked in" : "Registered",
      g.checkedInAt || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vip-connect-guests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  }, []);

  const startScanner = async () => {
    setScanResult(null);
    setShowScanner(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Scan for QR codes every 200ms
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          let scannedEmail: string | null = null;

          // Try URL format: .../welcome?guest=email or .../check-in?scan=email
          try {
            const url = new URL(code.data);
            scannedEmail = url.searchParams.get("email") || url.searchParams.get("guest") || url.searchParams.get("scan");
          } catch {
            // Not a URL — try legacy JSON format
            try {
              const payload = JSON.parse(code.data);
              if (payload.type === "moloco-checkin" && payload.email) {
                scannedEmail = payload.email;
              }
            } catch {
              // Not our format, keep scanning
            }
          }

          if (scannedEmail) {
            const guest = guests.find(
              (g) => g.email.toLowerCase() === scannedEmail!.toLowerCase()
            );
            if (guest) {
              setScanResult(guest.id);
              setSelectedGuest(guest);
              stopScanner();
            }
          }
        }
      }, 200);
    } catch {
      // Camera denied or not available — fall back to search
      stopScanner();
      setScanResult("camera-error");
    }
  };

  // Handle ?scan= URL param (guest scanned QR with phone camera)
  useEffect(() => {
    if (scanEmail && guests.length > 0 && !scanHandled) {
      const guest = guests.find((g) => g.email.toLowerCase() === scanEmail.toLowerCase());
      if (guest) {
        setScanResult(guest.id);
        setSelectedGuest(guest);
        setScanHandled(true);
      }
    }
  }, [scanEmail, guests, scanHandled]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#040078]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Image
              src="/venue/moloco-white.png"
              alt="Moloco"
              width={100}
              height={28}
              className="opacity-80"
            />
            <div className="hidden md:flex items-center gap-1.5 text-white/30 text-xs">
              <span>/</span>
              <span className="text-white/60">Event check-in</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors duration-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
            <Link
              href="/demo"
              className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300"
            >
              View event page
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="pt-[72px]">
        {/* Event header */}
        <div className="border-b border-neutral-200/60 bg-white">
          <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 leading-tight mb-1.5">
                VIP Connect
              </h1>
              <p className="text-sm text-neutral-400">
                {eventConfig.eventTitle} · {eventConfig.venue}, {eventConfig.city} · {eventConfig.date}
              </p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8">
              {[
                { value: total, label: "Registered", color: "text-neutral-900" },
                { value: checkedIn, label: "Checked in", color: "text-[#60E2B7]" },
                { value: total - checkedIn, label: "Remaining", color: "text-neutral-900" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-2xl font-serif font-medium ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar — full width, thin */}
          <div className="max-w-7xl mx-auto px-8 pb-0">
            <div className="w-full h-[3px] bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-[#60E2B7] transition-all duration-700 ease-out"
                style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Two-column dashboard */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

            {/* Left column — guest list */}
            <div>
              {/* Search + scan row */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search guests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-neutral-200 bg-white focus:outline-none focus:border-[#040078]/30 transition-colors duration-300 text-sm rounded-lg"
                  />
                </div>
                <button
                  onClick={showScanner ? stopScanner : startScanner}
                  className="px-5 py-3 bg-[#040078] text-white text-sm font-medium flex items-center gap-2.5 hover:bg-[#030060] transition-colors duration-300 rounded-lg"
                >
                  {showScanner ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m8-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{showScanner ? "Stop" : "Scan QR"}</span>
                </button>
              </div>

              {/* Camera viewfinder */}
              {showScanner && (
                <div className="mb-5 rounded-lg overflow-hidden bg-black relative">
                  <video
                    ref={videoRef}
                    className="w-full max-h-[300px] object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scanning overlay with corner markers */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br" />
                    </div>
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/50">Point at guest&apos;s QR code</p>
                </div>
              )}

              {/* Camera error */}
              {scanResult === "camera-error" && (
                <div className="mb-5 p-4 bg-orange-50 border border-orange-200/60 text-center rounded-lg">
                  <p className="text-sm text-orange-600">Camera not available. Use search to find guests instead.</p>
                </div>
              )}

              {/* Scan result */}
              {scanResult && scanResult !== "all-checked-in" && scanResult !== "camera-error" && selectedGuest && selectedGuest.status === "registered" && (
                <div className="mb-5 p-5 bg-white border border-[#0280FB]/20 rounded-lg">
                  <p className="text-[10px] font-medium text-[#0280FB] uppercase tracking-[0.15em] mb-3">QR code scanned</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">{selectedGuest.name}</p>
                      <p className="text-sm text-neutral-400">{selectedGuest.title}, {selectedGuest.company}</p>
                      {selectedGuest.dietary !== "None" && (
                        <p className="text-xs text-orange-600 mt-1.5">Dietary: {selectedGuest.dietary}</p>
                      )}
                    </div>
                    <button
                      onClick={() => checkInGuest(selectedGuest.id)}
                      className="px-5 py-2.5 bg-[#040078] text-white text-sm font-medium hover:bg-[#030060] transition-colors duration-300 rounded-lg"
                    >
                      Check in
                    </button>
                  </div>
                </div>
              )}

              {scanResult === "all-checked-in" && (
                <div className="mb-5 p-4 bg-[#60E2B7]/5 border border-[#60E2B7]/15 text-center rounded-lg">
                  <p className="text-sm font-medium text-[#60E2B7]">All guests checked in</p>
                </div>
              )}

              {/* Guest list */}
              <div className="space-y-1">
                {filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className={`group p-4 flex items-center justify-between transition-all duration-300 rounded-lg ${
                      guest.status === "checked-in"
                        ? "bg-[#60E2B7]/[0.04]"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-4 transition-all duration-300 group-hover:pl-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300 ${
                          guest.status === "checked-in"
                            ? "bg-[#60E2B7]/10 text-[#60E2B7]"
                            : "bg-[#040078]/[0.05] text-[#040078]/60 group-hover:bg-[#040078]/[0.08]"
                        }`}
                      >
                        {guest.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{guest.name}</p>
                        <p className="text-xs text-neutral-400">{guest.title}, {guest.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {guest.dietary !== "None" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-500 font-medium uppercase tracking-wide">
                          {guest.dietary}
                        </span>
                      )}
                      {guest.status === "checked-in" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#60E2B7]" />
                          <span className="text-xs text-[#60E2B7] font-medium">{guest.checkedInAt}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => checkInGuest(guest.id)}
                          className="text-xs font-medium px-4 py-2 text-[#040078] bg-[#040078]/[0.05] hover:bg-[#040078]/[0.1] transition-colors duration-300 rounded-lg"
                        >
                          Check in
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredGuests.length === 0 && (
                <div className="text-center py-16 text-neutral-300">
                  <p className="text-sm">No guests matching &ldquo;{search}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Right column — sidebar */}
            <div className="space-y-6">
              {/* Quick stats card */}
              <div className="bg-white border border-neutral-200/60 p-6 rounded-lg">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">Attendance</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Expected</span>
                    <span className="text-sm font-medium text-neutral-800">{total} guests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Arrived</span>
                    <span className="text-sm font-medium text-[#60E2B7]">{checkedIn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Dietary notes</span>
                    <span className="text-sm font-medium text-neutral-800">{guests.filter(g => g.dietary !== "None").length}</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-neutral-400">Progress</span>
                      <span className="font-medium text-neutral-600">{total > 0 ? Math.round((checkedIn / total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#60E2B7] transition-all duration-700 ease-out"
                        style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest journey */}
              <div className="bg-white border border-neutral-200/60 p-6 rounded-lg">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-5">Guest journey</p>

                <div className="relative">
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-neutral-100" />

                  <div className="space-y-5">
                    {journeySteps.map((item, i) => (
                      <div key={i} className="group relative flex gap-4 cursor-default">
                        <div className={`relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
                          item.active
                            ? "bg-[#040078]"
                            : "bg-white border border-neutral-200 group-hover:border-[#040078]/30"
                        }`}>
                          <span className={`text-[9px] font-medium ${
                            item.active ? "text-white" : "text-neutral-400 group-hover:text-[#040078]/60"
                          } transition-colors duration-300`}>{i + 1}</span>
                        </div>
                        <div className="transition-all duration-300 group-hover:pl-0.5">
                          <p className={`text-[13px] font-medium mb-0.5 transition-colors duration-300 ${
                            item.active
                              ? "text-[#040078]"
                              : "text-neutral-600 group-hover:text-neutral-900"
                          }`}>{item.title}</p>
                          <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event details card */}
              <div className="bg-white border border-neutral-200/60 p-6 rounded-lg">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">Event details</p>
                <div className="space-y-3">
                  {[
                    { label: "Date", value: eventConfig.date },
                    { label: "Time", value: `${eventConfig.time} ${eventConfig.timezoneAbbr}` },
                    { label: "Venue", value: eventConfig.venue },
                    { label: "Location", value: eventConfig.venueAddressFull },
                    { label: "Format", value: `Seated dinner, ${eventConfig.capacity} guests` },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-neutral-400 flex-shrink-0">{detail.label}</span>
                      <span className="text-xs font-medium text-neutral-700 text-right">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200/60 mt-8">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <Image
            src="/venue/moloco-primary.png"
            alt="Moloco"
            width={72}
            height={20}
            className="opacity-20"
          />
          <p className="text-[11px] text-neutral-300">Powered by HubSpot + Claude Code</p>
        </div>
      </footer>
    </div>
  );
}

export default function CheckInApp() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf9]" />}>
      <CheckInContent />
    </Suspense>
  );
}
