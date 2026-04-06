import { useListAssignments } from "@workspace/api-client-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Activity, Clock, MapPin, Play } from "lucide-react";
import { AssignmentStatus } from "@workspace/api-client-react/src/generated/api.schemas";

export default function MyAssignmentsPage() {
  const { userId } = useAppStore();
  const { data: assignments, isLoading } = useListAssignments();

  const myAssignments = assignments?.filter(a => a.selectorUserId === userId) || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          My Assignments
        </h1>
        <p className="text-muted-foreground mt-2">Your current and upcoming picking assignments.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : myAssignments.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No assignments found</h3>
          <p className="text-muted-foreground">You don't have any assignments right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myAssignments.map((assignment) => (
            <Card key={assignment.id} className={`border-border bg-card transition-colors ${assignment.status === 'active' ? 'border-primary shadow-lg shadow-primary/5' : ''}`}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">Assignment #{assignment.assignmentNumber}</CardTitle>
                    <Badge variant="outline" className={
                      assignment.status === 'active' ? 'bg-primary/20 text-primary border-primary/30' :
                      assignment.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                      'bg-secondary text-muted-foreground'
                    }>
                      {assignment.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {assignment.voiceMode.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{assignment.title}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-secondary/50 p-3 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Aisles</p>
                    <p className="font-bold">{assignment.startAisle} → {assignment.endAisle}</p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Total Cases</p>
                    <p className="font-bold">{assignment.totalCases}</p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Goal Time</p>
                    <p className="font-bold">{assignment.goalTimeMinutes}m {assignment.goalTimeSeconds}s</p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Progress</p>
                    <p className="font-bold text-primary">{assignment.percentComplete}%</p>
                  </div>
                </div>
                
                {assignment.status === 'active' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span>{assignment.percentComplete}%</span>
                    </div>
                    <Progress value={assignment.percentComplete} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-end gap-2">
                <Link href={`/nova/assignments/${assignment.id}`}>
                  <Button variant="outline" size="sm">Details</Button>
                </Link>
                {(assignment.status === 'pending' || assignment.status === 'active') && (
                  <Link href={`/nova/voice/${assignment.id}`}>
                    <Button size="sm" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                      {assignment.status === 'active' ? 'Resume Session' : 'Start Session'} <Play className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}