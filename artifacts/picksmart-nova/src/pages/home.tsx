import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, BookOpen, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-card border-b border-border py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            INDUSTRIAL GRADE TRAINING
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            PickSmart <span className="text-primary">NOVA</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Precision-engineered warehouse training and assignment management. 
            Train faster, pick smarter, and manage operations with cockpit-like control.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/training">
              <Button size="lg" className="h-12 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                Start Training <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/nova">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-bold border-border bg-transparent hover:bg-secondary">
                My Assignments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-md mb-4 text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Live Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor selector performance and assignment progress in real-time.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-md mb-4 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Academy</h3>
              <p className="text-sm text-muted-foreground">Comprehensive training modules to get new selectors up to speed safely.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-md mb-4 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Voice Directed</h3>
              <p className="text-sm text-muted-foreground">NOVA voice sessions simulate real warehouse environments for maximum immersion.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-md mb-4 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Mistake Prevention</h3>
              <p className="text-sm text-muted-foreground">Proactive coaching on common errors, minimizing mispicks and shorts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>
      {children}
    </div>
  );
}