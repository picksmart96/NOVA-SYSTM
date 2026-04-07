import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";

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
  const { currentUser } = useAuthStore();
  const { role: demoRole } = useAppStore();

  const role: string = currentUser?.role ?? demoRole;

  const links: NavLink[] = [];

  // Always visible
  links.push(
    { href: "/", label: "Home", group: "public" },
    { href: "/training", label: "Training", group: "public" },
  );

  // Trainer+ — Trainer Dashboard
  if (atLeast("trainer", role)) {
    links.push({ href: "/trainer-portal", label: "Trainer Dashboard", group: "trainer" });
  }

  // Supervisor+ — Supervisor Dashboard
  if (atLeast("supervisor", role)) {
    links.push({ href: "/supervisor", label: "Supervisor Dashboard", group: "supervisor" });
  }

  // Owner only — Users & Access
  if (atLeast("owner", role)) {
    links.push({ href: "/users-access", label: "Users & Access", group: "owner" });
  }

  // Selector+ — Common pages
  links.push(
    { href: "/mistakes", label: "Common Mistakes", group: "public" },
    { href: "/progress", label: "My Progress", group: "public" },
  );

  // Selector+ — NOVA & learning
  if (atLeast("selector", role)) {
    links.push(
      { href: "/nova-trainer", label: "NOVA Trainer", group: "nova" },
      { href: "/nova-help", label: "NOVA Help", group: "nova" },
      { href: "/leaderboard", label: "Leaderboard", group: "public" },
      { href: "/selector-nation", label: "Selector Nation", group: "public" },
    );
  }

  // Trainer+ — additional tools
  if (atLeast("trainer", role)) {
    links.push(
      { href: "/nova/control", label: "Assignment Control", group: "trainer" },
      { href: "/nova/slots", label: "Slot Master", group: "trainer" },
      { href: "/nova/warehouse", label: "Warehouse Ref", group: "trainer" },
      { href: "/nova/voice-commands", label: "Voice Commands", group: "trainer" },
    );
  }

  // Supervisor+ — live ops
  if (atLeast("supervisor", role)) {
    links.push(
      { href: "/nova/tracking", label: "Live Tracking", group: "supervisor" },
    );
  }

  // Manager+ — Pricing (NOT supervisor, NOT trainer, NOT selector)
  if (atLeast("manager", role)) {
    links.push({ href: "/pricing", label: "Pricing", group: "owner" });
  }

  return links;
}
