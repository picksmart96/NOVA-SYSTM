import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { useTranslation } from "react-i18next";
import { useWarehouseStore, useWarehouse } from "@/lib/warehouseStore";

export interface NavLink {
  href: string;
  label: string;
  group: string;
}

const RANK: Record<string, number> = {
  selector: 0,
  trainer: 1,
  supervisor: 2,
  manager: 3,
  director: 4,
  owner: 5,
};

const atLeast = (min: AuthRole, role: string): boolean =>
  (RANK[role] ?? -1) >= (RANK[min] ?? 0);

export function useRoleNav(): NavLink[] {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const { role: demoRole } = useAppStore();
  const { warehouse, hasFeature } = useWarehouse();
  const { setWarehouseBySlug } = useWarehouseStore();

  useEffect(() => {
    if (currentUser?.warehouseSlug && !warehouse) {
      setWarehouseBySlug(currentUser.warehouseSlug);
    }
  }, [currentUser?.warehouseSlug, warehouse, setWarehouseBySlug]);

  const publicRole: string = currentUser?.role ?? demoRole;
  const isOwner = currentUser?.role === "owner";
  const plan = currentUser?.subscriptionPlan ?? null;

  // Personal plan: restricted nav
  if (plan === "personal") {
    return [
      { href: "/", label: t("nav.home"), group: "public" },
      { href: "/training", label: t("nav.training"), group: "public" },
      { href: "/nova-help", label: t("nav.novaHelp"), group: "nova" },
      { href: "/mistakes", label: t("nav.commonMistakes"), group: "public" },
      { href: "/selector-breaking-news", label: t("nav.selectorNation"), group: "public" },
    ];
  }

  const links: NavLink[] = [];

  links.push(
    { href: "/", label: t("nav.home"), group: "public" },
    { href: "/training", label: t("nav.training"), group: "public" },
  );

  links.push({ href: "/nova-help", label: t("nav.novaHelp"), group: "nova" });

  links.push(
    { href: "/mistakes", label: t("nav.commonMistakes"), group: "public" },
    { href: "/progress", label: t("nav.myProgress"), group: "public" },
  );

  if (atLeast("selector", publicRole)) {
    links.push(
      { href: "/leaderboard", label: t("nav.leaderboard"), group: "public" },
      { href: "/selector-breaking-news", label: t("nav.selectorNation"), group: "public" },
    );
  }

  // Trainer+ gets Trainer Portal
  if (atLeast("trainer", publicRole)) {
    links.push({ href: "/trainer-portal", label: "Trainer Portal", group: "staff" });
  }

  // Supervisor, Manager, and Control Panel are private — accessible only via Command Center
  // Not shown in general nav

  return links;
}
