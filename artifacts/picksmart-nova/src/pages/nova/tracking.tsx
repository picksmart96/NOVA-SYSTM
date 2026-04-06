import { useListAssignments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function LiveTrackingPage() {
  const { data: assignments, isLoading } = useListAssignments();

  const activeAssignments = assignments?.filter(a => a.status === 'active') || [];
  const avgPerformance = activeAssignments.length > 0 
    ? activeAssignments.reduce((acc, a) => acc + (a.performancePercent || 100), 0) / activeAssignments.length 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Live Tracking
        </h1>
        <p className="text-muted-foreground mt-2">Real-time monitor of all active selectors on the floor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Active Selectors</p>
                <p className="text-3xl font-black">{activeAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Floor Avg Pace</p>
                <p className="text-3xl font-black text-green-500">{Math.round(avgPerformance)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center border border-border">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Pending Assignments</p>
                <p className="text-3xl font-black">{assignments?.filter(a => a.status === 'pending').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Underperforming (&lt;90%)</p>
                <p className="text-3xl font-black text-destructive">
                  {activeAssignments.filter(a => (a.performancePercent || 100) < 90).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Active Selector Grid</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeAssignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active selectors on the floor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Selector</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Assignment</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Progress</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Pace</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-bold">{assignment.selectorUserId}</td>
                      <td className="py-3 px-4">
                        <Link href={`/nova/assignments/${assignment.id}`} className="text-primary hover:underline">
                          #{assignment.assignmentNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-secondary">
                          {assignment.voiceMode.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={assignment.percentComplete} className="h-2 w-24" />
                          <span className="text-xs font-mono">{assignment.percentComplete}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={
                          (assignment.performancePercent || 100) < 90 ? 'text-destructive' :
                          (assignment.performancePercent || 100) >= 100 ? 'text-primary' : 'text-green-500'
                        }>
                          {assignment.performancePercent || 100}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/nova/assignments/${assignment.id}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">View Details</Badge>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}