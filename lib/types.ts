export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  contact: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  routing: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'FAILED_VERIFICATION' | 'DUPLICATE';
  parentIncidentId: string | null;
  timestamp: string;
  resolutionNotes: string | null;
  aiVerificationResult: AiVerification | null;
}

export interface AiAnalysis {
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  routing: string;
  confidence: number;
}

export interface AiVerification {
  verified: boolean;
  confidence: number;
  reason: string;
}

export interface RecurringInsightCluster {
  id: string;
  title: string;
  category: string;
  location: string;
  count: number;
  incidents: {
    id: string;
    title: string;
    timestamp: string;
  }[];
  recommendedAction: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

