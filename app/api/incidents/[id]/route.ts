import { NextResponse } from 'next/server';
import { getIncidentById, updateIncident } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const incident = getIncidentById(id);
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Only allow patching safe fields: status and parentIncidentId
    const allowedFields = ['status', 'parentIncidentId'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = updateIncident(id, updates as any);
    return NextResponse.json({ status: 'updated', incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update incident' }, { status: 500 });
  }
}
