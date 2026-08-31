import { NextResponse } from 'next/server';
import { getIncidentById, updateIncident } from '@/lib/db';
import { verifyResolution } from '@/lib/aiService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resolutionNotes } = body;

    if (!resolutionNotes || resolutionNotes.trim() === '') {
      return NextResponse.json({ error: 'Resolution notes are required' }, { status: 400 });
    }

    const incident = getIncidentById(id);
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Run AI verification on the submitted notes
    const verificationResult = await verifyResolution(incident, resolutionNotes);

    const updatedIncident = updateIncident(id, {
      status: verificationResult.verified ? 'VERIFIED' : 'FAILED_VERIFICATION',
      resolutionNotes,
      aiVerificationResult: verificationResult,
    });

    return NextResponse.json({
      status: 'resolved',
      incident: updatedIncident,
      verificationResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resolve incident' }, { status: 500 });
  }
}

