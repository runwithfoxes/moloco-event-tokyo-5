import Image from "next/image";
import Link from "next/link";

const templates = [
  {
    slug: "confirmation",
    title: "Registration Confirmation",
    trigger: "Immediately after registration",
    description: "Welcome email with event details, personal QR code, and calendar invite link.",
  },
  {
    slug: "reminder-7day",
    title: "7-Day Reminder",
    trigger: "7 days before event",
    description: "Agenda preview, research links, and venue details.",
  },
  {
    slug: "reminder-1day",
    title: "1-Day Reminder",
    trigger: "1 day before event",
    description: "Logistics: address, parking, dress code, what to expect.",
  },
  {
    slug: "reminder-morning",
    title: "Morning-Of Reminder",
    trigger: "Morning of event day",
    description: "Quick reminder with address, map link, and QR code.",
  },
  {
    slug: "post-attended",
    title: "Post-Event: Attended",
    trigger: "Morning after event (attended guests)",
    description: "Thank you, photo gallery link, research follow-ups.",
  },
  {
    slug: "post-noshow",
    title: "Post-Event: No-Show",
    trigger: "Morning after event (did not attend)",
    description: "Missed you note, highlights summary, future event interest.",
  },
];

export default function EmailTemplatesIndex() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#040078]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Image src="/venue/moloco-white.png" alt="Moloco" width={100} height={28} className="opacity-80" />
            <div className="hidden md:flex items-center gap-1.5 text-white/30 text-xs">
              <span>/</span>
              <span className="text-white/60">Email templates</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/report" className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300">Report</Link>
            <Link href="/check-in" className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300">Check-in</Link>
            <Link href="/demo" className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300">Event page</Link>
          </div>
        </div>
      </nav>

      <div className="pt-[72px]">
        {/* Header */}
        <div className="border-b border-neutral-200/60 bg-white">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 leading-tight mb-1.5">
              Email Templates
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              6 pre-built HTML emails for the VIP Connect guest journey. Click any template to preview the rendered HTML. Copy the source into HubSpot workflow emails.
            </p>
          </div>
        </div>

        {/* Workflow timeline */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-white border border-neutral-200/60 rounded-lg p-6 mb-8">
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-5">Email workflow sequence</p>
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {templates.map((t, i) => (
                <div key={t.slug} className="flex items-center flex-shrink-0">
                  <div className="text-center px-3">
                    <div className="w-8 h-8 rounded-full bg-[#040078]/[0.06] flex items-center justify-center text-[10px] font-medium text-[#040078]/60 mx-auto mb-1.5">
                      {i + 1}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">{t.title.split(":").pop()?.trim() || t.title}</p>
                  </div>
                  {i < templates.length - 1 && (
                    <div className="w-8 h-px bg-neutral-200 flex-shrink-0 mt-[-12px]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Template cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t, i) => (
              <Link
                key={t.slug}
                href={`/emails/${t.slug}`}
                className="group bg-white border border-neutral-200/60 rounded-lg p-6 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-[#040078]/30 uppercase tracking-wider">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-400 font-medium">
                    HTML
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-800 mb-1 group-hover:pl-0.5 transition-all duration-300">
                  {t.title}
                  <span className="inline-block ml-1.5 text-neutral-300 group-hover:text-[#040078]/40 group-hover:translate-x-0.5 transition-all duration-300">&rarr;</span>
                </h3>
                <p className="text-[11px] text-[#040078]/40 font-medium mb-2">{t.trigger}</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{t.description}</p>
              </Link>
            ))}
          </div>

          {/* Instructions for HubSpot */}
          <div className="bg-white border border-neutral-200/60 rounded-lg p-6 mt-8">
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-3">How to use in HubSpot</p>
            <ol className="space-y-2 text-sm text-neutral-500">
              <li><span className="text-neutral-800 font-medium">1.</span> Click a template above to preview it</li>
              <li><span className="text-neutral-800 font-medium">2.</span> Right-click the preview and &ldquo;View Page Source&rdquo; (or check the <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">/emails/</code> folder in the repo)</li>
              <li><span className="text-neutral-800 font-medium">3.</span> In HubSpot, create a workflow email and switch to the HTML/code editor</li>
              <li><span className="text-neutral-800 font-medium">4.</span> Paste the HTML source, replacing personalisation tokens as needed</li>
              <li><span className="text-neutral-800 font-medium">5.</span> Set the workflow trigger to match the timing shown on each card</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200/60 mt-8">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <Image src="/venue/moloco-primary.png" alt="Moloco" width={72} height={20} className="opacity-20" />
          <p className="text-[11px] text-neutral-300">Powered by HubSpot + Claude Code</p>
        </div>
      </footer>
    </div>
  );
}
