export interface SlotEntry {
  id: string;
  aisle: string;
  slot: string;
  level: string;
  checkCode: string;
  description: string;
  zone: string;
}

export const SLOT_MASTER: SlotEntry[] = [
  { id: "sl-001", aisle: "1", slot: "A01", level: "L", checkCode: "471", description: "Canned Goods — Low", zone: "Dry" },
  { id: "sl-002", aisle: "1", slot: "A04", level: "M", checkCode: "829", description: "Canned Goods — Mid", zone: "Dry" },
  { id: "sl-003", aisle: "1", slot: "B02", level: "H", checkCode: "563", description: "Baking — High", zone: "Dry" },
  { id: "sl-004", aisle: "2", slot: "A01", level: "L", checkCode: "714", description: "Pasta — Low", zone: "Dry" },
  { id: "sl-005", aisle: "2", slot: "A06", level: "M", checkCode: "382", description: "Cereal — Mid", zone: "Dry" },
  { id: "sl-006", aisle: "3", slot: "B01", level: "L", checkCode: "916", description: "Condiments — Low", zone: "Dry" },
  { id: "sl-007", aisle: "3", slot: "B03", level: "M", checkCode: "247", description: "Sauces — Mid", zone: "Dry" },
  { id: "sl-008", aisle: "4", slot: "A02", level: "L", checkCode: "538", description: "Snacks — Low", zone: "Dry" },
  { id: "sl-009", aisle: "4", slot: "A05", level: "H", checkCode: "671", description: "Chips — High", zone: "Dry" },
  { id: "sl-010", aisle: "5", slot: "B04", level: "L", checkCode: "423", description: "Beverages — Low", zone: "Dry" },
  { id: "sl-011", aisle: "5", slot: "B06", level: "M", checkCode: "857", description: "Water — Mid", zone: "Dry" },
  { id: "sl-012", aisle: "6", slot: "A01", level: "L", checkCode: "192", description: "Juice — Low", zone: "Dry" },
  { id: "sl-013", aisle: "6", slot: "A03", level: "M", checkCode: "364", description: "Coffee — Mid", zone: "Dry" },
  { id: "sl-014", aisle: "7", slot: "B02", level: "L", checkCode: "748", description: "Tea — Low", zone: "Dry" },
  { id: "sl-015", aisle: "7", slot: "B05", level: "H", checkCode: "523", description: "Sugar — High", zone: "Dry" },
  { id: "sl-016", aisle: "8", slot: "A02", level: "L", checkCode: "936", description: "Flour — Low", zone: "Dry" },
  { id: "sl-017", aisle: "8", slot: "A04", level: "M", checkCode: "281", description: "Oil — Mid", zone: "Dry" },
  { id: "sl-018", aisle: "9", slot: "B01", level: "L", checkCode: "614", description: "Vinegar — Low", zone: "Dry" },
  { id: "sl-019", aisle: "9", slot: "B03", level: "M", checkCode: "473", description: "Spices — Mid", zone: "Dry" },
  { id: "sl-020", aisle: "10", slot: "A01", level: "L", checkCode: "827", description: "Baby Food — Low", zone: "Dry" },
  { id: "sl-021", aisle: "10", slot: "A06", level: "H", checkCode: "159", description: "Diapers — High", zone: "Dry" },
  { id: "sl-022", aisle: "11", slot: "B02", level: "L", checkCode: "342", description: "Paper Goods — Low", zone: "Dry" },
  { id: "sl-023", aisle: "11", slot: "B04", level: "M", checkCode: "716", description: "Cleaning — Mid", zone: "Dry" },
  { id: "sl-024", aisle: "12", slot: "A03", level: "L", checkCode: "581", description: "Laundry — Low", zone: "Dry" },
  { id: "sl-025", aisle: "12", slot: "A05", level: "M", checkCode: "924", description: "Dish Soap — Mid", zone: "Dry" },
  { id: "sl-026", aisle: "18", slot: "A01", level: "L", checkCode: "356", description: "Milk — Low", zone: "Dairy" },
  { id: "sl-027", aisle: "18", slot: "A04", level: "M", checkCode: "719", description: "Cheese — Mid", zone: "Dairy" },
  { id: "sl-028", aisle: "18", slot: "B02", level: "L", checkCode: "483", description: "Yogurt — Low", zone: "Dairy" },
  { id: "sl-029", aisle: "19", slot: "A01", level: "L", checkCode: "627", description: "Butter — Low", zone: "Dairy" },
  { id: "sl-030", aisle: "19", slot: "A03", level: "H", checkCode: "841", description: "Cream — High", zone: "Dairy" },
  { id: "sl-031", aisle: "20", slot: "A01", level: "L", checkCode: "714", description: "Frozen Veg — Low", zone: "Frozen" },
  { id: "sl-032", aisle: "20", slot: "B03", level: "M", checkCode: "329", description: "Frozen Meals — Mid", zone: "Frozen" },
  { id: "sl-033", aisle: "21", slot: "A02", level: "L", checkCode: "851", description: "Frozen Pizza — Low", zone: "Frozen" },
  { id: "sl-034", aisle: "21", slot: "B04", level: "H", checkCode: "467", description: "Ice Cream — High", zone: "Frozen" },
  { id: "sl-035", aisle: "22", slot: "A01", level: "L", checkCode: "213", description: "Frozen Meat — Low", zone: "Frozen" },
];
