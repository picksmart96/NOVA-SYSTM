import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { useTranslation } from "react-i18next";

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
  owner: 4,
};

const atLeast = (min: AuthRole, role: string): boolean =>
  (RANK[role] ?? -1) >= (RANK[min] ?? 0);

export function useRoleNav(): NavLink[] {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const { role: demoRole } = useAppStore();

  // Role for public/community links — can use demo role
  const publicRole: string = currentUser?.role ?? demoRole;

  const plan = currentUser?.subscriptionPlan ?? null;

  // Personal plan: restricted pages only
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

  // Always-visible public links
  links.push(
    { href: "/", label: t("nav.home"), group: "public" },
    { href: "/training", label: t("nav.training"), group: "public" },
    { href: "/nova-trainer", label: t("nav.novaTrainer"), group: "nova" },
    { href: "/nova-help", label: t("nav.novaHelp"), group: "nova" },
  );

  // Trainer Dashboard, Supervisor Dashboard, Users & Access — hidden from nav entirely.
  // Pages remain accessible by direct URL with proper role protection.
  // Only the owner Control Center and Users & Access appear (owner-only, not in public nav).
  if (currentUser?.role === "owner") {
    links.push({ href: "/owner", label: "Control Center", group: "owner" });
  }

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

  // Trainer tools, supervisor tools, and pricing — hidden from nav.
  // Accessible via direct URL with proper route protection.

  return links;
}
