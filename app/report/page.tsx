'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AiAnalysis {
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  routing: string;
  confidence: number;
}

interface DuplicateIncident {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  timestamp: string;
}

type ReportingStep = 'FORM' | 'LOADING' | 'DUPLICATE_CHECK' | 'SUCCESS';

// ─── badge maps ───────────────────────────────────────────────────────────────
const PRIORITY_BADGE: Record<string, string> = {
  Urgent: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};
const STATUS_BADGE: Record<string, string> = {
  REPORTED: 'bg-blue-50 text-blue-700 border-blue-200',
  INVESTIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DUPLICATE: 'bg-slate-100 text-slate-500 border-slate-200',
};
const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Reported', INVESTIGATING: 'Investigating', IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved', VERIFIED: 'Verified', FAILED_VERIFICATION: 'Failed',
  DUPLICATE: 'Duplicate',
};

// ─── Shared header ─────────────────────────────────────────────────────────────
function Header({ label }: { label: string }) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">CR</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-[15px] leading-none group-hover:text-blue-600 transition-colors">CampusRelay</span>
            <span className="block text-[10px] text-slate-400 leading-none mt-0.5">Campus Operations Platform</span>
          </div>
        </Link>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
          {label}
        </span>
      </div>
    </header>
  );
}

export default function ReportPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');

  const [step, setStep] = useState<ReportingStep>('FORM');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateIncident[]>([]);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      setError('Please fill in all required fields: Title, Location, and Description.');
      return;
    }
    setError(null);
    setStep('LOADING');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, contact }),
      });
      if (!res.ok) throw new Error('Failed to submit report. Please try again.');
      const data = await res.json();
      if (data.status === 'awaiting_duplicate_check') {
        setAnalysis(data.analysis);
        setDuplicates(data.potentialDuplicates);
        setStep('DUPLICATE_CHECK');
      } else if (data.status === 'created') {
        setAnalysis({ category: data.incident.category, priority: data.incident.priority, routing: data.incident.routing, confidence: 0.95 });
        setCreatedIncidentId(data.incident.id);
        setIsLinked(false);
        setStep('SUCCESS');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('FORM');
    }
  };

  const handleForceCreate = async () => {
    setError(null);
    setStep('LOADING');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, contact, forceCreate: true }),
      });
      if (!res.ok) throw new Error('Failed to create incident.');
      const data = await res.json();
      setCreatedIncidentId(data.incident.id);
      setIsLinked(false);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('DUPLICATE_CHECK');
    }
  };

  const handleLinkDuplicate = async (parentIncidentId: string) => {
    setError(null);
    setStep('LOADING');
    try {
      const res = await fetch('/api/incidents/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, contact, parentIncidentId }),
      });
      if (!res.ok) throw new Error('Failed to link report.');
      setCreatedIncidentId(parentIncidentId);
      setIsLinked(true);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('DUPLICATE_CHECK');
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setLocation(''); setContact('');
    setError(null); setAnalysis(null); setDuplicates([]);
    setCreatedIncidentId(null); setIsLinked(false); setStep('FORM');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Header label="Student Portal" />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-screen-xl mx-auto px-6 py-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-700 transition-colors">Overview</Link>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-slate-300">
            <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-slate-700 font-medium">Report an Issue</span>
        </div>
      </div>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
        <div className="max-w-2xl">

          {/* ── FORM ── */}
          {step === 'FORM' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Report a Campus Issue</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Use this form to report safety, facilities, or IT issues. Reports are automatically classified and routed to the responsible department.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 mb-5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {/* Section: Issue Details */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Details</h2>
                </div>

                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title" type="text" required
                      placeholder="e.g., Water leaking from ceiling in Library Room 304"
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-slate-400">A specific title helps the system route your report accurately.</p>
                  </div>

                  {/* Location + Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="location" type="text" required
                        placeholder="e.g., Science Building, Floor 2"
                        value={location} onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Contact Email <span className="text-slate-400 font-normal text-xs">(optional)</span>
                      </label>
                      <input
                        id="contact" type="email"
                        placeholder="student@campus.edu"
                        value={contact} onChange={(e) => setContact(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Description */}
                <div className="px-6 py-4 border-t border-b border-slate-100 bg-slate-50">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</h2>
                </div>

                <div className="p-6">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Describe the issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description" required rows={5}
                    placeholder="Include what you observed, when it started, and any safety risks. Detailed descriptions improve classification accuracy."
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Submit footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400"><span className="text-red-500">*</span> Required</p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md transition-colors shadow-sm"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h12M9 4l5 4-5 4" />
                    </svg>
                    Submit Report
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── LOADING ── */}
          {step === 'LOADING' && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative w-10 h-10 mb-5">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-600 animate-spin"></div>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">Processing your report</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Classifying issue type, assessing priority, and checking for similar active reports…
              </p>
            </div>
          )}

          {/* ── DUPLICATE CHECK ── */}
          {step === 'DUPLICATE_CHECK' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Similar Reports Found</h1>
                <p className="text-sm text-slate-500 mt-1">
                  The system detected existing open incidents that closely match your report. Please review them before proceeding.
                </p>
              </div>

              {/* Classification strip */}
              {analysis && (
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-2.5 shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Auto-classified:</span>
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{analysis.category}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE[analysis.priority] ?? ''}`}>{analysis.priority} Priority</span>
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">→ {analysis.routing}</span>
                  <span className="ml-auto text-xs text-slate-400">{(analysis.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              )}

              {/* Duplicate list */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600 flex-shrink-0">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-amber-800">
                    {duplicates.length} related incident{duplicates.length !== 1 ? 's' : ''} already on record
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {duplicates.map((dup) => (
                    <div key={dup.id} className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-600">{dup.id}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${PRIORITY_BADGE[dup.priority] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {dup.priority}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${STATUS_BADGE[dup.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {STATUS_LABEL[dup.status] ?? dup.status}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">{new Date(dup.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium text-sm text-slate-800 truncate">{dup.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{dup.description}</p>
                        <p className="text-xs text-slate-400 mt-1">📍 {dup.location}</p>
                      </div>
                      <button
                        onClick={() => handleLinkDuplicate(dup.id)}
                        className="flex-shrink-0 text-xs font-semibold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        Link to this
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
              )}

              <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">None of these match your issue?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Submit as a separate incident if your issue is genuinely different.</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setStep('FORM')} className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-md transition-colors">
                    Edit Report
                  </button>
                  <button onClick={handleForceCreate} className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    Submit as New
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'SUCCESS' && (
            <div className="space-y-4">
              {/* Confirmation banner */}
              <div className="bg-white border border-emerald-200 rounded-lg px-5 py-4 flex items-start gap-4 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {isLinked ? 'Report Linked' : 'Report Submitted'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {isLinked
                      ? <>Linked to existing incident <span className="font-mono font-bold text-blue-600">{createdIncidentId}</span>. No duplicate ticket created.</>
                      : <>New incident created with ID <span className="font-mono font-bold text-blue-600">{createdIncidentId}</span>.</>
                    }
                  </p>
                </div>
              </div>

              {/* Classification detail */}
              {!isLinked && analysis && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incident Classification</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="px-5 py-3 grid grid-cols-3 text-sm">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide self-center">Incident ID</span>
                      <span className="col-span-2 font-mono font-bold text-blue-600">{createdIncidentId}</span>
                    </div>
                    <div className="px-5 py-3 grid grid-cols-3 text-sm">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide self-center">Category</span>
                      <span className="col-span-2 font-medium text-slate-800">{analysis.category}</span>
                    </div>
                    <div className="px-5 py-3 grid grid-cols-3 text-sm">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide self-center">Priority</span>
                      <span className="col-span-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE[analysis.priority] ?? ''}`}>
                          {analysis.priority}
                        </span>
                      </span>
                    </div>
                    <div className="px-5 py-3 grid grid-cols-3 text-sm">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide self-center">Routed To</span>
                      <span className="col-span-2 font-medium text-slate-800">{analysis.routing}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* What happens next */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">What happens next</h3>
                <ol className="space-y-2.5">
                  {[
                    'Your report has been received and logged in the operations system.',
                    `It has been routed to ${analysis?.routing ?? 'the responsible department'} for review.`,
                    'Once resolved, the resolution will be verified before the ticket is closed.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                  {contact && (
                    <li className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                      Updates may be sent to <span className="font-medium text-slate-800 ml-1">{contact}</span>.
                    </li>
                  )}
                </ol>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={resetForm} className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-md transition-colors">
                  Report Another Issue
                </button>
                <Link href="/" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors">
                  Return to Overview
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
