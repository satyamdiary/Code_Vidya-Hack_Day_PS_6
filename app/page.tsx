import Link from 'next/link';
import { getIncidents } from '@/lib/db';
import { generateInsights } from '@/lib/aiService';

// ─── tiny icon helpers ────────────────────────────────────────────────────────
function IconClipboard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" clipRule="evenodd" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
      <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
    </svg>
  );
}

const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500',
  High: 'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-slate-400',
};
const PRIORITY_TEXT: Record<string, string> = {
  Urgent: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-yellow-600',
  Low: 'text-slate-500',
};
const STATUS_CHIP: Record<string, string> = {
  REPORTED: 'bg-blue-50 text-blue-700 border-blue-200',
  INVESTIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED_VERIFICATION: 'bg-red-50 text-red-700 border-red-200',
  DUPLICATE: 'bg-slate-100 text-slate-500 border-slate-200',
};
const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Reported', INVESTIGATING: 'Investigating', IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved', VERIFIED: 'Verified', FAILED_VERIFICATION: 'Failed Verify',
  DUPLICATE: 'Duplicate',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function Home() {
  const incidents = getIncidents();
  const insights = await generateInsights(incidents);

  const total = incidents.length;
  const active = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'VERIFIED' && i.status !== 'DUPLICATE'
  ).length;
  const urgent = incidents.filter(
    (i) => (i.priority === 'Urgent' || i.priority === 'High') &&
      i.status !== 'RESOLVED' && i.status !== 'VERIFIED' && i.status !== 'DUPLICATE'
  ).length;
  const resolved = incidents.filter((i) => i.status === 'VERIFIED' || i.status === 'RESOLVED').length;
  const duplicatesLinked = incidents.filter((i) => i.status === 'DUPLICATE').length;

  const recent = [...incidents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  // Category breakdown
  const catMap: Record<string, number> = {};
  incidents.forEach((i) => {
    if (i.status !== 'DUPLICATE') catMap[i.category] = (catMap[i.category] ?? 0) + 1;
  });
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catMax = categories[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top nav — no sidebar on home page for the student-facing context */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">CR</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-[15px] leading-none">CampusRelay</span>
              <span className="block text-[10px] text-slate-400 leading-none mt-0.5">Campus Operations Platform</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <span className="text-sm font-medium text-blue-600 px-3 py-1.5 bg-blue-50 rounded-md">Overview</span>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">Admin Console</Link>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">Incidents</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
              </svg>
              Report Issue
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live incident tracking for campus facilities, safety, and IT.</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card kpi-blue bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Reports</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <IconClipboard />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-400 mt-1">all time</p>
          </div>

          <div className="kpi-card kpi-amber bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active</span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <IconAlert />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{active}</p>
            <p className="text-xs text-slate-400 mt-1">open incidents</p>
          </div>

          <div className="kpi-card kpi-red bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Urgent / High</span>
              <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{urgent}</p>
            <p className="text-xs text-slate-400 mt-1">need attention</p>
          </div>

          <div className="kpi-card kpi-green bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolved</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <IconCheck />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{resolved}</p>
            <p className="text-xs text-slate-400 mt-1">{duplicatesLinked} duplicates linked</p>
          </div>
        </div>

        {/* Main grid: recent incidents + breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Recent incidents table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Recent Incidents</h2>
              <Link href="/admin" className="text-xs font-medium text-blue-600 hover:underline">View all →</Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24">ID</th>
                  <th className="px-5 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                  <th className="px-5 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20">Priority</th>
                  <th className="px-5 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-28">Status</th>
                  <th className="px-5 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 hidden md:table-cell">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-bold text-blue-600">{inc.id}</span>
                    </td>
                    <td className="px-5 py-3 max-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{inc.title}</p>
                      <p className="text-xs text-slate-400 truncate">{inc.location}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${PRIORITY_TEXT[inc.priority] ?? 'text-slate-500'}`}>
                        <span className={`status-dot ${PRIORITY_DOT[inc.priority] ?? 'bg-slate-400'}`}></span>
                        {inc.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${STATUS_CHIP[inc.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {STATUS_LABEL[inc.status] ?? inc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{timeAgo(inc.timestamp)}</span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No incidents yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Right column: category breakdown + quick actions */}
          <div className="flex flex-col gap-5">

            {/* Category breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800">By Category</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400">No data yet.</p>
                )}
                {categories.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate">{cat}</span>
                      <span className="text-xs font-bold text-slate-600 ml-2 flex-shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / catMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring hotspots */}
            {insights.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Recurring Hotspots</h2>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{insights.length}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {insights.slice(0, 3).map((ins) => (
                    <div key={ins.id} className="px-5 py-3 flex items-start gap-3">
                      <span className={`status-dot mt-1.5 ${PRIORITY_DOT[ins.priority] ?? 'bg-slate-400'}`}></span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{ins.location}</p>
                        <p className="text-[11px] text-slate-400">{ins.category} · {ins.count} reports</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href="/admin" className="text-xs font-medium text-blue-600 hover:underline">View full analysis →</Link>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/report"
                  className="flex items-center gap-2.5 w-full text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2.5 rounded-md transition-colors"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
                  </svg>
                  Submit a New Report
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 w-full text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-md transition-colors"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
                    <rect x="1" y="1" width="14" height="14" rx="2" /><line x1="1" y1="5" x2="15" y2="5" /><line x1="5" y1="5" x2="5" y2="15" />
                  </svg>
                  Open Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Platform capabilities — compact row */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Platform Capabilities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              { icon: '📋', title: 'Smart Classification', desc: 'Incidents are auto-categorised by type, priority, and responsible department.' },
              { icon: '🔍', title: 'Duplicate Detection', desc: 'Similar open reports are detected before submission to prevent duplicate tickets.' },
              { icon: '✅', title: 'Resolution Verification', desc: 'Resolution evidence is analysed to confirm the reported issue was actually fixed.' },
              { icon: '📊', title: 'Recurring Insights', desc: 'Patterns across incidents at the same location are surfaced as operational intelligence.' },
            ].map((c) => (
              <div key={c.title} className="px-5 py-5">
                <div className="text-xl mb-2">{c.icon}</div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{c.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer className="border-t border-slate-200 bg-white mt-8 py-4 text-center text-xs text-slate-400">
        CampusRelay &mdash; Campus Operations Platform &mdash; 2026
      </footer>
    </div>
  );
}
