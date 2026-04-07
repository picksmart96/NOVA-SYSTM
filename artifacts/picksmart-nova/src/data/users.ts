export type UserRole = 'selector' | 'trainer' | 'supervisor' | 'owner';

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  employeeId: string;
  avgRate: number;
  shiftsCompleted: number;
  currentAssignmentId?: string;
  currentAisle?: string;
  currentSlot?: string;
  nextAisle?: string;
  nextSlot?: string;
  elapsedMinutes?: number;
  dwellSeconds?: number;
  performancePercent?: number;
  paceStatus?: 'ahead' | 'on_pace' | 'behind' | 'idle';
  voiceMode?: string;
  isOnShift: boolean;
}

export const USERS: User[] = [
  {
    id: "user-1",
    name: "Marcus Thompson",
    initials: "MT",
    role: "selector",
    employeeId: "EMP-4471",
    avgRate: 108,
    shiftsCompleted: 47,
    currentAssignmentId: "asgn-251735",
    isOnShift: false,
    performancePercent: 0,
    paceStatus: "idle",
  },
  {
    id: "user-2",
    name: "Deja Roberts",
    initials: "DR",
    role: "selector",
    employeeId: "EMP-4498",
    avgRate: 94,
    shiftsCompleted: 22,
    currentAssignmentId: "asgn-251737",
    currentAisle: "19",
    currentSlot: "A01",
    nextAisle: "19",
    nextSlot: "A03",
    elapsedMinutes: 18,
    dwellSeconds: 42,
    performancePercent: 91,
    paceStatus: "behind",
    voiceMode: "production",
    isOnShift: true,
  },
  {
    id: "user-3",
    name: "Carlos Mendez",
    initials: "CM",
    role: "selector",
    employeeId: "EMP-4312",
    avgRate: 117,
    shiftsCompleted: 89,
    currentAssignmentId: "asgn-251738",
    currentAisle: "11",
    currentSlot: "A03",
    elapsedMinutes: 82,
    dwellSeconds: 15,
    performancePercent: 106,
    paceStatus: "ahead",
    voiceMode: "ultra_fast",
    isOnShift: true,
  },
  {
    id: "user-4",
    name: "Aaliyah Johnson",
    initials: "AJ",
    role: "selector",
    employeeId: "EMP-4558",
    avgRate: 88,
    shiftsCompleted: 8,
    isOnShift: false,
    performancePercent: 0,
    paceStatus: "idle",
  },
  {
    id: "user-5",
    name: "James Rivera",
    initials: "JR",
    role: "selector",
    employeeId: "EMP-4401",
    avgRate: 102,
    shiftsCompleted: 63,
    currentAisle: "7",
    currentSlot: "B02",
    nextAisle: "7",
    nextSlot: "B05",
    elapsedMinutes: 44,
    dwellSeconds: 28,
    performancePercent: 100,
    paceStatus: "on_pace",
    voiceMode: "production",
    isOnShift: true,
  },
  {
    id: "user-6",
    name: "Tonya Williams",
    initials: "TW",
    role: "trainer",
    employeeId: "EMP-3891",
    avgRate: 122,
    shiftsCompleted: 201,
    isOnShift: true,
    performancePercent: 0,
    paceStatus: "idle",
  },
  {
    id: "user-7",
    name: "Ray Chen",
    initials: "RC",
    role: "supervisor",
    employeeId: "EMP-2241",
    avgRate: 0,
    shiftsCompleted: 0,
    isOnShift: true,
    performancePercent: 0,
    paceStatus: "idle",
  },
  {
    id: "user-8",
    name: "Admin User",
    initials: "AU",
    role: "owner",
    employeeId: "EMP-0001",
    avgRate: 0,
    shiftsCompleted: 0,
    isOnShift: true,
    performancePercent: 0,
    paceStatus: "idle",
  },
];

export function getUserById(id: string): User | undefined {
  return USERS.find(u => u.id === id);
}

export function getActiveSelectors(): User[] {
  return USERS.filter(u => u.role === 'selector' && u.isOnShift);
}
