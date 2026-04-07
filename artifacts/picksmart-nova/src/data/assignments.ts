export type VoiceMode = "training" | "production" | "ultra_fast";
export type AssignmentStatus = "pending" | "active" | "completed";
export type AssignmentType = "TRAINING" | "PRODUCTION";

export interface Assignment {
  id: string;
  assignmentNumber: string;
  selectorUserId: string;
  title: string;
  status: AssignmentStatus;
  type: AssignmentType;
  startAisle: number;
  endAisle: number;
  totalCases: number;
  totalCube: number;
  totalPallets: number;
  goalTimeMinutes: number;
  goalTimeSeconds: number;
  doorNumber: number;
  doorCode: string;
  printerNumber: number;
  alphaLabelNumber: number;
  bravoLabelNumber: number;
  voiceMode: VoiceMode;
  percentComplete: number;
  stops: number;
}

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "asgn-251735",
    assignmentNumber: "251735",
    selectorUserId: "user-001",
    title: "Assignment 251735",
    status: "pending",
    type: "TRAINING",
    startAisle: 13,
    endAisle: 32,
    totalCases: 217,
    totalCube: 248.6,
    totalPallets: 2,
    goalTimeMinutes: 110,
    goalTimeSeconds: 0,
    doorNumber: 340,
    doorCode: "581",
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "training",
    percentComplete: 0,
    stops: 38,
  },
  {
    id: "asgn-251736",
    assignmentNumber: "251736",
    selectorUserId: "user-002",
    title: "Assignment 251736",
    status: "pending",
    type: "TRAINING",
    startAisle: 17,
    endAisle: 34,
    totalCases: 224,
    totalCube: 210.0,
    totalPallets: 2,
    goalTimeMinutes: 110,
    goalTimeSeconds: 0,
    doorNumber: 355,
    doorCode: "641",
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "training",
    percentComplete: 0,
    stops: 24,
  },
  {
    id: "asgn-251737",
    assignmentNumber: "251737",
    selectorUserId: "user-003",
    title: "Assignment 251737",
    status: "pending",
    type: "TRAINING",
    startAisle: 13,
    endAisle: 34,
    totalCases: 259,
    totalCube: 198.4,
    totalPallets: 2,
    goalTimeMinutes: 110,
    goalTimeSeconds: 0,
    doorNumber: 370,
    doorCode: "714",
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "training",
    percentComplete: 0,
    stops: 28,
  },
  {
    id: "asgn-251738",
    assignmentNumber: "251738",
    selectorUserId: "user-001",
    title: "Assignment 251738",
    status: "pending",
    type: "PRODUCTION",
    startAisle: 13,
    endAisle: 32,
    totalCases: 260,
    totalCube: 201.2,
    totalPallets: 2,
    goalTimeMinutes: 110,
    goalTimeSeconds: 0,
    doorNumber: 340,
    doorCode: "581",
    printerNumber: 307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
    voiceMode: "production",
    percentComplete: 0,
    stops: 28,
  },
];
