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

  links.push(
    { href: "/", label: "Home", group: "public" },
    { href: "/training", label: "Training", group: "public" },
    { href: "/mistakes", label: "Common Mistakes", group: "public" },
    { href: "/progress", label: "My Progress", group: "public" },
    { href: "/leaderboard", label: "Leaderboard", group: "public" },
    { href: "/selector-nation", label: "Selector Nation", group: "public" },
  );

  if (atLeast("selector", role)) {
    links.push(
      { href: "/nova", label: "My Assignments", group: "nova" },
      { href: "/nova-trainer", label: "NOVA Trainer", group: "nova" },
      { href: "/nova-help", label: "NOVA Help", group: "nova" },
    );
  }

  if (atLeast("trainer", role)) {
    links.push(
      { href: "/nova/control", label: "Assignment Control", group: "trainer" },
      { href: "/nova/slots", label: "Slot Master", group: "trainer" },
      { href: "/nova/warehouse", label: "Warehouse Ref", group: "trainer" },
      { href: "/nova/voice-commands", label: "Voice Commands", group: "trainer" },
      { href: "/trainer-portal", label: "Trainer Portal", group: "trainer" },
    );
  }

  if (atLeast("supervisor", role)) {
    links.push(
      { href: "/nova/tracking", label: "Live Tracking", group: "supervisor" },
      { href: "/supervisor", label: "Supervisor", group: "supervisor" },
    );
  }

  if (atLeast("owner", role)) {
    links.push(
      { href: "/pricing", label: "Pricing", group: "owner" },
      { href: "/users-access", label: "Users & Access", group: "owner" },
    );
  }

  return links;
}
