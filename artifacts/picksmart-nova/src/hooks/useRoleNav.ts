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

  const role: string = currentUser?.role ?? demoRole;

  const links: NavLink[] = [];

  links.push(
    { href: "/", label: t("nav.home"), group: "public" },
    { href: "/training", label: t("nav.training"), group: "public" },
    { href: "/nova-trainer", label: t("nav.novaTrainer"), group: "nova" },
    { href: "/nova-help", label: t("nav.novaHelp"), group: "nova" },
  );

  if (atLeast("trainer", role)) {
    links.push({ href: "/trainer-portal", label: t("nav.trainerDashboard"), group: "trainer" });
  }

  if (atLeast("supervisor", role)) {
    links.push({ href: "/supervisor", label: t("nav.supervisorDashboard"), group: "supervisor" });
  }

  if (atLeast("owner", role)) {
    links.push({ href: "/users-access", label: t("nav.usersAccess"), group: "owner" });
  }

  links.push(
    { href: "/mistakes", label: t("nav.commonMistakes"), group: "public" },
    { href: "/progress", label: t("nav.myProgress"), group: "public" },
  );

  if (atLeast("selector", role)) {
    links.push(
      { href: "/leaderboard", label: t("nav.leaderboard"), group: "public" },
      { href: "/selector-nation", label: t("nav.selectorNation"), group: "public" },
    );
  }

  if (atLeast("trainer", role)) {
    links.push(
      { href: "/nova/control", label: t("nav.assignmentControl"), group: "trainer" },
      { href: "/nova/slots", label: t("nav.slotMaster"), group: "trainer" },
      { href: "/nova/warehouse", label: t("nav.warehouseRef"), group: "trainer" },
      { href: "/nova/voice-commands", label: t("nav.voiceCommands"), group: "trainer" },
    );
  }

  if (atLeast("supervisor", role)) {
    links.push(
      { href: "/nova/tracking", label: t("nav.liveTracking"), group: "supervisor" },
    );
  }

  if (atLeast("manager", role)) {
    links.push({ href: "/pricing", label: t("nav.pricing"), group: "owner" });
  }

  return links;
}
