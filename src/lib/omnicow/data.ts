// Deterministic mock dataset for OmniCow — emulates the Neo4j graph feature
// snapshot (neo4j_graph_features.csv + omnicow_features.csv).

export type Priority = "urgent" | "watch" | "low";
export type WindowKind = "Day 7" | "Day 90" | "Day 120";
export type Outcome = "adopted" | "not_adopted" | "pending";

export interface InterventionRecord {
  topic: string;
  date: string;
  day7: Outcome;
  day90: Outcome;
  day120: Outcome;
}

export interface Farmer {
  id: string;
  ward: string;
  subCounty: string;
  county: string;
  cluster: number;
  priority: Priority;
  day7: number;
  day90: number;
  day120: number;
  window: { kind: WindowKind; daysRemaining: number };
  shap: string;
  // demographics
  gender: "Female" | "Male";
  age: number;
  ageGroup: string;
  registration: "mobile_app" | "ussd" | "field_agent" | "cooperative";
  cooperative: string;
  lastContact: string;
  firstTraining: string;
  trainers: string[];
  topics: string[];
  history: InterventionRecord[];
  // graph features
  pageRank: number;
  peerAdoptionRatio: number;
  influence: number;
  communitySize: number;
  momentum: "rising" | "falling";
  adopted: boolean;
  lat: number;
  lng: number;
  shapFeatures: { feature: string; impact: number }[];
}

export const CLUSTER_COLORS = [
  "#1A6E42",
  "#D4873A",
  "#3B6FB0",
  "#9B59B6",
  "#C0392B",
  "#16A085",
];

const WARDS = [
  "Githunguri",
  "Ikinu",
  "Komothai",
  "Ngewa",
  "Kanjai",
  "Ndarugo",
  "Tinganga",
];
const COOPS = ["Githunguri DFCS", "Limuru DFCS", "Independent", "Ndumberi DFCS"];
const TOPICS = [
  "Milk hygiene",
  "Feed rationing",
  "Mastitis control",
  "Calf rearing",
  "Record keeping",
  "Artificial insemination",
];
const TRAINERS = ["J. Mwangi", "A. Wanjiru", "P. Otieno", "S. Kamau"];
const REGISTRATIONS: Farmer["registration"][] = [
  "mobile_app",
  "ussd",
  "field_agent",
  "cooperative",
];

// Mulberry32 deterministic PRNG.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

const SHAP_TEMPLATES = [
  (c: number) =>
    `${4 + (c % 4)} of 8 neighbours in cluster ${c} adopted milk-hygiene last month. Day 7 window closes tomorrow.`,
  (c: number) =>
    `High PageRank within cluster ${c}; adopting peers nearby raise this farmer's likelihood sharply.`,
  () =>
    `Registered via mobile app and attended 3 trainings — both strong positive adoption signals.`,
  (c: number) =>
    `Cluster ${c} momentum is rising; influence score above ward median pushes the Day 90 score up.`,
  () =>
    `No contact in 38 days and low recent peer adoption — score trending down, intervene soon.`,
];

function buildFarmer(i: number): Farmer {
  const r = rng(1000 + i * 97);
  const cluster = Math.floor(r() * 6);
  const ward = WARDS[(i + cluster) % WARDS.length];
  const day7 = Math.round((0.12 + r() * 0.85) * 100) / 100;
  const day90 = Math.max(0.05, Math.min(0.98, day7 + (r() - 0.4) * 0.25));
  const day120 = Math.max(0.05, Math.min(0.98, day90 + (r() - 0.45) * 0.2));
  const priority: Priority =
    day7 >= 0.3 && day7 <= 0.85 ? "urgent" : day7 < 0.3 ? "watch" : "low";
  const windowKinds: WindowKind[] = ["Day 7", "Day 90", "Day 120"];
  const kind = pick(r, windowKinds);
  const daysRemaining = Math.floor(r() * 6);
  const age = 24 + Math.floor(r() * 45);
  const ageGroup = age < 35 ? "18–34" : age < 50 ? "35–49" : "50+";
  const peerAdoptionRatio = Math.round(r() * 100) / 100;
  const id = `DC-${(40000 + i * 7).toString().slice(0, 5)}`;

  const topics = TOPICS.filter(() => r() > 0.55).slice(0, 3);
  if (topics.length === 0) topics.push(pick(r, TOPICS));

  const history: InterventionRecord[] = topics.map((topic, k) => {
    const out = (): Outcome => {
      const v = r();
      return v > 0.6 ? "adopted" : v > 0.35 ? "pending" : "not_adopted";
    };
    return {
      topic,
      date: `2024-0${1 + ((i + k) % 8)}-${10 + ((i + k) % 18)}`,
      day7: out(),
      day90: out(),
      day120: out(),
    };
  });

  const shapFeatures = [
    { feature: "Peer adoption ratio", impact: Math.round((r() - 0.3) * 40) },
    { feature: "Cluster momentum", impact: Math.round((r() - 0.35) * 30) },
    { feature: "PageRank", impact: Math.round((r() - 0.4) * 25) },
    { feature: "Trainings attended", impact: Math.round((r() - 0.3) * 22) },
    { feature: "Days since contact", impact: Math.round((r() - 0.6) * 28) },
    { feature: "Registration method", impact: Math.round((r() - 0.45) * 18) },
    { feature: "Cooperative member", impact: Math.round((r() - 0.5) * 14) },
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    id,
    ward,
    subCounty: "Githunguri",
    county: "Kiambu",
    cluster,
    priority,
    day7,
    day90,
    day120,
    window: { kind, daysRemaining },
    shap: pick(r, SHAP_TEMPLATES)(cluster),
    gender: r() > 0.45 ? "Female" : "Male",
    age,
    ageGroup,
    registration: pick(r, REGISTRATIONS),
    cooperative: pick(r, COOPS),
    lastContact: `2024-0${1 + (i % 8)}-${5 + (i % 22)}`,
    firstTraining: `2023-1${i % 2}-${5 + (i % 20)}`,
    trainers: [pick(r, TRAINERS)],
    topics,
    history,
    pageRank: Math.round(r() * 100) / 100,
    peerAdoptionRatio,
    influence: Math.round(r() * 100) / 100,
    communitySize: 18 + Math.floor(r() * 60),
    momentum: r() > 0.4 ? "rising" : "falling",
    adopted: r() > 0.45,
    lat: -1.06 + (r() - 0.5) * 0.12,
    lng: 36.77 + (r() - 0.5) * 0.12,
    shapFeatures,
  };
}

export const FARMERS: Farmer[] = Array.from({ length: 60 }, (_, i) =>
  buildFarmer(i),
);

export function priorityCounts() {
  return {
    all: FARMERS.length,
    urgent: FARMERS.filter((f) => f.priority === "urgent").length,
    watch: FARMERS.filter((f) => f.priority === "watch").length,
    low: FARMERS.filter((f) => f.priority === "low").length,
  };
}

export const CLUSTERS = Array.from(new Set(FARMERS.map((f) => f.cluster))).sort();

export function scoreColorVar(score: number): string {
  if (score >= 0.6) return "var(--safe)";
  if (score >= 0.3) return "var(--watch)";
  return "var(--urgent)";
}

export function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

export const SYNC_TIMESTAMP = "Today, 06:42";

// Adoption-trend monthly series.
export const TREND_MONTHS = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
];

export function trendSeries() {
  return TREND_MONTHS.map((m, i) => ({
    month: m,
    day7: 30 + i * 3 + ((i * 7) % 9),
    day90: 22 + i * 2.5 + ((i * 5) % 7),
    day120: 16 + i * 2 + ((i * 3) % 6),
  }));
}

export const AGENTS = [
  { name: "Kazi Mwende", farmers: 60, day7: 64, day90: 51, adoptions: 38 },
  { name: "John Mwangi", farmers: 52, day7: 58, day90: 47, adoptions: 29 },
  { name: "Aisha Wanjiru", farmers: 47, day7: 71, day90: 60, adoptions: 41 },
  { name: "Peter Otieno", farmers: 39, day7: 49, day90: 38, adoptions: 22 },
];
