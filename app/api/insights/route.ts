import { NextResponse } from 'next/server';
import { getIncidents } from '@/lib/db';
import { generateInsights } from '@/lib/aiService';

export async function GET() {
  try {
    const incidents = getIncidents();
    const insights = await generateInsights(incidents);
    return NextResponse.json({ insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate insights' }, { status: 500 });
  }
}

