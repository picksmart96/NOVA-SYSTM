export const TOWER_MAP: Record<number, string> = {
  13: "Large Detergents",
  14: "Large Detergents",
  15: "Small Detergents",
  16: "Small Detergents",
  17: "Small Detergents",
  18: "Tall & Wide Pasta Cases",
  19: "Juice, Pasta Jars & Cans",
  20: "Juice, Pasta Jars & Cans",
  21: "X-Order (Variety)",
  22: "Small Cans",
  23: "Heavy Juice",
  24: "Heavy Juice",
  25: "Heavy Juice",
  26: "Mixed Juice",
  27: "Salad Dressings",
  28: "Mixed Small Cases",
  29: "Cereal Boxes",
  30: "Mixed Big and Small Cases",
  31: "Paper Towels & Mixed Cases",
  32: "Mixed Small Cases",
  33: "Rice & Ramen",
  34: "Mixed Small Cases",
};

type BuildClass = "heavy_base" | "middle_support" | "top_fill" | "special" | "general";

function classifyProduct(productType = ""): BuildClass {
  const text = productType.toLowerCase();

  if (
    text.includes("heavy juice") ||
    text.includes("large detergents") ||
    text.includes("tall & wide")
  ) return "heavy_base";

  if (
    text.includes("juice") ||
    text.includes("small detergents") ||
    text.includes("small cans") ||
    text.includes("rice") ||
    text.includes("ramen") ||
    text.includes("mixed juice")
  ) return "middle_support";

  if (
    text.includes("cereal") ||
    text.includes("paper towels") ||
    text.includes("mixed small") ||
    text.includes("salad dressings") ||
    text.includes("mixed big")
  ) return "top_fill";

  if (text.includes("x-order")) return "special";

  return "general";
}

interface AisleProduct {
  aisle: number;
  productType: string;
  buildClass: BuildClass;
}

export function getAisleProducts(aisles: number[]): AisleProduct[] {
  return aisles.map((aisle) => ({
    aisle,
    productType: TOWER_MAP[aisle] ?? "Unknown",
    buildClass: classifyProduct(TOWER_MAP[aisle] ?? ""),
  }));
}

export interface PalletAdvice {
  aisles: AisleProduct[];
  advice: string;
}

export function buildPalletAdviceFromAisles(aisles: number[], lang = "en"): PalletAdvice {
  const mapped = getAisleProducts(aisles);
  const es = lang.startsWith("es");

  const heavy   = mapped.filter((x) => x.buildClass === "heavy_base");
  const middle  = mapped.filter((x) => x.buildClass === "middle_support");
  const top     = mapped.filter((x) => x.buildClass === "top_fill");
  const special = mapped.filter((x) => x.buildClass === "special");

  const lines: string[] = [];

  if (heavy.length) {
    lines.push(es
      ? `Comienza tu base con los pasillos ${heavy.map((x) => x.aisle).join(", ")} — son pasillos de fundación pesada (${heavy.map((x) => x.productType).join(", ")}).`
      : `Start your base with aisles ${heavy.map((x) => x.aisle).join(", ")} — those are heavy foundation aisles (${heavy.map((x) => x.productType).join(", ")}).`
    );
  }

  if (middle.length) {
    lines.push(es
      ? `Usa los pasillos ${middle.map((x) => x.aisle).join(", ")} como capas de soporte en el medio para mantener la tarima equilibrada.`
      : `Use aisles ${middle.map((x) => x.aisle).join(", ")} as middle support layers to keep the pallet balanced.`
    );
  }

  if (top.length) {
    lines.push(es
      ? `Deja los pasillos ${top.map((x) => x.aisle).join(", ")} para las capas superiores, rellenar espacios y terminar ligero.`
      : `Keep aisles ${top.map((x) => x.aisle).join(", ")} for top layers, gap filling, and light finishing.`
    );
  }

  if (special.length) {
    lines.push(es
      ? `El pasillo ${special.map((x) => x.aisle).join(", ")} es X-Order (variedad). Construye una base sólida primero antes de apilar esas cajas mixtas.`
      : `Aisle ${special.map((x) => x.aisle).join(", ")} is X-Order (variety). Build a solid base first before stacking those mixed cases.`
    );
  }

  if (aisles.includes(19) || aisles.includes(20)) {
    lines.push(es
      ? "Los pasillos 19–20 acumulan muchas cajas pequeñas rápido — usa una segunda tarima cuando sea necesario."
      : "Aisles 19–20 can stack up a lot of small cases fast — use a second pallet when needed."
    );
  }

  if (aisles.some((a) => a >= 31)) {
    lines.push(es
      ? "Los pasillos 31 en adelante son para terminar — rellena los espacios de la tarima delantera primero, no dejes huecos."
      : "Aisles 31 and up are finishers — fill gaps in the front pallet first, don't leave holes."
    );
  }

  if (!lines.length) {
    lines.push(es
      ? "Empieza con el pasillo más pesado, mantén la base firme, luego construye soporte medio y termina con producto ligero arriba."
      : "Start with the heaviest aisle first, keep the base tight, then build medium support, then finish with lighter top product."
    );
  }

  lines.push(es
    ? "Regla principal: pesado primero, medio equilibrado, ligero arriba, rellena espacios temprano."
    : "Main rule: heavy first, balanced middle, light top, fill gaps early."
  );

  return { aisles: mapped, advice: lines.join(" ") };
}

// ─── Aisle extraction from free text ─────────────────────────────────────────
export function extractAislesFromText(text: string): number[] {
  const matches = text.match(/\b(1[3-9]|2\d|3[0-4])\b/g) ?? [];
  return [...new Set(matches.map(Number))].sort((a, b) => a - b);
}

// ─── Build question detection ─────────────────────────────────────────────────
export function isBuildQuestion(question: string): boolean {
  const t = question.toLowerCase();
  return (
    // English
    t.includes("how should i build") ||
    t.includes("how do i build") ||
    t.includes("how to build") ||
    t.includes("start my base") ||
    t.includes("what should i put on the base") ||
    t.includes("how should i stack") ||
    t.includes("assignment build") ||
    t.includes("build this pallet") ||
    t.includes("build order") ||
    t.includes("pallet order") ||
    t.includes("stack order") ||
    t.includes("build sequence") ||
    (t.includes("build") && t.includes("aisle")) ||
    // Spanish
    t.includes("como debo construir") ||
    t.includes("cómo debo construir") ||
    t.includes("como construir") ||
    t.includes("cómo construir") ||
    t.includes("como armar") ||
    t.includes("cómo armar") ||
    t.includes("como apilar") ||
    t.includes("cómo apilar") ||
    t.includes("construir mi tarima") ||
    t.includes("construir la tarima") ||
    t.includes("armar la tarima") ||
    t.includes("orden de construccion") ||
    t.includes("orden de construcción") ||
    (t.includes("construir") && t.includes("pasillo")) ||
    (t.includes("tarima") && t.includes("pasillo"))
  );
}
