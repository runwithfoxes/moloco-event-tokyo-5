"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { eventConfig } from "@/lib/event-config";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/venue/olive-tree.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040078]/80 via-[#040078]/70 to-black/80" />
      </div>

      <div className="relative w-full max-w-sm text-center py-16">
        {/* Moloco logo */}
        <Image
          src="/venue/moloco-white.png"
          alt="Moloco"
          width={100}
          height={28}
          className="mx-auto opacity-50 mb-14"
        />

        {/* Tick */}
        <div className="w-20 h-20 rounded-full border-2 border-[#60E2B7]/40 flex items-center justify-center mx-auto mb-8">
          <svg className="w-9 h-9 text-[#60E2B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {name ? (
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-3">
            Welcome, {name}
          </h1>
        ) : (
          <h1 className="font-serif text-4xl md:text-5xl text-white font-medium leading-tight mb-3">
            Welcome
          </h1>
        )}

        <p className="text-white/50 text-sm mb-12">
          Show this screen to the host at the door.
        </p>

        {/* Event details */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Event</span>
            <span className="text-sm text-white font-medium">{eventConfig.heroHeadline}</span>
          </div>
          <div className="border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Venue</span>
            <span className="text-sm text-white/80">{eventConfig.venue}, {eventConfig.city}</span>
          </div>
          <div className="border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Date</span>
            <span className="text-sm text-white/80">{eventConfig.date}</span>
          </div>
          <div className="border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Cocktails</span>
            <span className="text-sm text-white/80">From {eventConfig.time}</span>
          </div>
        </div>

        {email && (
          <p className="text-white/20 text-[11px] mt-8">{email}</p>
        )}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#040078]" />}>
      <WelcomeContent />
    </Suspense>
  );
}
