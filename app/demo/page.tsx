"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { eventConfig } from "@/lib/event-config";

export default function DemoEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    dietary: "",
    additionalNeeds: "",
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("about");
  const [navScrolled, setNavScrolled] = useState(false);

  // Track scroll for nav background and active section
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 100);

      const sections = ["about", "experience", "agenda", "venue", "register", "faqs"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for fade-in animations
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

    // Small delay to ensure DOM is ready
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

  const navLinks = [
    { id: "about", label: "About" },
    { id: "experience", label: "The Experience" },
    { id: "agenda", label: "Agenda" },
    { id: "venue", label: "Venue" },
    { id: "faqs", label: "FAQs" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Sticky nav — like current Splash page but refined */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          navScrolled
            ? "bg-[#040078]/95 backdrop-blur-xl shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#about">
            <Image
              src="/venue/moloco-white.png"
              alt="Moloco"
              width={120}
              height={32}
              className={`transition-opacity duration-500 cursor-pointer ${navScrolled ? "opacity-100" : "opacity-80"}`}
            />
          </a>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`text-xs font-medium tracking-widest uppercase transition-all duration-300 ${
                  activeSection === link.id
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
          <a
            href="#register"
            className={`text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 ${
              navScrolled
                ? "bg-white text-[#040078] hover:bg-white/90"
                : "bg-white/15 text-white border border-white/20 hover:bg-white/25"
            }`}
          >
            RSVP
          </a>
        </div>
      </nav>

      {/* Demo banner */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl text-white/70 text-xs hover:text-white transition-colors shadow-2xl"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#60E2B7] animate-pulse" />
          Demo: see how this was built
        </Link>
      </div>

      {/* Hero — Ken Burns drift on the photo */}
      <section id="about" className="relative h-screen min-h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <div className="hero-image-drift absolute inset-[-8%] w-[116%] h-[116%]">
            <Image
              src={eventConfig.heroImageUrl || "/venue/long-table.png"}
              alt={`${eventConfig.venue} — dinner setting`}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Gradient overlay — darker at top and bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
          {/* Warm candlelight glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-6xl md:text-8xl font-medium text-white leading-[1.05] mb-3 animate-fade-in-up">
            VIP Connect
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light tracking-[0.2em] uppercase mb-10 animate-fade-in-up-delay-1">
            {eventConfig.eventSubtitle}
          </p>

          <div className="flex flex-col items-center gap-6 animate-fade-in-up-delay-2">
            <p className="text-base text-white/90 max-w-md leading-relaxed">
              {eventConfig.heroDescription}
            </p>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span>{eventConfig.date}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{eventConfig.time} {eventConfig.timezoneAbbr}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{eventConfig.city}</span>
            </div>
            <a
              href="#register"
              className="mt-6 px-7 py-3 rounded-full border border-white/30 text-white/90 text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all duration-300 tracking-wide"
            >
              Request your invitation
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
              <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* The Experience — split layout like current page but elevated */}
      <section id="experience" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div data-animate>
              <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8 leading-tight">
                {eventConfig.experienceHeadline.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < eventConfig.experienceHeadline.split("\n").length - 1 && <br />}</span>
                ))}
              </h2>
              <div className="space-y-5 text-[var(--muted)] leading-relaxed">
                {eventConfig.experienceParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div data-animate className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/venue/olive-tree.png"
                  alt="Warm ambient lighting at Nobelhart & Schmutzig"
                  width={600}
                  height={700}
                  className="object-cover w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agenda — dark section like the current Splash page */}
      <section id="agenda" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020044] via-[#040078] to-[#0a0066]" />
        {/* Subtle animated gradient orbs */}
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-[#C368F9] opacity-[0.04] blur-[150px] animate-float" />
        <div className="absolute bottom-20 left-[10%] w-[400px] h-[400px] rounded-full bg-[#0280FB] opacity-[0.04] blur-[120px]" style={{ animationDelay: "3s" }} />

        <div className="relative max-w-3xl mx-auto">
          <div data-animate className="text-center mb-16">
            <p className="text-xs font-medium text-[#60E2B7] mb-4 tracking-[0.2em] uppercase">Agenda</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-white">How the evening unfolds</h2>
          </div>

          <div data-animate className="space-y-0">
            {eventConfig.agendaItems.map((item, i) => (
              <div
                key={i}
                className="group grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-6 md:gap-10 py-8 border-t border-white/10 first:border-t-0"
              >
                <p className="text-sm md:text-base text-white/40 font-light pt-1">{item.time}</p>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 group-hover:text-[#60E2B7] transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 text-center mt-8">Agenda subject to change. Timings are indicative.</p>
        </div>
      </section>

      {/* Venue — photo gallery + Michelin-worthy copy */}
      <section id="venue" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div data-animate className="text-center mb-16">
            <p className="text-xs font-medium text-[#C368F9] mb-4 tracking-[0.2em] uppercase">Venue</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">{eventConfig.venue}</h2>
            <p className="font-serif text-xl text-[var(--muted)] italic">{eventConfig.venueAddress}</p>
          </div>

          {/* Photo grid */}
          <div data-animate className="grid grid-cols-12 gap-3 mb-16">
            <div className="col-span-7 relative rounded-2xl overflow-hidden aspect-[4/3] group">
              <Image
                src="/venue/olive-tree.png"
                alt="Warm ambient lighting at the venue"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>
            <div className="col-span-5 grid grid-rows-2 gap-3">
              <div className="relative rounded-2xl overflow-hidden group">
                <Image
                  src="/venue/evening-setting.png"
                  alt="Candlelit evening table setting"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden group">
                <Image
                  src="/venue/table-close.png"
                  alt="Rustic place settings with eucalyptus"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
            </div>
          </div>

          <div data-animate className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-lg text-[var(--muted)] leading-relaxed">
              {eventConfig.venueDescription}
            </p>
          </div>

          {/* Venue details — three elegant cards */}
          <div data-animate className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                title: "The space",
                description: eventConfig.venueCapacityNote,
              },
              {
                title: "The food",
                description: eventConfig.venueDiningNote,
              },
              {
                title: "Getting there",
                description: eventConfig.venueDirections,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl bg-white border border-[var(--border)] p-8 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500"
              >
                <h3 className="text-sm font-semibold mb-3 group-hover:text-[#040078] transition-colors">{card.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Google Map */}
          <div data-animate className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg shadow-black/5">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(eventConfig.venueAddressFull || eventConfig.venue + ", " + eventConfig.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

      {/* Stats — clean white, Apple-style large numbers */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div data-animate className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "30+", label: "Senior leaders per event" },
              { stat: "92%", label: "Attend rate" },
              { stat: "12", label: "Cities worldwide" },
              { stat: "87", label: "Net Promoter Score" },
            ].map((item) => (
              <div key={item.label} className="group">
                <p className="text-5xl md:text-6xl font-serif font-medium text-[#040078] mb-2 group-hover:scale-105 transition-transform duration-300">{item.stat}</p>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-28 px-6">
        <div className="max-w-xl mx-auto">
          <div data-animate className="text-center mb-12">
            <p className="text-xs font-medium text-[#60E2B7] mb-4 tracking-[0.2em] uppercase">RSVP</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">Request your place</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Attendance is limited to {eventConfig.capacity} guests. Submit your details and our team will confirm your invitation within 48 hours.
            </p>
          </div>

          {!submitted ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                  });
                } catch {
                  // Continue to thank you page even if save fails (demo mode)
                }
                router.push(`/thank-you?name=${encodeURIComponent(formData.firstName)}&email=${encodeURIComponent(formData.email)}`);
              }}
              className="space-y-5"
              data-animate
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">First Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Last Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm placeholder:text-[var(--muted)]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Company Name <span className="text-red-400">*</span></label>
                <p className="text-[11px] text-[var(--muted)]/60 mb-1.5">As you&apos;d like it on your place card</p>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Job Title <span className="text-red-400">*</span></label>
                <p className="text-[11px] text-[var(--muted)]/60 mb-1.5">As you&apos;d like it on your place card</p>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Dietary restrictions <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="None, vegetarian, gluten-free, etc."
                  value={formData.dietary}
                  onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm placeholder:text-[var(--muted)]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[var(--muted)] uppercase tracking-wider">Anything else we should know?</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={formData.additionalNeeds}
                  onChange={(e) => setFormData({ ...formData, additionalNeeds: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[#040078]/10 focus:border-[#040078] transition-all duration-300 text-sm placeholder:text-[var(--muted)]/40"
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  required
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[#040078] focus:ring-[#040078]"
                />
                <label className="text-xs text-[var(--muted)] leading-relaxed">
                  By checking this box, you agree that Moloco may send you marketing communications regarding this event, future events, and/or their services. You may unsubscribe at any time. View the <a href="#" className="text-[#0280FB] underline hover:no-underline">Moloco privacy policy</a>. <span className="text-red-400">*</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-[#040078] text-white font-semibold hover:shadow-xl hover:shadow-[#040078]/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-base mt-4 disabled:opacity-70"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {/* FAQ — dark section like current Splash */}
      <section id="faqs" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020044] via-[#040078] to-[#0a0066]" />
        <div className="absolute top-0 right-[20%] w-[400px] h-[400px] rounded-full bg-[#876AFF] opacity-[0.03] blur-[150px]" />

        <div className="relative max-w-3xl mx-auto">
          <div data-animate className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-white">FAQ</h2>
          </div>

          <div data-animate className="space-y-0">
            {eventConfig.faqItems.map((item, i) => (
              <div key={i} className="border-t border-white/10 first:border-t-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left py-6 flex items-start justify-between gap-8 group"
                >
                  <span className="font-medium text-white/90 text-base group-hover:text-white transition-colors">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-white/30 transition-all duration-300 flex-shrink-0 mt-1 ${openFaq === i ? "rotate-45" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openFaq === i ? "max-h-40 opacity-100 pb-6" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm text-white/50 leading-relaxed max-w-xl">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA — with venue photo */}
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
        <div className="relative max-w-3xl mx-auto text-center">
          <div data-animate>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-white mb-3">{eventConfig.heroHeadline}</h2>
            <p className="text-lg text-white/70 font-light tracking-wide uppercase mb-8">{eventConfig.eventSubtitle}</p>
            <p className="text-white/50 mb-10 text-sm">Attendance is limited. RSVP early to confirm your spot.</p>
            <a
              href="#register"
              className="px-7 py-3 rounded-full border border-white/30 text-white/90 text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all duration-300 tracking-wide"
            >
              Request your invitation
            </a>
          </div>
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