import fs from 'fs';
import path from 'path';
import { Incident } from './types';

const DB_DIR = path.resolve('data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to ensure database is initialized
export function initDb(): Incident[] {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const sampleIncidents: Incident[] = [
      {
        id: 'INC-1001',
        title: 'Broken lock on North Dorm main entrance',
        description: 'The keycard reader and door lock at the front entrance of North Dormitory are not latching. Anyone can push the door open without scanning their student ID card. This is a major safety concern at night.',
        location: 'North Residence Hall',
        contact: 'sarah.jones@campus.edu',
        category: 'Safety & Security',
        priority: 'Urgent',
        routing: 'Campus Police / Safety',
        status: 'REPORTED',
        parentIncidentId: null,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        resolutionNotes: null,
        aiVerificationResult: null,
      },
      {
        id: 'INC-1002',
        title: 'Water leaking from ceiling in Library Room 304',
        description: 'There is water dripping steadily from a ceiling tile in the corner of Room 304 in the main library. It is staining the carpet and might damage the books nearby if it gets worse.',
        location: 'Main Library',
        contact: 'Anonymous Student',
        category: 'Facilities',
        priority: 'High',
        routing: 'Facilities Management',
        status: 'INVESTIGATING',
        parentIncidentId: null,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        resolutionNotes: null,
        aiVerificationResult: null,
      },
      {
        id: 'INC-1003',
        title: 'Wi-Fi connectivity dropouts in Student Union dining area',
        description: 'Students are unable to connect to the campus Wi-Fi network in the main dining hall. It keeps authenticating and then dropping connection immediately. Extremely slow when connected.',
        location: 'Student Union',
        contact: 'Anonymous Student',
        category: 'IT & Tech',
        priority: 'Medium',
        routing: 'IT Help Desk',
        status: 'VERIFIED',
        parentIncidentId: null,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        resolutionNotes: 'Rebooted the secondary wireless access point AP-Dining-02 located on the central pillar. Monitored load for 2 hours, connection stability returned to normal.',
        aiVerificationResult: {
          verified: true,
          confidence: 0.98,
          reason: 'The resolution notes explicitly state rebooting the specific access point in the dining area and verifying returned network stability, which directly addresses the Wi-Fi dropouts reported.',
        },
      },
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(sampleIncidents, null, 2), 'utf-8');
    return sampleIncidents;
  }

  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading database file, returning empty array', error);
    return [];
  }
}

export function getIncidents(): Incident[] {
  return initDb();
}

export function getIncidentById(id: string): Incident | undefined {
  const incidents = getIncidents();
  return incidents.find((incident) => incident.id === id);
}

export function saveIncidents(incidents: Incident[]): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(incidents, null, 2), 'utf-8');
}

export function addIncident(incident: Incident): Incident {
  const incidents = getIncidents();
  incidents.push(incident);
  saveIncidents(incidents);
  return incident;
}

export function updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
  const incidents = getIncidents();
  const index = incidents.findIndex((inc) => inc.id === id);
  if (index === -1) return undefined;

  const updatedIncident = {
    ...incidents[index],
    ...updates,
  };
  incidents[index] = updatedIncident;
  saveIncidents(incidents);
  return updatedIncident;
}

