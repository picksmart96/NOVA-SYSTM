import { useAppStore } from "@/lib/store";
import type { UserRole } from "@/data/users";

export interface NavLink {
  href: string;
  label: string;
  group: string;
}

const atLeast = (min: UserRole, role: UserRole): boolean => {
  const hierarchy: UserRole[] = ["selector", "trainer", "supervisor", "owner"];
  return hierarchy.indexOf(role) >= hierarchy.indexOf(min);
};

export function useRoleNav(): NavLink[] {
  const { role } = useAppStore();

  const links: NavLink[] = [];

  // Always visible
  links.push(
    { href: "/", label: "Home", group: "public" },
    { href: "/training", label: "Training", group: "public" },
  );

  // Trainer+ — Trainer Dashboard (primary role link, shown early)
  if (atLeast("trainer", role)) {
    links.push({ href: "/trainer-portal", label: "Trainer Dashboard", group: "trainer" });
  }

  // Supervisor+ — Supervisor Dashboard (primary role link, shown early)
  if (atLeast("supervisor", role)) {
    links.push({ href: "/supervisor", label: "Supervisor Dashboard", group: "supervisor" });
  }

  // Owner — Users & Access (primary role link, shown early)
  if (atLeast("owner", role)) {
    links.push({ href: "/users-access", label: "Users & Access", group: "owner" });
  }

  // Secondary public links
  links.push(
    { href: "/mistakes", label: "Common Mistakes", group: "public" },
    { href: "/progress", label: "My Progress", group: "public" },
  );

  // Secondary selector+ links (overflow)
  if (atLeast("selector", role)) {
    links.push(
      { href: "/leaderboard", label: "Leaderboard", group: "public" },
      { href: "/selector-nation", label: "Selector Nation", group: "public" },
      { href: "/nova-trainer", label: "NOVA Trainer", group: "nova" },
      { href: "/nova-help", label: "NOVA Help", group: "nova" },
    );
  }

  // Secondary trainer+ links (overflow)
  if (atLeast("trainer", role)) {
    links.push(
      { href: "/nova/control", label: "Assignment Control", group: "trainer" },
      { href: "/nova/slots", label: "Slot Master", group: "trainer" },
      { href: "/nova/warehouse", label: "Warehouse Ref", group: "trainer" },
      { href: "/nova/voice-commands", label: "Voice Commands", group: "trainer" },
    );
  }

  // Secondary supervisor+ links (overflow)
  if (atLeast("supervisor", role)) {
    links.push(
      { href: "/nova/tracking", label: "Live Tracking", group: "supervisor" },
    );
  }

  // Secondary owner links (overflow)
  if (atLeast("owner", role)) {
    links.push(
      { href: "/pricing", label: "Pricing", group: "owner" },
    );
  }

  return links;
}
