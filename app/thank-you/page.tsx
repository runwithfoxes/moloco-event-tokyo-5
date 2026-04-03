"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { eventConfig } from "@/lib/event-config";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("name") || "there";
  const email = searchParams.get("email") || "";
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    const timer = setTimeout(() => {
      document.querySelectorAll("[data-animate]").forEach((el) => {
        const element = el as HTMLElement;
        element.style.opacity = "0";
        element.style.transform = "translateY(24px)";
        element.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const research = [
    {
      label: "New research",
      title: "The AI Disruption Index",
      desc: "How AI is reshaping consumer discovery. Exclusive research from Moloco and BCG.",
      url: "https://www.moloco.com/reports/ai-disruption-index",
    },
    {
      label: "FinTech edition",
      title: "AI Disruption Index: FinTech",
      desc: "Where FinTechs stand in the AI revolution and how growth leaders are adapting.",
      url: "https://www.moloco.com/reports/ai-disruption-index-fintech",
    },
    {
      label: "Framework",
      title: "The Dual Frontier",
      desc: "A retailer's framework for agentic commerce.",
      url: "https://www.moloco.com/reports/dual-frontier",
    },
  ];

  const blogPosts = [
    {
      title: "Why Customer Relationships Are Your Best Defense Against AI Disruption",
      author: "Paul D'Arcy",
      url: "https://www.moloco.com/blog/best-defense-against-ai-disruption",
    },
    {
      title: "Beyond Last-Click: How We Prove Incremental ROAS in Retail Media",
      author: "Kevin Wu",
      url: "https://www.moloco.com/blog/proving-incremental-roas-retail-media-advertising",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          navScrolled
            ? "bg-[#040078]/95 backdrop-blur-xl shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/demo">
            <Image
              src="/venue/moloco-white.png"
              alt="Moloco"
              width={120}
              height={32}
              className={`transition-opacity duration-500 cursor-pointer ${navScrolled ? "opacity-100" : "opacity-80"}`}
            />
          </Link>
          <Link
            href="/demo"
            className={`text-xs transition-colors duration-300 ${
              navScrolled ? "text-white/50 hover:text-white/80" : "text-white/40 hover:text-white/70"
            }`}
          >
            Back to event
          </Link>
        </div>
      </nav>

      {/* Hero — venue photo with confirmation + QR code */}
      <section className="relative min-h-[70vh] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/venue/olive-tree.png"
            alt="Nobelhart & Schmutzig"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent" />
        </div>

        <div className={`relative w-full max-w-5xl mx-auto px-6 py-32 ${email ? "" : "text-center"}`}>
          <div className={`${email ? "grid md:grid-cols-[1fr_auto] gap-12 md:gap-16 items-center" : ""}`}>
            {/* Left: confirmation message */}
            <div className={email ? "" : "max-w-3xl mx-auto"}>
              {/* Confirmation tick */}
              <div className={`w-16 h-16 rounded-full border border-[#60E2B7]/30 flex items-center justify-center mb-8 ${email ? "" : "mx-auto"}`}>
                <svg className="w-7 h-7 text-[#60E2B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="font-serif text-5xl md:text-6xl font-medium text-white leading-tight mb-4">
                You&apos;re on the list, {firstName}
              </h1>
              <p className={`text-lg text-white/70 font-light leading-relaxed mb-3 ${email ? "max-w-lg" : "max-w-lg mx-auto"}`}>
                We&apos;ll confirm your place within 48 hours. Check your inbox for a confirmation email with your calendar invite and evening details.
              </p>
              <div className={`flex items-center gap-3 text-white/40 text-sm mt-8 ${email ? "" : "justify-center"}`}>
                <span>{eventConfig.date}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{eventConfig.time} {eventConfig.timezoneAbbr}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{eventConfig.venue}, {eventConfig.city}</span>
              </div>
              <div className={`mt-6 ${email ? "" : "flex justify-center"}`}>
                <a
                  href={`/api/calendar?name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-white/40 hover:text-white/90 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Add to calendar
                </a>
              </div>
            </div>

            {/* Right: QR code */}
            {email && (
              <div className="text-center md:text-right">
                <div className="inline-block p-5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl">
                  <div className="p-4 bg-white rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/qr?email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}&v=4`}
                      alt="Your personal QR code for check-in"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-[11px] text-white/50 mt-3">Your check-in code</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Show this at the door</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div data-animate className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900">What happens next</h2>
          </div>

          <div data-animate className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Confirmation email",
                desc: "Landing in your inbox now. It includes a calendar invite (.ics) so the evening is in your diary, and a personal QR code for check-in on the night.",
              },
              {
                step: "02",
                title: "Reminders",
                desc: "You'll hear from us one week before with the agenda, one day before with logistics, and the morning of with the address and a map link.",
              },
              {
                step: "03",
                title: "On the night",
                desc: "Show your QR code at the door, or just give your name. We'll have your dietary preferences and place card ready. Arrive from 7pm for cocktails.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group bg-white border border-neutral-200/60 p-8 rounded-lg hover:bg-neutral-50 transition-colors duration-300"
              >
                <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider">{item.step}</span>
                <h3 className="text-[15px] font-semibold text-neutral-800 mt-3 mb-2 group-hover:pl-0.5 transition-all duration-300">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research — the value-add */}
      <section className="py-24 px-6 bg-white border-y border-neutral-200/60">
        <div className="max-w-5xl mx-auto">
          <div data-animate className="mb-14">
            <p className="text-[10px] font-medium text-[#040078]/40 uppercase tracking-[0.15em] mb-3">While you wait</p>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900">
              What we&apos;re thinking about
            </h2>
            <p className="text-neutral-400 mt-3 max-w-lg">
              Some of the research shaping the conversation at VIP Connect. Worth a read before the evening.
            </p>
          </div>

          <div data-animate className="grid md:grid-cols-3 gap-6 mb-14">
            {research.map((item) => (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-[#fafaf9] border border-neutral-200/60 p-7 rounded-lg hover:bg-neutral-100/50 transition-colors duration-300"
              >
                <span className="text-[10px] font-medium text-[#040078]/30 uppercase tracking-wider">{item.label}</span>
                <h3 className="text-[15px] font-semibold text-neutral-800 mt-3 mb-2 group-hover:pl-0.5 transition-all duration-300">
                  {item.title}
                  <span className="inline-block ml-1.5 text-neutral-300 group-hover:text-[#040078]/40 group-hover:translate-x-0.5 transition-all duration-300">&rarr;</span>
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
              </a>
            ))}
          </div>

          <div data-animate>
            <p className="text-[10px] font-medium text-neutral-300 uppercase tracking-[0.15em] mb-5">From the blog</p>
            <div className="space-y-1">
              {blogPosts.map((post) => (
                <a
                  key={post.title}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between py-4 border-t border-neutral-100 hover:pl-1 transition-all duration-300"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors duration-300">{post.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{post.author}</p>
                  </div>
                  <span className="text-neutral-300 group-hover:text-[#040078]/40 group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 ml-4">&rarr;</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom — venue teaser */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/venue/evening-setting.png"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div data-animate className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-3">See you at {eventConfig.venue}</h2>
          <p className="text-white/50 text-sm mb-8">{eventConfig.venueAddressFull}. Cocktails from {eventConfig.time.toLowerCase().replace(' ', '')}.</p>
          <Link
            href="/demo"
            className="px-7 py-3 rounded-full border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-white/40 hover:text-white/90 transition-all duration-300 tracking-wide"
          >
            View the full evening
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 bg-[#020033]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/venue/moloco-white.png"
            alt="Moloco"
            width={80}
            height={22}
            className="opacity-40"
          />
          <p className="text-xs text-white/20">Machine learning for performance marketing</p>
        </div>
      </footer>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf9]" />}>
      <ThankYouContent />
    </Suspense>
  );
}
