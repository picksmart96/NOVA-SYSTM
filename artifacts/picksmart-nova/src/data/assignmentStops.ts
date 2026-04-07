export type StopStatus = 'pending' | 'picked';

export interface AssignmentStop {
  id: string;
  assignmentId: string;
  aisle: string;
  slot: string;
  level: string;
  checkCode: string;
  qty: number;
  status: StopStatus;
}

export const ASSIGNMENT_STOPS: AssignmentStop[] = [
  // Assignment 251735 (38 stops, aisles 1–15)
  { id: "s-1-01", assignmentId: "asgn-251735", aisle: "1", slot: "A01", level: "L", checkCode: "471", qty: 6, status: "pending" },
  { id: "s-1-02", assignmentId: "asgn-251735", aisle: "1", slot: "A04", level: "M", checkCode: "829", qty: 4, status: "pending" },
  { id: "s-1-03", assignmentId: "asgn-251735", aisle: "1", slot: "B02", level: "H", checkCode: "563", qty: 2, status: "pending" },
  { id: "s-1-04", assignmentId: "asgn-251735", aisle: "2", slot: "A01", level: "L", checkCode: "714", qty: 8, status: "pending" },
  { id: "s-1-05", assignmentId: "asgn-251735", aisle: "2", slot: "A06", level: "M", checkCode: "382", qty: 3, status: "pending" },
  { id: "s-1-06", assignmentId: "asgn-251735", aisle: "3", slot: "B01", level: "L", checkCode: "916", qty: 5, status: "pending" },
  { id: "s-1-07", assignmentId: "asgn-251735", aisle: "3", slot: "B03", level: "M", checkCode: "247", qty: 7, status: "pending" },
  { id: "s-1-08", assignmentId: "asgn-251735", aisle: "4", slot: "A02", level: "L", checkCode: "538", qty: 4, status: "pending" },
  { id: "s-1-09", assignmentId: "asgn-251735", aisle: "4", slot: "A05", level: "H", checkCode: "671", qty: 9, status: "pending" },
  { id: "s-1-10", assignmentId: "asgn-251735", aisle: "5", slot: "B04", level: "L", checkCode: "423", qty: 6, status: "pending" },
  { id: "s-1-11", assignmentId: "asgn-251735", aisle: "5", slot: "B06", level: "M", checkCode: "857", qty: 3, status: "pending" },
  { id: "s-1-12", assignmentId: "asgn-251735", aisle: "6", slot: "A01", level: "L", checkCode: "192", qty: 11, status: "pending" },
  { id: "s-1-13", assignmentId: "asgn-251735", aisle: "6", slot: "A03", level: "M", checkCode: "364", qty: 5, status: "pending" },
  { id: "s-1-14", assignmentId: "asgn-251735", aisle: "7", slot: "B02", level: "L", checkCode: "748", qty: 8, status: "pending" },
  { id: "s-1-15", assignmentId: "asgn-251735", aisle: "7", slot: "B05", level: "H", checkCode: "523", qty: 4, status: "pending" },
  { id: "s-1-16", assignmentId: "asgn-251735", aisle: "8", slot: "A02", level: "L", checkCode: "936", qty: 6, status: "pending" },
  { id: "s-1-17", assignmentId: "asgn-251735", aisle: "8", slot: "A04", level: "M", checkCode: "281", qty: 7, status: "pending" },
  { id: "s-1-18", assignmentId: "asgn-251735", aisle: "9", slot: "B01", level: "L", checkCode: "614", qty: 5, status: "pending" },
  { id: "s-1-19", assignmentId: "asgn-251735", aisle: "9", slot: "B03", level: "M", checkCode: "473", qty: 10, status: "pending" },
  { id: "s-1-20", assignmentId: "asgn-251735", aisle: "10", slot: "A01", level: "L", checkCode: "827", qty: 3, status: "pending" },
  { id: "s-1-21", assignmentId: "asgn-251735", aisle: "10", slot: "A06", level: "H", checkCode: "159", qty: 6, status: "pending" },
  { id: "s-1-22", assignmentId: "asgn-251735", aisle: "11", slot: "B02", level: "L", checkCode: "342", qty: 9, status: "pending" },
  { id: "s-1-23", assignmentId: "asgn-251735", aisle: "11", slot: "B04", level: "M", checkCode: "716", qty: 4, status: "pending" },
  { id: "s-1-24", assignmentId: "asgn-251735", aisle: "12", slot: "A03", level: "L", checkCode: "581", qty: 7, status: "pending" },
  { id: "s-1-25", assignmentId: "asgn-251735", aisle: "12", slot: "A05", level: "M", checkCode: "924", qty: 5, status: "pending" },
  { id: "s-1-26", assignmentId: "asgn-251735", aisle: "13", slot: "B01", level: "L", checkCode: "237", qty: 8, status: "pending" },
  { id: "s-1-27", assignmentId: "asgn-251735", aisle: "13", slot: "B06", level: "H", checkCode: "463", qty: 6, status: "pending" },
  { id: "s-1-28", assignmentId: "asgn-251735", aisle: "14", slot: "A02", level: "L", checkCode: "819", qty: 3, status: "pending" },
  { id: "s-1-29", assignmentId: "asgn-251735", aisle: "14", slot: "A04", level: "M", checkCode: "572", qty: 11, status: "pending" },
  { id: "s-1-30", assignmentId: "asgn-251735", aisle: "15", slot: "B01", level: "L", checkCode: "346", qty: 4, status: "pending" },
  { id: "s-1-31", assignmentId: "asgn-251735", aisle: "15", slot: "B03", level: "M", checkCode: "781", qty: 6, status: "pending" },
  { id: "s-1-32", assignmentId: "asgn-251735", aisle: "15", slot: "B05", level: "H", checkCode: "629", qty: 5, status: "pending" },
  { id: "s-1-33", assignmentId: "asgn-251735", aisle: "3", slot: "A03", level: "L", checkCode: "415", qty: 7, status: "pending" },
  { id: "s-1-34", assignmentId: "asgn-251735", aisle: "6", slot: "B04", level: "M", checkCode: "738", qty: 4, status: "pending" },
  { id: "s-1-35", assignmentId: "asgn-251735", aisle: "9", slot: "A02", level: "L", checkCode: "892", qty: 8, status: "pending" },
  { id: "s-1-36", assignmentId: "asgn-251735", aisle: "11", slot: "A05", level: "M", checkCode: "254", qty: 3, status: "pending" },
  { id: "s-1-37", assignmentId: "asgn-251735", aisle: "13", slot: "A04", level: "L", checkCode: "617", qty: 6, status: "pending" },
  { id: "s-1-38", assignmentId: "asgn-251735", aisle: "14", slot: "B06", level: "H", checkCode: "483", qty: 5, status: "pending" },

  // Assignment 251736 (7 stops, frozen aisles 20–23)
  { id: "s-2-01", assignmentId: "asgn-251736", aisle: "20", slot: "A01", level: "L", checkCode: "714", qty: 8, status: "pending" },
  { id: "s-2-02", assignmentId: "asgn-251736", aisle: "20", slot: "B03", level: "M", checkCode: "329", qty: 6, status: "pending" },
  { id: "s-2-03", assignmentId: "asgn-251736", aisle: "21", slot: "A02", level: "L", checkCode: "851", qty: 9, status: "pending" },
  { id: "s-2-04", assignmentId: "asgn-251736", aisle: "21", slot: "B04", level: "H", checkCode: "467", qty: 4, status: "pending" },
  { id: "s-2-05", assignmentId: "asgn-251736", aisle: "22", slot: "A01", level: "L", checkCode: "213", qty: 7, status: "pending" },
  { id: "s-2-06", assignmentId: "asgn-251736", aisle: "22", slot: "B02", level: "M", checkCode: "589", qty: 5, status: "pending" },
  { id: "s-2-07", assignmentId: "asgn-251736", aisle: "23", slot: "A03", level: "L", checkCode: "742", qty: 15, status: "pending" },

  // Assignment 251737 (7 stops, dairy aisles 18–19, active/partial)
  { id: "s-3-01", assignmentId: "asgn-251737", aisle: "18", slot: "A01", level: "L", checkCode: "356", qty: 12, status: "picked" },
  { id: "s-3-02", assignmentId: "asgn-251737", aisle: "18", slot: "A04", level: "M", checkCode: "719", qty: 8, status: "picked" },
  { id: "s-3-03", assignmentId: "asgn-251737", aisle: "18", slot: "B02", level: "L", checkCode: "483", qty: 6, status: "picked" },
  { id: "s-3-04", assignmentId: "asgn-251737", aisle: "19", slot: "A01", level: "L", checkCode: "627", qty: 9, status: "pending" },
  { id: "s-3-05", assignmentId: "asgn-251737", aisle: "19", slot: "A03", level: "H", checkCode: "841", qty: 4, status: "pending" },
  { id: "s-3-06", assignmentId: "asgn-251737", aisle: "19", slot: "B01", level: "L", checkCode: "295", qty: 7, status: "pending" },
  { id: "s-3-07", assignmentId: "asgn-251737", aisle: "19", slot: "B05", level: "M", checkCode: "516", qty: 16, status: "pending" },

  // Assignment 251738 (7 stops, grocery 5–11, completed)
  { id: "s-4-01", assignmentId: "asgn-251738", aisle: "5", slot: "A02", level: "L", checkCode: "374", qty: 22, status: "picked" },
  { id: "s-4-02", assignmentId: "asgn-251738", aisle: "6", slot: "B01", level: "M", checkCode: "816", qty: 18, status: "picked" },
  { id: "s-4-03", assignmentId: "asgn-251738", aisle: "7", slot: "A04", level: "L", checkCode: "593", qty: 30, status: "picked" },
  { id: "s-4-04", assignmentId: "asgn-251738", aisle: "8", slot: "B03", level: "H", checkCode: "427", qty: 24, status: "picked" },
  { id: "s-4-05", assignmentId: "asgn-251738", aisle: "9", slot: "A01", level: "L", checkCode: "681", qty: 28, status: "picked" },
  { id: "s-4-06", assignmentId: "asgn-251738", aisle: "10", slot: "B05", level: "M", checkCode: "234", qty: 36, status: "picked" },
  { id: "s-4-07", assignmentId: "asgn-251738", aisle: "11", slot: "A03", level: "L", checkCode: "759", qty: 40, status: "picked" },
];

export function getStopsForAssignment(assignmentId: string): AssignmentStop[] {
  return ASSIGNMENT_STOPS.filter(s => s.assignmentId === assignmentId);
}
