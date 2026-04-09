import { Link, useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { useRoleNav } from "@/hooks/useRoleNav";
import type { UserRole } from "@/data/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle, Menu, X, Activity } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import SubscribePromptModal from "@/components/paywall/SubscribePromptModal";

// Paths that are always free — no subscription required to visit.
const FREE_PATHS = ["/", "/pricing", "/choose-plan", "/login", "/privacy", "/terms"];
function isFree(href: string) {
  return FREE_PATHS.includes(href) ||
    href.startsWith("/checkout") ||
    href.startsWith("/owner-access") ||
    href.startsWith("/invite") ||
    href.startsWith("/w/");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { role, setRole } = useAppStore();
  const { currentUser, logout, lock } = useAuthStore();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const links = useRoleNav();

  // Subscription check — owner always passes, everyone else needs isSubscribed.
  const isOwner = currentUser?.role === "owner";
  const isSubscribed = isOwner || !!currentUser?.isSubscribed;

  // Intercept nav clicks: if the link requires subscription, show modal instead.
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!isSubscribed && !isFree(href)) {
      e.preventDefault();
      setSubscribeOpen(true);
    }
  };

  const displayRole = currentUser?.role ?? role;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const groups = links.reduce<Record<string, typeof links>>((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  const desktopLinks = links.slice(0, 7);

  const groupLabel = (group: string) =>
    t(`nav.groupLabels.${group}`, { defaultValue: group });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md font-bold">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight text-lg hidden sm:inline-block">
                PickSmart <span className="text-primary font-black">NOVA</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex ml-4 space-x-0.5 overflow-hidden">
              {desktopLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive(link.href)
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {links.length > 7 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-3">
                      {t("nav.more")} ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 bg-card border-border">
                    {Object.entries(groups).map(([group, groupLinks]) => {
                      const overflow = groupLinks.filter(l => !desktopLinks.includes(l));
                      if (overflow.length === 0) return null;
                      return (
                        <div key={group}>
                          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
                            {groupLabel(group)}
                          </DropdownMenuLabel>
                          {overflow.map(link => (
                            <DropdownMenuItem key={link.href} asChild>
                              <Link
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`cursor-pointer ${isActive(link.href) ? "text-primary" : ""}`}
                              >
                                {link.label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="bg-border" />
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Right: language switcher + role badge / user info + mobile menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 px-3 hidden sm:flex" data-testid="btn-role-switcher">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="capitalize text-primary font-bold text-sm">{displayRole}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                  <DropdownMenuLabel className="capitalize">{currentUser.fullName}</DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">{currentUser.username} · {currentUser.role}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => lock()}
                    className="focus:bg-yellow-500/10"
                  >
                    🔒 Lock session
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { logout(); navigate("/login"); }}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Badge variant="outline" className="hidden sm:flex capitalize bg-secondary border-primary/20 text-primary">
                  {role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" data-testid="btn-role-switcher">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="sr-only">Switch role</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuLabel>{t("nav.demoRole")}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {(["selector", "trainer", "supervisor", "owner"] as UserRole[]).map(r => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => setRole(r)}
                        className={`capitalize ${role === r ? "bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary" : "focus:bg-secondary"}`}
                      >
                        {r}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card pb-4 max-h-[80vh] overflow-y-auto">
            {Object.entries(groups).map(([group, groupLinks]) => (
              <div key={group}>
                <p className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {groupLabel(group)}
                </p>
                <nav className="flex flex-col px-2 space-y-0.5">
                  {groupLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        if (!isSubscribed && !isFree(link.href)) {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          setSubscribeOpen(true);
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                        isActive(link.href)
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Global subscribe gate modal — triggered by nav clicks for unsubscribed visitors */}
      <SubscribePromptModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </div>
  );
}
