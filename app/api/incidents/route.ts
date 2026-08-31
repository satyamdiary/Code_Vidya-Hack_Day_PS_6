import { NextResponse } from 'next/server';
import { getIncidents, addIncident } from '@/lib/db';
import { analyzeIssue, detectDuplicates } from '@/lib/aiService';
import { Incident } from '@/lib/types';

export async function GET() {
  try {
    const incidents = getIncidents();
    // Sort by timestamp descending
    const sorted = incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({ incidents: sorted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, location, contact, forceCreate } = body;

    if (!title || !description || !location) {
      return NextResponse.json({ error: 'Title, description, and location are required' }, { status: 400 });
    }

    // Run AI analysis
    const analysis = await analyzeIssue(title, description);

    // If not force creating, check for duplicates
    if (!forceCreate) {
      const duplicates = await detectDuplicates(title, description, location);
      if (duplicates.length > 0) {
        return NextResponse.json({
          status: 'awaiting_duplicate_check',
          analysis,
          potentialDuplicates: duplicates,
        });
      }
    }

    // Generate a new ID based on the highest existing ID
    const incidents = getIncidents();
    let maxIdNum = 1000;
    incidents.forEach((inc) => {
      const match = inc.id.match(/^INC-(\d+)$/);
      if (match) {
        const idNum = parseInt(match[1], 10);
        if (idNum > maxIdNum) {
          maxIdNum = idNum;
        }
      }
    });
    const newId = `INC-${maxIdNum + 1}`;

    const newIncident: Incident = {
      id: newId,
      title,
      description,
      location,
      contact: contact || 'Anonymous Student',
      category: analysis.category,
      priority: analysis.priority,
      routing: analysis.routing,
      status: 'REPORTED',
      parentIncidentId: null,
      timestamp: new Date().toISOString(),
      resolutionNotes: null,
      aiVerificationResult: null,
    };

    addIncident(newIncident);

    return NextResponse.json({
      status: 'created',
      incident: newIncident,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process report' }, { status: 500 });
  }
}

