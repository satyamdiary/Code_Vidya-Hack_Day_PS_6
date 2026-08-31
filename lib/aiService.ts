import { Incident, AiAnalysis, AiVerification, RecurringInsightCluster } from './types';
import { getIncidents } from './db';

// Helper to remove stopwords and get lowercase words
function cleanWords(text: string): Set<string> {
  const stopwords = new Set(['the', 'is', 'a', 'and', 'of', 'in', 'to', 'for', 'on', 'at', 'with', 'this', 'that', 'it', 'are', 'was', 'were', 'be', 'an', 'as']);
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  return new Set(words);
}

// Simple Jaccard similarity between two sets of words
function calculateSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return intersectionSize / unionSize;
}

export async function analyzeIssue(title: string, description: string): Promise<AiAnalysis> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const textToAnalyze = `${title} ${description}`.toLowerCase();

  // 1. Determine Category
  let category = 'Other';
  if (/\b(leak|pipe|toilet|dripping|water|ceiling|plumbing|faucet|sink|elevator|stuck|escalator|ac|heating|hvac|window|light|bulb|carpet|tiles|roof|trash|janitor|maintenance)\b/.test(textToAnalyze)) {
    category = 'Facilities';
  } else if (/\b(wifi|wi-fi|internet|network|ethernet|login|password|projector|canvas|portal|email|printer|printing|server|computer|software|hdmi)\b/.test(textToAnalyze)) {
    category = 'IT & Tech';
  } else if (/\b(lock|door|badge|keycard|swipe|police|security|safety|theft|stolen|broken|suspicious|stranger|trespass|fight|assault|harass|fire|smoke|hazard)\b/.test(textToAnalyze)) {
    category = 'Safety & Security';
  } else if (/\b(food|dining|meal|cafeteria|lunch|breakfast|dinner|kitchen|allergy|vegan|halal|catering|plates|bugs|hygiene)\b/.test(textToAnalyze)) {
    category = 'Dining Services';
  } else if (/\b(class|professor|syllabus|grade|exam|test|lecture|transcript|schedule|curriculum|course|advisor|registration|enroll)\b/.test(textToAnalyze)) {
    category = 'Academic';
  } else if (/\b(parking|fee|billing|tuition|registrar|shuttle|bus|permit|id card|card office)\b/.test(textToAnalyze)) {
    category = 'Administrative';
  }

  // 2. Determine Routing
  let routing = 'Student Affairs / Operations';
  switch (category) {
    case 'Facilities':
      routing = 'Facilities Management';
      break;
    case 'IT & Tech':
      routing = 'IT Help Desk';
      break;
    case 'Safety & Security':
      routing = 'Campus Police / Safety';
      break;
    case 'Dining Services':
      routing = 'Dining Services Division';
      break;
    case 'Academic':
      routing = 'Academic Affairs Office';
      break;
    case 'Administrative':
      routing = 'Registrar & Student Financials';
      break;
  }

  // 3. Determine Priority
  let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
  if (/\b(fire|smoke|emergency|gas|weapon|gun|knife|danger|hazard|threat|safety|trespass|stolen|theft|assault|police|trapped|stuck|flood|bleeding|injury)\b/.test(textToAnalyze)) {
    priority = 'Urgent';
  } else if (/\b(leak|dripping|lock|door|broken window|no power|no water|exam|test|disabled|unable to access|major|critical)\b/.test(textToAnalyze)) {
    priority = 'High';
  } else if (/\b(slow|wifi|internet|light bulb|bulb|dirty|mess|trash|stain|register|advisor|shuttle|bus|fee)\b/.test(textToAnalyze)) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  return {
    category,
    priority,
    routing,
    confidence: 0.85 + Math.random() * 0.14, // 0.85 to 0.99
  };
}

export async function detectDuplicates(title: string, description: string, location: string): Promise<Incident[]> {
  const incidents = getIncidents();
  // Only look at active (unresolved) incidents for duplicate detection
  const activeIncidents = incidents.filter(
    (inc) => inc.status !== 'RESOLVED' && inc.status !== 'VERIFIED' && inc.status !== 'DUPLICATE'
  );

  const newWords = cleanWords(`${title} ${description}`);
  const duplicateMatches: Incident[] = [];

  for (const inc of activeIncidents) {
    const incWords = cleanWords(`${inc.title} ${inc.description}`);
    const similarity = calculateSimilarity(newWords, incWords);

    const sameLocation =
      location.toLowerCase().includes(inc.location.toLowerCase()) ||
      inc.location.toLowerCase().includes(location.toLowerCase());

    // Matches if either:
    // 1. Location matches AND similarity > 0.15 (shares some descriptive keywords)
    // 2. High keyword similarity overall (Jaccard > 0.35)
    if ((sameLocation && similarity >= 0.12) || similarity >= 0.35) {
      duplicateMatches.push(inc);
    }
  }

  // Return sorted by timestamp (most recent first)
  return duplicateMatches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function verifyResolution(incident: Incident, evidence: string): Promise<AiVerification> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cleanEvidence = evidence.trim().toLowerCase();

  // Basic check for empty or lazy responses
  if (cleanEvidence.length < 12 || /\b(done|fixed|resolved|nothing|did nothing|none|n\/a|ok|yes)\b/.test(cleanEvidence) && cleanEvidence.split(/\s+/).length < 4) {
    return {
      verified: false,
      confidence: 0.9,
      reason: 'The resolution evidence provided is too brief or lacks description. Please provide detailed notes of the action taken (e.g., equipment replaced, tests performed) to verify resolution.',
    };
  }

  const incidentText = `${incident.title} ${incident.description}`.toLowerCase();

  // Heuristic verification checks based on keywords matching the problem type
  let isMatchesProblem = false;
  let reason = '';

  if (/\b(wifi|wi-fi|internet|network|ethernet|connection)\b/.test(incidentText)) {
    if (/\b(reboot|restart|router|access point|ap|switch|cable|network|reset|configured|replaced|patch|dhcp|signal)\b/.test(cleanEvidence)) {
      isMatchesProblem = true;
      reason = 'AI verification successful: The evidence mentions network-related troubleshooting terms (rebooting/reconfiguring router or access points) corresponding to the reported connectivity outage.';
    } else {
      reason = 'AI verification warning: The reported issue is Wi-Fi connectivity, but the resolution evidence does not mention network equipment, reboots, or signal tests.';
    }
  } else if (/\b(leak|water|dripping|pipe|plumbing|faucet|sink|ceiling)\b/.test(incidentText)) {
    if (/\b(pipe|leak|plumber|fixed|sealed|tightened|replaced|dry|valve|repaired|ceiling tile|bucket)\b/.test(cleanEvidence)) {
      isMatchesProblem = true;
      reason = 'AI verification successful: The evidence mentions fixing leaks, sealing pipes, replacing valves or cleaning up water, which directly addresses the reported plumbing issue.';
    } else {
      reason = 'AI verification warning: The reported issue is a water leak, but the evidence does not state that the source of the water was stopped, the pipe was repaired, or the area was dried.';
    }
  } else if (/\b(lock|door|badge|keycard|swipe|handle)\b/.test(incidentText)) {
    if (/\b(lock|latch|screws|tightened|replaced|keycard|reader|harness|solenoid|fixed|door|key)\b/.test(cleanEvidence)) {
      isMatchesProblem = true;
      reason = 'AI verification successful: The evidence details servicing the door hardware (screws, latch, keycard reader, or replacing parts), aligning with the access/security issue reported.';
    } else {
      reason = 'AI verification warning: The reported issue is a broken door or lock mechanism, but the evidence does not confirm that the hardware was adjusted, replaced, or tested for latching.';
    }
  } else {
    // General match
    if (/\b(fixed|repaired|replaced|resolved|cleaned|serviced|installed|adjusted|operational|tested)\b/.test(cleanEvidence)) {
      isMatchesProblem = true;
      reason = 'AI verification successful: The description of work contains action verbs indicating repair, replacement, or testing which supports a resolved status.';
    } else {
      reason = 'AI verification warning: The evidence contains vague statements. Please detail the actions taken to repair or clean the item.';
    }
  }

  // If there's general positive action words, but didn't pass specific category check,
  // we can still verify with slightly lower confidence if evidence is detailed (long length)
  if (!isMatchesProblem && cleanEvidence.length > 50 && /\b(fixed|repaired|done|resolved|replaced|sorted)\b/.test(cleanEvidence)) {
    return {
      verified: true,
      confidence: 0.75,
      reason: 'AI verification warning: The resolution details appear to confirm completion of work, but the terminology does not strongly correlate with the specific problem. Accepted with low confidence.',
    };
  }

  return {
    verified: isMatchesProblem,
    confidence: isMatchesProblem ? 0.88 + Math.random() * 0.1 : 0.85 + Math.random() * 0.1,
    reason: reason,
  };
}

export async function generateInsights(incidents: Incident[]): Promise<RecurringInsightCluster[]> {
  // Aggregate incidents by Category + Location to detect clusters of recurring issues
  const clustersMap: { [key: string]: Incident[] } = {};

  incidents.forEach((inc) => {
    // Ignore duplicates as standalone items since they are already linked,
    // but aggregate them together under the parent's cluster if parent is in it
    if (inc.status === 'DUPLICATE') return;

    const key = `${inc.category}::${inc.location}`.toLowerCase();
    if (!clustersMap[key]) {
      clustersMap[key] = [];
    }
    clustersMap[key].push(inc);
  });

  const insights: RecurringInsightCluster[] = [];
  let clusterId = 1;

  for (const [key, clusterIncidents] of Object.entries(clustersMap)) {
    // A cluster is identified if there are at least 2 distinct incidents in the same category & location
    if (clusterIncidents.length < 2) continue;

    const [category, locationRaw] = key.split('::');
    // Format location name nicely
    const location = clusterIncidents[0].location;

    // Determine highest priority in cluster
    let highestPriority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Low';
    const priorityWeight = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
    clusterIncidents.forEach((inc) => {
      if (priorityWeight[inc.priority] > priorityWeight[highestPriority]) {
        highestPriority = inc.priority;
      }
    });

    // Count including duplicates
    let totalIncidentCount = clusterIncidents.length;
    // Find how many duplicates are linked to incidents in this cluster
    clusterIncidents.forEach((inc) => {
      const duplicatesCount = incidents.filter((x) => x.parentIncidentId === inc.id).length;
      totalIncidentCount += duplicatesCount;
    });

    // Title for the cluster
    const capitalizedCategory = clusterIncidents[0].category;
    const title = `Recurring ${capitalizedCategory} issues at ${location}`;

    // Recommend actions based on category
    let recommendedAction = 'Conduct routine check and gather feedback from occupants.';
    if (capitalizedCategory === 'Facilities') {
      recommendedAction = `Schedule a comprehensive structural and maintenance inspection of all pipes, lighting fixtures, and plumbing infrastructure at ${location} to identify underlying systemic wear.`;
    } else if (capitalizedCategory === 'IT & Tech') {
      recommendedAction = `Deploy IT diagnostics to assess network router loads, wireless channel interference, and outdated access point hardware at ${location} to improve bandwidth reliability.`;
    } else if (capitalizedCategory === 'Safety & Security') {
      recommendedAction = `Recommend adding auxiliary safety lighting, upgrading physical locks, or increasing safety patrol frequencies around ${location} during night hours.`;
    } else if (capitalizedCategory === 'Dining Services') {
      recommendedAction = `Initiate a food quality and service review at the ${location} kitchens, updating staff hygiene checklists and allergen safety notices.`;
    } else if (capitalizedCategory === 'Academic') {
      recommendedAction = `Liaise with department coordinators at ${location} to evaluate student registrar feedback on course schedules or class sizes.`;
    }

    insights.push({
      id: `CLU-${100 + clusterId}`,
      title,
      category: capitalizedCategory,
      location,
      count: totalIncidentCount,
      incidents: clusterIncidents.map((inc) => ({
        id: inc.id,
        title: inc.title,
        timestamp: inc.timestamp,
      })),
      recommendedAction,
      priority: highestPriority,
    });

    clusterId++;
  }

  // Sort by count (highest frequency first)
  return insights.sort((a, b) => b.count - a.count);
}

