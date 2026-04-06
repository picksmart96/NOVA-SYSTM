import { useGetAssignment, useListAssignmentStops, useUpdateAssignmentStop, useUpdateAssignment, getGetAssignmentQueryKey, getListAssignmentStopsQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, MapPin, Play, Box, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AssignmentDetailPage() {
  const [, params] = useRoute("/nova/assignments/:id");
  const id = params?.id || "";
  const queryClient = useQueryClient();

  const { data: assignment, isLoading: loadingAssignment } = useGetAssignment(id, {
    query: { enabled: !!id, queryKey: getGetAssignmentQueryKey(id) }
  });

  const { data: stops, isLoading: loadingStops } = useListAssignmentStops(id, {
    query: { enabled: !!id, queryKey: getListAssignmentStopsQueryKey(id) }
  });

  const updateStop = useUpdateAssignmentStop();
  const updateAssignment = useUpdateAssignment();

  if (loadingAssignment || loadingStops) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Assignment not found</h2>
        <Link href="/nova">
          <Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Assignments</Button>
        </Link>
      </div>
    );
  }

  const handleStartSession = () => {
    if (assignment.status === 'pending') {
      updateAssignment.mutate(
        { id: assignment.id, data: { status: 'active', startedAt: new Date().toISOString() } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(id) });
            toast.success("Session started");
          }
        }
      );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Link href="/nova" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Assignments
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            Assignment #{assignment.assignmentNumber}
          </h1>
          <p className="text-muted-foreground mt-1">{assignment.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground">
            {assignment.voiceMode.toUpperCase().replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={
            assignment.status === 'active' ? 'bg-primary/20 text-primary border-primary/30' :
            assignment.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
            'bg-secondary text-muted-foreground'
          }>
            {assignment.status.toUpperCase()}
          </Badge>
          {(assignment.status === 'pending' || assignment.status === 'active') && (
            <Link href={`/nova/voice/${assignment.id}`}>
              <Button onClick={handleStartSession} className="bg-primary text-primary-foreground font-bold">
                {assignment.status === 'active' ? 'Resume Voice Session' : 'Start Voice Session'} <Play className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border bg-card md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Aisles</p>
                <p className="font-bold text-lg">{assignment.startAisle} &rarr; {assignment.endAisle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Cases</p>
                <p className="font-bold text-lg">{assignment.totalCases}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Pallets</p>
                <p className="font-bold text-lg">{assignment.totalPallets}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Goal Time</p>
                <p className="font-bold text-lg">{assignment.goalTimeMinutes}m {assignment.goalTimeSeconds}s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Door</p>
                <p className="font-bold text-lg">{assignment.doorNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground mb-2">{assignment.percentComplete}%</div>
            <Progress value={assignment.percentComplete} className="h-2 mb-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stops?.filter(s => s.status === 'picked').length || 0} / {stops?.length || 0} stops</span>
              {assignment.performancePercent != null && (
                <span className={assignment.performancePercent >= 100 ? 'text-primary' : ''}>
                  Pace: {assignment.performancePercent}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Box className="h-5 w-5 text-primary" /> Assignment Stops</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!stops || stops.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">No stops found for this assignment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Order</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aisle</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Slot</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Check Code</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Qty</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stops.map((stop) => (
                    <tr key={stop.id} className={stop.status === 'picked' ? 'bg-secondary/10' : ''}>
                      <td className="py-3 px-4 font-mono">{stop.stopOrder}</td>
                      <td className="py-3 px-4 font-bold">{stop.aisle}</td>
                      <td className="py-3 px-4 font-bold">{stop.slot}{stop.level ? `-${stop.level}` : ''}</td>
                      <td className="py-3 px-4">
                        <span className="bg-secondary px-2 py-1 rounded text-xs font-mono tracking-wider">{stop.checkCode}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-base">{stop.qty}</td>
                      <td className="py-3 px-4">
                        {stop.status === 'picked' ? (
                          <span className="flex items-center gap-1 text-green-500 font-medium">
                            <CheckCircle className="h-4 w-4" /> Picked
                          </span>
                        ) : stop.status === 'verified' ? (
                          <span className="text-primary font-medium">Verified</span>
                        ) : stop.status === 'arrived' ? (
                          <span className="text-blue-400 font-medium">Arrived</span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
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