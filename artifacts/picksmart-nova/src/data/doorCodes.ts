export interface DoorCode {
  doorNumber: number;
  stagingCode: number;
  zone: string;
  description: string;
}

export const DOOR_CODES: DoorCode[] = [
  { doorNumber: 355, stagingCode: 641, zone: "A", description: "Zone A — East Dock" },
  { doorNumber: 370, stagingCode: 714, zone: "B", description: "Zone B — West Dock" },
  { doorNumber: 340, stagingCode: 581, zone: "C", description: "Zone C — North Dock" },
  { doorNumber: 12, stagingCode: 448, zone: "A", description: "Zone A — Door 12" },
  { doorNumber: 7, stagingCode: 332, zone: "B", description: "Zone B — Door 7" },
  { doorNumber: 9, stagingCode: 517, zone: "B", description: "Zone B — Door 9" },
  { doorNumber: 15, stagingCode: 623, zone: "C", description: "Zone C — Door 15" },
];
