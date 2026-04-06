import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Target, Zap, Clock, ShieldCheck } from "lucide-react";

export default function ProgressPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground mt-2">Track your training modules and performance stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Average Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">94.2%</div>
            <Progress value={94.2} className="h-2 mt-4" />
            <p className="text-xs text-muted-foreground mt-2">Top 15% of facility</p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Total Cases Picked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">14,285</div>
            <p className="text-xs text-muted-foreground mt-4">+1,204 this week</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Training Completion</h2>
      <div className="space-y-4">
        {[
          { title: "Safety Fundamentals", progress: 100, status: "Completed" },
          { title: "NOVA Voice Commands", progress: 100, status: "Completed" },
          { title: "Pallet Building Strategies", progress: 60, status: "In Progress" },
          { title: "Handling Fragile Items", progress: 0, status: "Not Started" },
        ].map((module, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{module.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-sm ${
                    module.progress === 100 ? 'bg-primary/20 text-primary' : 
                    module.progress > 0 ? 'bg-blue-500/20 text-blue-500' : 
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {module.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={module.progress} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-muted-foreground w-12 text-right">{module.progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}