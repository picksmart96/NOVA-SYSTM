import { Link } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { BookOpen, Users, ShieldCheck, Briefcase, LayoutDashboard, Zap, TrendingUp, ChevronRight } from "lucide-react";

interface PortalCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

function getPortalCards(role: string): PortalCard[] {
  const cards: PortalCard[] = [];

  // Everyone with company subscription sees Training
  cards.push({
    title: "Training Modules",
    description: "6 modules — beginner to advanced warehouse picking skills",
    href: "/training",
    icon: BookOpen,
    color: "from-blue-600 to-blue-700",
  });

  cards.push({
    title: "NOVA AI Coach",
    description: "Voice-directed coaching, performance feedback, and guidance",
    href: "/nova-help",
    icon: Zap,
    color: "from-violet-600 to-violet-700",
  });

  if (["trainer", "supervisor", "manager", "director", "owner"].includes(role)) {
    cards.push({
      title: "Trainer Portal",
      description: "Assign lessons, track selector sessions, log progress",
      href: "/trainer-portal",
      icon: Users,
      color: "from-green-600 to-green-700",
      badge: "Trainer",
    });
  }

  if (["supervisor", "manager", "director", "owner"].includes(role)) {
    cards.push({
      title: "Supervisor Dashboard",
      description: "Live shift oversight, selector management, NOVA activation",
      href: "/supervisor",
      icon: ShieldCheck,
      color: "from-orange-600 to-orange-700",
      badge: "Supervisor",
    });
  }

  if (["manager", "director", "owner"].includes(role)) {
    cards.push({
      title: "Manager Dashboard",
      description: "Team performance overview, training progress, and metrics",
      href: "/manager",
      icon: Briefcase,
      color: "from-purple-600 to-purple-700",
      badge: "Manager",
    });
  }

  if (["director", "owner"].includes(role)) {
    cards.push({
      title: "Control Panel",
      description: "Full organizational view — users, performance, invite links",
      href: "/control-panel",
      icon: LayoutDashboard,
      color: "from-yellow-500 to-yellow-600",
      badge: "Director",
    });
  }

  cards.push({
    title: "My Performance",
    description: "Track your pick rate, hours, weekly goals, and trends",
    href: "/leaderboard",
    icon: TrendingUp,
    color: "from-slate-600 to-slate-700",
  });

  return cards;
}

export default function CompanyPortalSection() {
  const { currentUser } = useAuthStore();

  if (!currentUser || currentUser.isDemoUser) return null;

  const role = currentUser.role;
  const cards = getPortalCards(role);
  const firstName = currentUser.fullName?.split(" ")[0] || currentUser.username;

  const roleBadgeColor: Record<string, string> = {
    selector: "bg-blue-500/20 text-blue-300",
    trainer: "bg-green-500/20 text-green-300",
    supervisor: "bg-orange-500/20 text-orange-300",
    manager: "bg-purple-500/20 text-purple-300",
    director: "bg-yellow-500/20 text-yellow-300",
    owner: "bg-red-500/20 text-red-300",
  };
  const roleBadge = roleBadgeColor[role] ?? "bg-slate-500/20 text-slate-300";

  return (
    <section className="border-b border-slate-800 bg-slate-950 py-14 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Your Portal</p>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Welcome back, <span className="text-yellow-400">{firstName}</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              Signed in as{" "}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${roleBadge}`}>
                {role}
              </span>
              {" "} — here's everything available to you.
            </p>
          </div>
        </div>

        {/* Portal cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative rounded-2xl border border-white/8 bg-slate-900 p-6 hover:border-white/20 hover:bg-slate-800/80 transition-all duration-200 overflow-hidden"
            >
              {/* Gradient accent */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${card.color} opacity-60 group-hover:opacity-100 transition`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                {card.badge && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                    {card.badge}+
                  </span>
                )}
              </div>

              <h3 className="text-white font-black text-base mb-1.5 group-hover:text-yellow-300 transition">
                {card.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>

              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-slate-500 group-hover:text-yellow-400 transition">
                Open <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
