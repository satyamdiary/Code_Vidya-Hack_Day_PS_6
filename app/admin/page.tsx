'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AiVerification { verified: boolean; confidence: number; reason: string; }

interface Incident {
  id: string; title: string; description: string; location: string; contact: string;
  category: string; priority: 'Low' | 'Medium' | 'High' | 'Urgent'; routing: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'FAILED_VERIFICATION' | 'DUPLICATE';
  parentIncidentId: string | null; timestamp: string;
  resolutionNotes: string | null; aiVerificationResult: AiVerification | null;
}

interface RecurringInsightCluster {
  id: string; title: string; category: string; location: string; count: number;
  incidents: { id: string; title: string; timestamp: string; }[];
  recommendedAction: string; priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIORITY_CLASS: Record<string, string> = {
  Urgent: 'bg-red-50 text-red-700 border-red-200',
  High:   'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low:    'bg-slate-100 text-slate-600 border-slate-200',
};
const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-slate-400',
};
const STATUS_CLASS: Record<string, string> = {
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
  RESOLVED: 'Resolved', VERIFIED: 'Verified', FAILED_VERIFICATION: 'Failed Verification',
  DUPLICATE: 'Duplicate',
};

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${PRIORITY_CLASS[priority] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority] ?? 'bg-slate-400'}`}></span>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${STATUS_CLASS[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M1 2.75A.75.75 0 0 1 1.75 2h16.5a.75.75 0 0 1 0 1.5H18v8.75A2.75 2.75 0 0 1 15.25 15h-1.072l.798 3.06a.75.75 0 0 1-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 0 1-1.452-.38L5.823 15H4.75A2.75 2.75 0 0 1 2 12.25V3.5h-.25A.75.75 0 0 1 1 2.75ZM3.5 3.5v8.75c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V3.5h-13Z" clipRule="evenodd" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 10a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1V10Zm0 5.25a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01Z" clipRule="evenodd" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 7A1.5 1.5 0 0 0 8 8.5v8a1.5 1.5 0 0 0 3 0v-8A1.5 1.5 0 0 0 9.5 7ZM3.5 12A1.5 1.5 0 0 0 2 13.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 3.5 12Z" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12 2.25h.093a2.25 2.25 0 0 1 2.122 1.5A2.25 2.25 0 0 1 15.988 3.012ZM11.5 6.5A1.5 1.5 0 0 0 10 5H4a1.5 1.5 0 0 0-1.5 1.5v9.75A1.5 1.5 0 0 0 4 17.75h6A1.5 1.5 0 0 0 11.5 16.25V6.5Z" clipRule="evenodd" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, insightCount }: {
  activeTab: 'incidents' | 'insights';
  setActiveTab: (t: 'incidents' | 'insights') => void;
  insightCount: number;
}) {
  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">CR</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">CampusRelay</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Operations</p>

        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm w-full"
        >
          {icons.dashboard}
          Overview
        </Link>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm w-full text-left ${
            activeTab === 'incidents'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {icons.list}
          Incidents
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm w-full text-left ${
            activeTab === 'insights'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {icons.chart}
          <span className="flex-1">Recurring Issues</span>
          {insightCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'insights' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {insightCount}
            </span>
          )}
        </button>

        <div className="pt-4">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Student</p>
          <Link
            href="/report"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
          >
            {icons.report}
            Submit Report
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-600">CampusRelay &mdash; 2026</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [insights, setInsights] = useState<RecurringInsightCluster[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'insights'>('incidents');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [manualLinkTargetId, setManualLinkTargetId] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, insRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/insights'),
      ]);
      if (!incRes.ok) throw new Error('Failed to load incidents');
      if (!insRes.ok) throw new Error('Failed to load insights');
      const [incData, insData] = await Promise.all([incRes.json(), insRes.json()]);
      setIncidents(incData.incidents);
      setInsights(insData.insights);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find((i) => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }
  }, [incidents]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Error updating status');
    } finally { setActionLoading(false); }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !resolutionNotes.trim()) return;
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}/resolve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes }),
      });
      if (!res.ok) throw new Error('Failed to resolve incident');
      setResolutionNotes('');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve incident');
    } finally { setActionLoading(false); }
  };

  const handleManualLink = async (childId: string, parentId: string) => {
    if (!childId || !parentId) return;
    setActionLoading(true); setActionError(null);
    try {
      const child = incidents.find((i) => i.id === childId);
      if (!child) throw new Error('Report not found');
      const res = await fetch('/api/incidents/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: child.title, description: child.description, location: child.location, contact: child.contact, parentIncidentId: parentId }),
      });
      if (!res.ok) throw new Error('Failed to link duplicate');
      await fetch(`/api/incidents/${childId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DUPLICATE', parentIncidentId: parentId }),
      });
      setManualLinkTargetId('');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Error linking duplicate');
    } finally { setActionLoading(false); }
  };

  // ── Metrics ──
  const totalCount = incidents.length;
  const unresolvedCount = incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'VERIFIED' && i.status !== 'DUPLICATE').length;
  const urgentCount = incidents.filter((i) => (i.priority === 'Urgent' || i.priority === 'High') && i.status !== 'RESOLVED' && i.status !== 'VERIFIED' && i.status !== 'DUPLICATE').length;
  const verifiedCount = incidents.filter((i) => i.status === 'VERIFIED' || i.status === 'RESOLVED').length;
  const duplicatesAvoided = incidents.filter((i) => i.status === 'DUPLICATE').length;

  // ── Category bar data ──
  const catMap: Record<string, number> = {};
  incidents.forEach((i) => { if (i.status !== 'DUPLICATE') catMap[i.category] = (catMap[i.category] ?? 0) + 1; });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catMax = catEntries[0]?.[1] ?? 1;

  // ── Filtered list ──
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'active') {
      if (inc.status === 'RESOLVED' || inc.status === 'VERIFIED' || inc.status === 'DUPLICATE') return false;
    } else if (statusFilter !== 'all' && inc.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (priorityFilter !== 'all' && inc.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (categoryFilter !== 'all' && inc.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} insightCount={insights.length} />

      <div className="main-content">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-6 h-14 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                {activeTab === 'incidents' ? 'Incident Management' : 'Recurring Issue Analysis'}
              </h1>
              <p className="text-xs text-slate-400">
                {activeTab === 'incidents'
                  ? `${filteredIncidents.length} incidents shown`
                  : `${insights.length} recurring patterns detected`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${loading ? '[&>svg]:animate-spin' : ''}`}
              >
                {icons.refresh}
                Refresh
              </button>
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                + New Report
              </Link>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 flex flex-col gap-5 flex-1">

          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="kpi-card kpi-blue bg-white border border-slate-200 rounded-lg px-4 py-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Total Reports</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '—' : totalCount}</p>
            </div>
            <div className="kpi-card kpi-amber bg-white border border-slate-200 rounded-lg px-4 py-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Active / Open</p>
              <p className="text-2xl font-bold text-amber-600">{loading ? '—' : unresolvedCount}</p>
            </div>
            <div className="kpi-card kpi-red bg-white border border-slate-200 rounded-lg px-4 py-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Urgent / High</p>
              <p className="text-2xl font-bold text-red-600">{loading ? '—' : urgentCount}</p>
            </div>
            <div className="kpi-card kpi-green bg-white border border-slate-200 rounded-lg px-4 py-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Resolved</p>
              <p className="text-2xl font-bold text-emerald-600">{loading ? '—' : verifiedCount}</p>
            </div>
            <div className="kpi-card kpi-blue bg-white border border-slate-200 rounded-lg px-4 py-3.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Duplicates Linked</p>
              <p className="text-2xl font-bold text-blue-600">{loading ? '—' : duplicatesAvoided}</p>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-600 animate-spin"></div>
              </div>
            </div>
          ) : activeTab === 'incidents' ? (

            /* ══ INCIDENTS TAB ══════════════════════════════════════════════════ */
            <div className="flex gap-5 items-start">

              {/* Left: mini category chart + filter + table */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category breakdown mini-chart */}
                  <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Incidents by Category</p>
                    <div className="space-y-2">
                      {catEntries.map(([cat, count]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-28 flex-shrink-0 truncate">{cat}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / catMax) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-5 text-right flex-shrink-0">{count}</span>
                        </div>
                      ))}
                      {catEntries.length === 0 && <p className="text-xs text-slate-400">No data yet.</p>}
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Distribution</p>
                    <div className="space-y-2">
                      {(['REPORTED', 'INVESTIGATING', 'IN_PROGRESS', 'VERIFIED', 'FAILED_VERIFICATION', 'DUPLICATE'] as const).map((s) => {
                        const c = incidents.filter((i) => i.status === s).length;
                        if (c === 0) return null;
                        return (
                          <div key={s} className="flex items-center justify-between">
                            <StatusBadge status={s} />
                            <span className="text-xs font-bold text-slate-600">{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-blue-500">
                      <option value="active">Active</option>
                      <option value="all">All</option>
                      <option value="reported">Reported</option>
                      <option value="investigating">Investigating</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="verified">Verified</option>
                      <option value="failed_verification">Failed Verification</option>
                      <option value="duplicate">Duplicate</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Priority</label>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-blue-500">
                      <option value="all">All</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Category</label>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-blue-500">
                      <option value="all">All</option>
                      <option value="facilities">Facilities</option>
                      <option value="it & tech">IT &amp; Tech</option>
                      <option value="safety & security">Safety &amp; Security</option>
                      <option value="dining services">Dining Services</option>
                      <option value="academic">Academic</option>
                      <option value="administrative">Administrative</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">{filteredIncidents.length} of {totalCount}</span>
                </div>

                {/* Incident table */}
                {filteredIncidents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg py-16 text-center text-sm text-slate-400">
                    No incidents match the current filters.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-24">ID</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Title / Location</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-28 hidden lg:table-cell">Category</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-24">Priority</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-32">Status</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20 hidden xl:table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredIncidents.map((inc) => (
                          <tr
                            key={inc.id}
                            onClick={() => { setSelectedIncident(inc); setActionError(null); setResolutionNotes(''); }}
                            className={`cursor-pointer transition-colors ${
                              selectedIncident?.id === inc.id
                                ? 'bg-blue-50 border-l-[3px] border-l-blue-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-bold text-blue-600">{inc.id}</span>
                            </td>
                            <td className="px-4 py-3 max-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{inc.title}</p>
                              <p className="text-xs text-slate-400 truncate">📍 {inc.location}</p>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs text-slate-600">{inc.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <PriorityBadge priority={inc.priority} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={inc.status} />
                            </td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              <span className="text-xs text-slate-400">{new Date(inc.timestamp).toLocaleDateString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right: Detail pane */}
              <div className="w-72 xl:w-80 flex-shrink-0 sticky top-20">
                {selectedIncident ? (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Pane header */}
                    <div className="px-4 py-3.5 border-b border-slate-100 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-600">{selectedIncident.id}</span>
                          <PriorityBadge priority={selectedIncident.priority} />
                        </div>
                        <div className="mb-1">
                          <StatusBadge status={selectedIncident.status} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug mt-1">{selectedIncident.title}</h3>
                      </div>
                      <button onClick={() => setSelectedIncident(null)} className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors p-0.5">
                        {icons.close}
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">

                      {/* Meta */}
                      <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Category</p>
                            <p className="font-medium text-slate-800">{selectedIncident.category}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Reported</p>
                            <p className="text-slate-700">{new Date(selectedIncident.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Department</p>
                            <p className="font-medium text-slate-800">{selectedIncident.routing}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Location</p>
                            <p className="font-medium text-slate-800">{selectedIncident.location}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Contact</p>
                            <p className="text-slate-600 font-mono text-[11px] break-all">{selectedIncident.contact || 'Anonymous'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Description</p>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedIncident.description}</p>
                        </div>
                      </div>

                      {/* Workflow status */}
                      {selectedIncident.status !== 'DUPLICATE' && selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'VERIFIED' && (
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-2">Update Status</p>
                          <div className="flex gap-2">
                            {(['INVESTIGATING', 'IN_PROGRESS'] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => handleUpdateStatus(selectedIncident.id, s)}
                                disabled={actionLoading}
                                className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
                                  selectedIncident.status === s
                                    ? STATUS_CLASS[s]
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Duplicate management */}
                      {selectedIncident.status !== 'DUPLICATE' ? (
                        <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Linked Duplicates</p>
                          {incidents.filter((i) => i.parentIncidentId === selectedIncident.id).length > 0 ? (
                            <div className="space-y-1">
                              {incidents.filter((i) => i.parentIncidentId === selectedIncident.id).map((dup) => (
                                <div key={dup.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs">
                                  <span className="font-mono font-bold text-blue-600 flex-shrink-0">{dup.id}</span>
                                  <span className="text-slate-500 truncate flex-1">{dup.title.substring(0, 20)}…</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">None linked.</p>
                          )}
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1">Consolidate another report here:</p>
                            <div className="flex gap-2">
                              <select
                                value={manualLinkTargetId}
                                onChange={(e) => setManualLinkTargetId(e.target.value)}
                                className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">Select report…</option>
                                {incidents
                                  .filter((i) => i.id !== selectedIncident.id && i.status !== 'DUPLICATE' && i.status !== 'RESOLVED' && i.status !== 'VERIFIED')
                                  .map((i) => (
                                    <option key={i.id} value={i.id}>{i.id}: {i.title.substring(0, 20)}…</option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleManualLink(manualLinkTargetId, selectedIncident.id)}
                                disabled={!manualLinkTargetId || actionLoading}
                                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 px-3 py-1 rounded-md transition-colors"
                              >
                                Link
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-2">Linked to Parent</p>
                          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Consolidated under:</span>
                            <button
                              onClick={() => {
                                const parent = incidents.find((i) => i.id === selectedIncident.parentIncidentId);
                                if (parent) { setSelectedIncident(parent); setActionError(null); setResolutionNotes(''); }
                              }}
                              className="text-xs font-bold text-blue-600 hover:underline font-mono"
                            >
                              {selectedIncident.parentIncidentId}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Resolution workflow */}
                      {selectedIncident.status !== 'DUPLICATE' && (
                        <div className="px-4 py-3 space-y-3">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Resolution</p>

                          {selectedIncident.resolutionNotes ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] text-slate-400 mb-1">Submitted evidence:</p>
                                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2.5 leading-relaxed">
                                  {selectedIncident.resolutionNotes}
                                </p>
                              </div>

                              {selectedIncident.aiVerificationResult && (
                                <div className={`border rounded-md p-3 space-y-1.5 ${
                                  selectedIncident.aiVerificationResult.verified
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                                      selectedIncident.aiVerificationResult.verified ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                      {selectedIncident.aiVerificationResult.verified ? icons.check : icons.warn}
                                      {selectedIncident.aiVerificationResult.verified ? 'Verified' : 'Verification Failed'}
                                    </span>
                                    <span className={`text-[10px] font-semibold ${
                                      selectedIncident.aiVerificationResult.verified ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                      {(selectedIncident.aiVerificationResult.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-slate-600">
                                    {selectedIncident.aiVerificationResult.reason}
                                  </p>
                                </div>
                              )}

                              {selectedIncident.status === 'FAILED_VERIFICATION' && (
                                <form onSubmit={handleResolveIncident} className="space-y-2">
                                  <p className="text-xs text-slate-500">Resubmit with more detailed evidence:</p>
                                  <textarea required rows={3} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Describe the specific repair or fix in detail…"
                                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                                  />
                                  <button type="submit" disabled={actionLoading}
                                    className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 py-2 rounded-md transition-colors">
                                    {actionLoading ? 'Verifying…' : 'Re-verify & Resolve'}
                                  </button>
                                </form>
                              )}
                            </div>
                          ) : (
                            <form onSubmit={handleResolveIncident} className="space-y-2">
                              <p className="text-xs text-slate-500">Provide resolution evidence. The system will verify whether the action matches the reported issue.</p>
                              <textarea required rows={4} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="e.g., Replaced the leaking valve under the sink. Area dried and confirmed dry the following morning."
                                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                              />
                              <button type="submit" disabled={actionLoading}
                                className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 py-2.5 rounded-md transition-colors shadow-sm">
                                {actionLoading ? 'Verifying…' : 'Submit & Verify Resolution'}
                              </button>
                            </form>
                          )}

                          {actionError && (
                            <div className="p-2.5 rounded-md border border-red-200 bg-red-50 text-xs text-red-700">{actionError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg py-16 flex flex-col items-center text-center shadow-sm">
                    {icons.list}
                    <p className="text-sm font-medium text-slate-400 mt-3">No incident selected</p>
                    <p className="text-xs text-slate-300 mt-1 max-w-[160px]">Click a row to view details and manage resolution</p>
                  </div>
                )}
              </div>
            </div>

          ) : (

            /* ══ INSIGHTS TAB ═══════════════════════════════════════════════════ */
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Recurring Issue Analysis</h2>
                <p className="text-sm text-slate-500">
                  The following locations and categories have generated repeated reports. These patterns may indicate systemic infrastructure issues requiring planned intervention.
                </p>
              </div>

              {insights.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg py-16 text-center shadow-sm">
                  <p className="text-sm font-medium text-slate-500">No recurring patterns detected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Patterns appear when 2 or more incidents share the same category and location.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {insights.map((item) => (
                      <InsightCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Detailed table */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cluster Detail</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-24">ID</th>
                          <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pattern</th>
                          <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-32 hidden md:table-cell">Location</th>
                          <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20">Reports</th>
                          <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {insights.map((item) => (
                          <InsightTableRow key={item.id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ item }: { item: RecurringInsightCluster }) {
  const PRIORITY_CLASS: Record<string, string> = {
    Urgent: 'bg-red-50 text-red-700 border-red-200',
    High:   'bg-orange-50 text-orange-700 border-orange-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low:    'bg-slate-100 text-slate-600 border-slate-200',
  };
  const PRIORITY_LEFT: Record<string, string> = {
    Urgent: 'border-l-red-500', High: 'border-l-orange-400',
    Medium: 'border-l-yellow-400', Low: 'border-l-slate-300',
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm border-l-4 ${PRIORITY_LEFT[item.priority] ?? 'border-l-slate-300'}`}>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-mono font-bold text-blue-600 mb-0.5">{item.id}</p>
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</h4>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${PRIORITY_CLASS[item.priority] ?? ''}`}>
            {item.priority}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>📍 {item.location}</span>
          <span>·</span>
          <span>{item.category}</span>
          <span>·</span>
          <span className="font-bold text-slate-800">{item.count} tickets</span>
        </div>

        {/* Incident pills */}
        <div className="flex flex-wrap gap-1">
          {item.incidents.map((i) => (
            <span key={i.id} className="inline-block font-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
              {i.id}
            </span>
          ))}
        </div>

        {/* Recommendation */}
        <div className="bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Recommended Action</p>
          <p className="text-xs text-slate-600 leading-relaxed">{item.recommendedAction}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable insight table row ─────────────────────────────────────────────
function InsightTableRow({ item }: { item: RecurringInsightCluster }) {
  const [expanded, setExpanded] = useState(false);
  const PRIORITY_CLASS: Record<string, string> = {
    Urgent: 'bg-red-50 text-red-700 border-red-200',
    High:   'bg-orange-50 text-orange-700 border-orange-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low:    'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-5 py-3">
          <span className="font-mono text-xs font-bold text-blue-600">{item.id}</span>
        </td>
        <td className="px-5 py-3">
          <p className="font-medium text-sm text-slate-800">{item.title}</p>
          <p className="text-xs text-slate-400">{item.category}</p>
        </td>
        <td className="px-5 py-3 hidden md:table-cell">
          <span className="text-xs text-slate-600">{item.location}</span>
        </td>
        <td className="px-5 py-3">
          <span className="text-sm font-bold text-slate-900">{item.count}</span>
        </td>
        <td className="px-5 py-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${PRIORITY_CLASS[item.priority] ?? ''}`}>
            {item.priority}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={5} className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Incidents in cluster</p>
                <div className="space-y-1.5">
                  {item.incidents.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 text-xs bg-white border border-slate-200 rounded-md px-3 py-1.5">
                      <span className="font-mono font-bold text-blue-600 flex-shrink-0">{i.id}</span>
                      <span className="text-slate-700 flex-1 truncate">{i.title}</span>
                      <span className="text-slate-400 flex-shrink-0">{new Date(i.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Recommended Action</p>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                  <p className="text-xs text-blue-800 leading-relaxed">{item.recommendedAction}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
