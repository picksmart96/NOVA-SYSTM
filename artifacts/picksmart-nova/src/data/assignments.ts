export type VoiceMode = 'training' | 'production' | 'ultra_fast';
export type AssignmentStatus = 'pending' | 'active' | 'completed';

export interface Assignment {
  id: string;
  assignmentNumber: number;
  selectorUserId: string;
  title: string;
  status: AssignmentStatus;
  startAisle: number;
  endAisle: number;
  totalCases: number;
  totalCube: number;
  totalPallets: number;
  goalTimeMinutes: number;
  goalTimeSeconds: number;
  doorNumber: number;
  printerNumber: number;
  alphaLabelNumber: number;
  bravoLabelNumber: number;
  voiceMode: VoiceMode;
  percentComplete: number;
}

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "asgn-251735",
    assignmentNumber: 251735,
    selectorUserId: "user-1",
    title: "Main Floor — Aisles 1–15",
    status: "pending",
    startAisle: 1,
    endAisle: 15,
    totalCases: 285,
    totalCube: 312.4,
    totalPallets: 2,
    goalTimeMinutes: 110,
    goalTimeSeconds: 0,
    doorNumber: 12,
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "training",
    percentComplete: 0,
  },
  {
    id: "asgn-251736",
    assignmentNumber: 251736,
    selectorUserId: "user-1",
    title: "Frozen — Aisles 20–23",
    status: "pending",
    startAisle: 20,
    endAisle: 23,
    totalCases: 54,
    totalCube: 78.2,
    totalPallets: 1,
    goalTimeMinutes: 38,
    goalTimeSeconds: 0,
    doorNumber: 7,
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "production",
    percentComplete: 0,
  },
  {
    id: "asgn-251737",
    assignmentNumber: 251737,
    selectorUserId: "user-2",
    title: "Dairy — Aisles 18–19",
    status: "active",
    startAisle: 18,
    endAisle: 19,
    totalCases: 62,
    totalCube: 44.1,
    totalPallets: 1,
    goalTimeMinutes: 42,
    goalTimeSeconds: 0,
    doorNumber: 9,
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "production",
    percentComplete: 43,
  },
  {
    id: "asgn-251738",
    assignmentNumber: 251738,
    selectorUserId: "user-3",
    title: "Grocery — Aisles 5–11",
    status: "completed",
    startAisle: 5,
    endAisle: 11,
    totalCases: 198,
    totalCube: 231.0,
    totalPallets: 2,
    goalTimeMinutes: 85,
    goalTimeSeconds: 0,
    doorNumber: 15,
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "ultra_fast",
    percentComplete: 100,
  },
];
