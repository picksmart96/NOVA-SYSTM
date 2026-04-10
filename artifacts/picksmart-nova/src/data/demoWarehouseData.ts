export interface DemoSelector {
  id: string;
  userId: string;
  fullName: string;
  novaId: string;
  role: "selector" | "trainer" | "supervisor";
  level: string;
  novaActive: boolean;
  rate: number | null;
  accuracy: number | null;
  modulesCompleted: number;
  trainingProgress: number;
  streak: number;
  status: "active" | "inactive";
}

export const DEMO_SELECTORS: DemoSelector[] = [
  { id: "demo-user-001", userId: "demo-user-001", fullName: "Marcus Hill",    novaId: "NOVA-40111", role: "selector",    level: "Pro Selector",   novaActive: true,  rate: 108, accuracy: 99, modulesCompleted: 6, trainingProgress: 100, streak: 12, status: "active" },
  { id: "demo-user-002", userId: "demo-user-002", fullName: "Tasha Green",    novaId: "NOVA-40112", role: "selector",    level: "Intermediate",   novaActive: true,  rate: 101, accuracy: 98, modulesCompleted: 5, trainingProgress: 86,  streak: 8,  status: "active" },
  { id: "demo-user-003", userId: "demo-user-003", fullName: "Andre Lewis",    novaId: "NOVA-40113", role: "selector",    level: "Beginner",       novaActive: false, rate: 84,  accuracy: 95, modulesCompleted: 3, trainingProgress: 52,  streak: 2,  status: "active" },
  { id: "demo-user-004", userId: "demo-user-004", fullName: "Jasmine Cole",   novaId: "NOVA-40114", role: "selector",    level: "Intermediate",   novaActive: true,  rate: 97,  accuracy: 97, modulesCompleted: 4, trainingProgress: 71,  streak: 5,  status: "active" },
  { id: "demo-user-007", userId: "demo-user-007", fullName: "Derrick Owens",  novaId: "NOVA-40117", role: "selector",    level: "Advanced",       novaActive: true,  rate: 104, accuracy: 98, modulesCompleted: 5, trainingProgress: 91,  streak: 9,  status: "active" },
  { id: "demo-user-008", userId: "demo-user-008", fullName: "Keisha Brown",   novaId: "NOVA-40118", role: "selector",    level: "Intermediate",   novaActive: false, rate: 91,  accuracy: 96, modulesCompleted: 4, trainingProgress: 68,  streak: 3,  status: "active" },
  { id: "demo-user-009", userId: "demo-user-009", fullName: "Miguel Torres",  novaId: "NOVA-40119", role: "selector",    level: "Beginner",       novaActive: false, rate: 78,  accuracy: 93, modulesCompleted: 2, trainingProgress: 34,  streak: 1,  status: "active" },
  { id: "demo-user-010", userId: "demo-user-010", fullName: "Shaniqua Davis", novaId: "NOVA-40120", role: "selector",    level: "Pro Selector",   novaActive: true,  rate: 112, accuracy: 99, modulesCompleted: 6, trainingProgress: 100, streak: 15, status: "active" },
  { id: "demo-user-011", userId: "demo-user-011", fullName: "Ricky Wallace",  novaId: "NOVA-40121", role: "selector",    level: "Intermediate",   novaActive: true,  rate: 95,  accuracy: 97, modulesCompleted: 4, trainingProgress: 73,  streak: 4,  status: "active" },
  { id: "demo-user-012", userId: "demo-user-012", fullName: "Nadia Flores",   novaId: "NOVA-40122", role: "selector",    level: "Beginner",       novaActive: false, rate: 82,  accuracy: 94, modulesCompleted: 3, trainingProgress: 48,  streak: 0,  status: "inactive" },
  { id: "demo-user-005", userId: "demo-user-005", fullName: "David Price",    novaId: "NOVA-40115", role: "trainer",     level: "Trainer",        novaActive: false, rate: null, accuracy: null, modulesCompleted: 6, trainingProgress: 100, streak: 0, status: "active" },
  { id: "demo-user-006", userId: "demo-user-006", fullName: "Sonia Ramirez",  novaId: "NOVA-40116", role: "supervisor",  level: "Supervisor",     novaActive: false, rate: null, accuracy: null, modulesCompleted: 6, trainingProgress: 100, streak: 0, status: "active" },
];

export const DEMO_SELECTORS_ONLY = DEMO_SELECTORS.filter((s) => s.role === "selector");

export interface DemoAssignment {
  id: string;
  assignmentNumber: string;
  selectorUserId: string;
  selectorName: string;
  type: "TRAINING" | "PRODUCTION";
  totalCases: number;
  startAisle: number;
  endAisle: number;
  pallets: number;
  goalTimeMinutes: number;
  stops: number;
  doorNumber: number;
  doorCode: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETE";
}

export const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  { id: "demo-251736", assignmentNumber: "251736", selectorUserId: "demo-user-001", selectorName: "Marcus Hill",   type: "TRAINING",    totalCases: 224, startAisle: 17, endAisle: 34, pallets: 2, goalTimeMinutes: 110, stops: 24, doorNumber: 355, doorCode: "641", status: "IN_PROGRESS" },
  { id: "demo-251737", assignmentNumber: "251737", selectorUserId: "demo-user-002", selectorName: "Tasha Green",   type: "TRAINING",    totalCases: 259, startAisle: 13, endAisle: 34, pallets: 2, goalTimeMinutes: 110, stops: 28, doorNumber: 370, doorCode: "714", status: "OPEN" },
  { id: "demo-251738", assignmentNumber: "251738", selectorUserId: "demo-user-004", selectorName: "Jasmine Cole",  type: "PRODUCTION",  totalCases: 260, startAisle: 13, endAisle: 32, pallets: 2, goalTimeMinutes: 110, stops: 28, doorNumber: 340, doorCode: "581", status: "OPEN" },
  { id: "demo-251739", assignmentNumber: "251739", selectorUserId: "demo-user-007", selectorName: "Derrick Owens", type: "PRODUCTION",  totalCases: 298, startAisle: 9,  endAisle: 28, pallets: 3, goalTimeMinutes: 120, stops: 32, doorNumber: 325, doorCode: "492", status: "IN_PROGRESS" },
  { id: "demo-251740", assignmentNumber: "251740", selectorUserId: "demo-user-010", selectorName: "Shaniqua Davis",type: "PRODUCTION",  totalCases: 312, startAisle: 5,  endAisle: 24, pallets: 3, goalTimeMinutes: 115, stops: 35, doorNumber: 310, doorCode: "837", status: "IN_PROGRESS" },
];

export const DEMO_LEADERBOARD = [
  { rank: 1,  name: "Shaniqua Davis", novaId: "NOVA-40120", rate: 112, accuracy: 99, streak: 15, level: "Pro Selector" },
  { rank: 2,  name: "Marcus Hill",    novaId: "NOVA-40111", rate: 108, accuracy: 99, streak: 12, level: "Pro Selector" },
  { rank: 3,  name: "Derrick Owens",  novaId: "NOVA-40117", rate: 104, accuracy: 98, streak: 9,  level: "Advanced" },
  { rank: 4,  name: "Tasha Green",    novaId: "NOVA-40112", rate: 101, accuracy: 98, streak: 8,  level: "Intermediate" },
  { rank: 5,  name: "Jasmine Cole",   novaId: "NOVA-40114", rate: 97,  accuracy: 97, streak: 5,  level: "Intermediate" },
  { rank: 6,  name: "Ricky Wallace",  novaId: "NOVA-40121", rate: 95,  accuracy: 97, streak: 4,  level: "Intermediate" },
  { rank: 7,  name: "Keisha Brown",   novaId: "NOVA-40118", rate: 91,  accuracy: 96, streak: 3,  level: "Intermediate" },
  { rank: 8,  name: "Andre Lewis",    novaId: "NOVA-40113", rate: 84,  accuracy: 95, streak: 2,  level: "Beginner" },
  { rank: 9,  name: "Nadia Flores",   novaId: "NOVA-40122", rate: 82,  accuracy: 94, streak: 0,  level: "Beginner" },
  { rank: 10, name: "Miguel Torres",  novaId: "NOVA-40119", rate: 78,  accuracy: 93, streak: 1,  level: "Beginner" },
];

export const DEMO_ACTIVITY = [
  { id: 1, type: "session",      text: "Shaniqua Davis completed a live NOVA session at 112% pace.",           time: "2 min ago" },
  { id: 2, type: "module",       text: "Marcus Hill finished Module 6 — ES3 Advanced Techniques.",             time: "14 min ago" },
  { id: 3, type: "improvement",  text: "Tasha Green improved accuracy from 95% → 98% over 3 sessions.",       time: "31 min ago" },
  { id: 4, type: "cert",         text: "Jasmine Cole earned Pallet Building Certification.",                   time: "1 hr ago" },
  { id: 5, type: "note",         text: "Trainer David Price added coaching note for Andre Lewis (aisle pacing).", time: "2 hr ago" },
  { id: 6, type: "session",      text: "Derrick Owens completed Assignment 251739 — 298 cases in 118 min.",   time: "3 hr ago" },
  { id: 7, type: "module",       text: "Ricky Wallace started Module 5 — Speed & Accuracy.",                  time: "4 hr ago" },
  { id: 8, type: "improvement",  text: "Keisha Brown rate improved from 87% → 91% this week.",                time: "5 hr ago" },
];

export const DEMO_SESSIONS = [
  { id: 1, selector: "Marcus Hill",    novaId: "NOVA-40111", assignment: "251736", cases: 224, rate: 108, accuracy: 99, duration: "1h 48m", date: "Today 6:14 AM",     notes: "Strong start. Consistent pace all morning." },
  { id: 2, selector: "Shaniqua Davis", novaId: "NOVA-40120", assignment: "251740", cases: 312, rate: 112, accuracy: 99, duration: "2h 01m", date: "Today 5:52 AM",     notes: "Best session this week." },
  { id: 3, selector: "Tasha Green",    novaId: "NOVA-40112", assignment: "251737", cases: 259, rate: 101, accuracy: 98, duration: "1h 53m", date: "Today 5:30 AM",     notes: "Solid. Remind about alpha label timing." },
  { id: 4, selector: "Derrick Owens",  novaId: "NOVA-40117", assignment: "251739", cases: 298, rate: 104, accuracy: 98, duration: "1h 57m", date: "Yesterday 6:02 AM", notes: "Good speed on east aisles." },
  { id: 5, selector: "Jasmine Cole",   novaId: "NOVA-40114", assignment: "251738", cases: 260, rate: 97,  accuracy: 97, duration: "2h 04m", date: "Yesterday 5:45 AM", notes: "Review pallet build at high case count." },
];

export const DEMO_STATS = {
  totalUsers: 24,
  activeSelectors: 9,
  activeNOVA: 4,
  sessionsToday: 17,
  passRate: 91,
  avgRate: 98,
  openAssignments: 5,
  trainers: 3,
};
