import { NextResponse } from 'next/server';
import { getIncidents, addIncident, getIncidentById } from '@/lib/db';
import { Incident } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, location, contact, parentIncidentId } = body;

    if (!title || !description || !location || !parentIncidentId) {
      return NextResponse.json(
        { error: 'Title, description, location, and parentIncidentId are required' },
        { status: 400 }
      );
    }

    const parentIncident = getIncidentById(parentIncidentId);
    if (!parentIncident) {
      return NextResponse.json({ error: 'Parent incident not found' }, { status: 404 });
    }

    // Generate new ID
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

    const newDuplicateIncident: Incident = {
      id: newId,
      title,
      description,
      location,
      contact: contact || 'Anonymous Student',
      // Inherit classification and routing from parent incident to preserve operational context
      category: parentIncident.category,
      priority: parentIncident.priority,
      routing: parentIncident.routing,
      status: 'DUPLICATE',
      parentIncidentId: parentIncidentId,
      timestamp: new Date().toISOString(),
      resolutionNotes: null,
      aiVerificationResult: null,
    };

    addIncident(newDuplicateIncident);

    return NextResponse.json({
      status: 'linked',
      incident: newDuplicateIncident,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to link duplicate' }, { status: 500 });
  }
}

