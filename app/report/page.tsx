"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { eventConfig } from "@/lib/event-config";

interface Registrant {
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

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReportPage() {
  const [guests, setGuests] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/register");
      const data = await res.json();
      if (data.registrations) {
        setGuests(data.registrations);
      }
      setLastUpdated(new Date());
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Computed stats
  const total = guests.length;
  const checkedIn = guests.filter((g) => g.status === "checked-in").length;
  const remaining = total - checkedIn;
  const attendRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Dietary breakdown
  const dietaryMap = new Map<string, number>();
  guests.forEach((g) => {
    const d = (g.dietary || "None").trim();
    dietaryMap.set(d, (dietaryMap.get(d) || 0) + 1);
  });
  const dietaryBreakdown = Array.from(dietaryMap.entries())
    .sort((a, b) => b[1] - a[1]);

  // Company breakdown
  const companyMap = new Map<string, number>();
  guests.forEach((g) => {
    const c = g.company.trim();
    if (c) companyMap.set(c, (companyMap.get(c) || 0) + 1);
  });
  const companyBreakdown = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1]);

  // Registration timeline (by day)
  const timelineMap = new Map<string, number>();
  guests.forEach((g) => {
    if (g.registeredAt) {
      const day = new Date(g.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timelineMap.set(day, (timelineMap.get(day) || 0) + 1);
    }
  });
  const timeline = Array.from(timelineMap.entries());
  const maxTimeline = Math.max(...timeline.map(([, v]) => v), 1);

  // Recent activity (last 5)
  const recentActivity = [...guests]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  const downloadCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Company", "Title", "Dietary", "Additional Needs", "Registered At", "Status", "Checked In At"];
    const rows = guests.map((g) => [
      g.firstName, g.lastName, g.email, g.company, g.title,
      g.dietary, g.additionalNeeds, g.registeredAt,
      g.status === "checked-in" ? "Checked in" : "Registered",
      g.checkedInAt || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vip-connect-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#040078]/20 border-t-[#040078] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#040078]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Image src="/venue/moloco-white.png" alt="Moloco" width={100} height={28} className="opacity-80" />
            <div className="hidden md:flex items-center gap-1.5 text-white/30 text-xs">
              <span>/</span>
              <span className="text-white/60">Event report</span>
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
            <Link href="/check-in" className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300">
              Check-in
            </Link>
            <Link href="/demo" className="text-xs text-white/30 hover:text-white/70 transition-colors duration-300">
              Event page
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-[72px]">
        {/* Header */}
        <div className="border-b border-neutral-200/60 bg-white">
          <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 leading-tight mb-1.5">
                Event Report
              </h1>
              <p className="text-sm text-neutral-400">
                {eventConfig.heroHeadline} · {eventConfig.venue}, {eventConfig.city} · {eventConfig.date}
                {lastUpdated && (
                  <span className="ml-3 text-neutral-300">
                    Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={loadData}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors duration-300 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: total, label: "Registered", color: "text-neutral-900" },
              { value: checkedIn, label: "Checked in", color: "text-[#60E2B7]" },
              { value: remaining, label: "Remaining", color: "text-neutral-900" },
              { value: `${attendRate}%`, label: "Attend rate", color: attendRate >= 80 ? "text-[#60E2B7]" : "text-neutral-900" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-neutral-200/60 rounded-lg p-6">
                <p className={`text-3xl font-serif font-medium ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance progress bar */}
          {total > 0 && (
            <div className="bg-white border border-neutral-200/60 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em]">Attendance progress</p>
                <p className="text-xs text-neutral-500">{checkedIn} of {total} guests</p>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#60E2B7] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${attendRate}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column — 2/3 width */}
            <div className="lg:col-span-2 space-y-8">

              {/* Registration timeline */}
              {timeline.length > 0 && (
                <div className="bg-white border border-neutral-200/60 rounded-lg p-6">
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-5">Registrations over time</p>
                  <div className="flex items-end gap-2 h-32">
                    {timeline.map(([day, count]) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-medium text-neutral-600">{count}</span>
                        <div
                          className="w-full bg-[#040078]/10 rounded-sm transition-all duration-500 hover:bg-[#040078]/20"
                          style={{ height: `${(count / maxTimeline) * 80}px`, minHeight: "4px" }}
                        />
                        <span className="text-[9px] text-neutral-400 whitespace-nowrap">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full guest list */}
              <div className="bg-white border border-neutral-200/60 rounded-lg">
                <div className="p-6 pb-4 flex items-center justify-between">
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em]">All registrations</p>
                  <p className="text-xs text-neutral-400">{total} guests</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b border-neutral-100">
                        <th className="text-left px-6 py-3 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Guest</th>
                        <th className="text-left px-6 py-3 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Company</th>
                        <th className="text-left px-6 py-3 text-[10px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Dietary</th>
                        <th className="text-left px-6 py-3 text-[10px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Registered</th>
                        <th className="text-left px-6 py-3 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map((g, i) => (
                        <tr key={i} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <p className="font-medium text-neutral-800">{g.firstName} {g.lastName}</p>
                            <p className="text-xs text-neutral-400">{g.title}</p>
                          </td>
                          <td className="px-6 py-3.5 text-neutral-600">{g.company}</td>
                          <td className="px-6 py-3.5 hidden md:table-cell">
                            {g.dietary && g.dietary !== "None" ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-500 font-medium uppercase tracking-wide">
                                {g.dietary}
                              </span>
                            ) : (
                              <span className="text-neutral-300 text-xs">None</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-neutral-400 hidden md:table-cell">
                            {g.registeredAt ? formatDate(g.registeredAt) : "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            {g.status === "checked-in" ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#60E2B7]" />
                                <span className="text-xs text-[#60E2B7] font-medium">{g.checkedInAt || "Arrived"}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                                <span className="text-xs text-neutral-400">Registered</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total === 0 && (
                  <div className="text-center py-16 text-neutral-300">
                    <p className="text-sm">No registrations yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — 1/3 width */}
            <div className="space-y-8">

              {/* Recent activity */}
              {recentActivity.length > 0 && (
                <div className="bg-white border border-neutral-200/60 rounded-lg p-6">
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">Recent activity</p>
                  <div className="space-y-4">
                    {recentActivity.map((g, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#040078]/[0.05] flex items-center justify-center text-[9px] font-medium text-[#040078]/60 flex-shrink-0 mt-0.5">
                          {g.firstName[0]}{g.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-700 truncate">{g.firstName} {g.lastName}</p>
                          <p className="text-[11px] text-neutral-400">{g.company} · {timeSince(g.registeredAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company breakdown */}
              {companyBreakdown.length > 0 && (
                <div className="bg-white border border-neutral-200/60 rounded-lg p-6">
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">By company</p>
                  <div className="space-y-2.5">
                    {companyBreakdown.map(([company, count]) => (
                      <div key={company} className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600 truncate mr-3">{company}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#040078]/20 rounded-full"
                              style={{ width: `${(count / (companyBreakdown[0]?.[1] || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-neutral-500 w-4 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-300 mt-4">{companyBreakdown.length} companies</p>
                </div>
              )}

              {/* Dietary breakdown */}
              {dietaryBreakdown.length > 0 && (
                <div className="bg-white border border-neutral-200/60 rounded-lg p-6">
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">Dietary requirements</p>
                  <div className="space-y-2.5">
                    {dietaryBreakdown.map(([dietary, count]) => (
                      <div key={dietary} className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600">{dietary}</span>
                        <span className="text-[10px] font-medium text-neutral-500">{count}</span>
                      </div>
                    ))}
                  </div>
                  {guests.filter((g) => g.dietary && g.dietary !== "None").length > 0 && (
                    <p className="text-[10px] text-orange-500 mt-4">
                      {guests.filter((g) => g.dietary && g.dietary !== "None").length} guests with dietary notes
                    </p>
                  )}
                </div>
              )}

              {/* Capacity */}
              <div className="bg-white border border-neutral-200/60 rounded-lg p-6">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] mb-4">Capacity</p>
                <div className="flex items-end gap-3 mb-3">
                  <p className="text-3xl font-serif font-medium text-neutral-900">{total}</p>
                  <p className="text-sm text-neutral-400 pb-1">/ {eventConfig.capacity}</p>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      total >= eventConfig.capacity ? "bg-red-400" : total >= eventConfig.capacity * 0.8 ? "bg-orange-400" : "bg-[#040078]/30"
                    }`}
                    style={{ width: `${Math.min((total / eventConfig.capacity) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-2">
                  {total >= eventConfig.capacity ? "At capacity" : `${eventConfig.capacity - total} spots remaining`}
                </p>
              </div>
            </div>
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
