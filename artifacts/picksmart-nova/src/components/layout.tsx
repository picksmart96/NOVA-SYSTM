import { Link, useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle, Menu, X, Shield, Activity, Headphones, BookOpen } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useAppStore();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinksForRole = () => {
    const base = [
      { href: "/", label: "Home", icon: Activity },
      { href: "/training", label: "Training", icon: BookOpen },
      { href: "/mistakes", label: "Mistakes Guide", icon: Shield },
      { href: "/nova", label: "My Assignments", icon: Activity },
    ];
    
    if (role === "trainer" || role === "supervisor" || role === "owner") {
      base.push(
        { href: "/nova/control", label: "Assignment Control", icon: Shield },
        { href: "/nova/slots", label: "Slot Master", icon: Activity },
        { href: "/nova/warehouse", label: "Warehouse Ref", icon: BookOpen },
        { href: "/nova/voice-commands", label: "Voice Commands", icon: Headphones }
      );
    }
    
    if (role === "supervisor" || role === "owner") {
      base.push(
        { href: "/nova/tracking", label: "Live Tracking", icon: Activity },
      );
    }
    
    if (role === "owner") {
      base.push(
        { href: "/pricing", label: "Pricing", icon: Shield },
      );
    }
    
    return base;
  };

  const links = getLinksForRole();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md font-bold">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight text-lg hidden sm:inline-block">
                PickSmart <span className="text-primary font-black">NOVA</span>
              </span>
            </Link>
            <div className="hidden md:flex ml-6 space-x-1">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location === link.href || (location.startsWith(link.href) && link.href !== '/')
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex capitalize bg-secondary border-primary/20 text-primary">
              {role}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="btn-role-switcher">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Toggle role</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuLabel>Current Role</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {(['selector', 'trainer', 'supervisor', 'owner'] as const).map((r) => (
                  <DropdownMenuItem 
                    key={r} 
                    onClick={() => setRole(r)}
                    className={`capitalize ${role === r ? 'bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary' : 'focus:bg-secondary'}`}
                  >
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card pb-4">
            <nav className="flex flex-col px-2 py-2 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                    location === link.href || (location.startsWith(link.href) && link.href !== '/')
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}