import { useState } from "react";
import { useListAssignments, useCreateAssignment, useUpdateAssignment, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssignmentStatus, AssignmentVoiceMode } from "@workspace/api-client-react/src/generated/api.schemas";

export default function AssignmentControlPage() {
  const queryClient = useQueryClient();
  const { data: assignments, isLoading } = useListAssignments();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    selectorUserId: "user-1",
    voiceMode: "training",
    startAisle: 10,
    endAisle: 15,
    totalCases: 150,
  });

  const handleCreate = () => {
    createAssignment.mutate({
      data: {
        assignmentNumber: Math.floor(Math.random() * 100000),
        title: formData.title || "New Training Run",
        selectorUserId: formData.selectorUserId,
        trainerUserId: "trainer-1",
        startAisle: Number(formData.startAisle),
        endAisle: Number(formData.endAisle),
        totalCases: Number(formData.totalCases),
        totalCube: 120,
        totalPallets: 2,
        doorNumber: 42,
        goalTimeMinutes: 45,
        goalTimeSeconds: 0,
        voiceMode: formData.voiceMode,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        setIsCreateOpen(false);
        toast.success("Assignment Created");
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: AssignmentStatus) => {
    updateAssignment.mutate({
      id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast.success(`Status updated to ${newStatus}`);
      }
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Assignment Control
          </h1>
          <p className="text-muted-foreground mt-2">Manage and assign batches to selectors.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Morning Dry Grocery" 
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceMode">Voice Mode</Label>
                <Select value={formData.voiceMode} onValueChange={(val) => setFormData({...formData, voiceMode: val})}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="ultra_fast">Ultra Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAisle">Start Aisle</Label>
                  <Input 
                    id="startAisle" 
                    type="number"
                    value={formData.startAisle}
                    onChange={(e) => setFormData({...formData, startAisle: Number(e.target.value)})}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAisle">End Aisle</Label>
                  <Input 
                    id="endAisle" 
                    type="number"
                    value={formData.endAisle}
                    onChange={(e) => setFormData({...formData, endAisle: Number(e.target.value)})}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCases">Total Cases</Label>
                <Input 
                  id="totalCases" 
                  type="number"
                  value={formData.totalCases}
                  onChange={(e) => setFormData({...formData, totalCases: Number(e.target.value)})}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createAssignment.isPending}>
                {createAssignment.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (!assignments || assignments.length === 0) ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No assignments</h3>
          <p className="text-muted-foreground">Create a new assignment to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="border-border bg-card">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">#{assignment.assignmentNumber}</span>
                    <Badge variant="outline" className={
                      assignment.status === 'active' ? 'bg-primary/20 text-primary border-primary/30' :
                      assignment.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                      assignment.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                      'bg-secondary text-muted-foreground'
                    }>
                      {assignment.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {assignment.voiceMode.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{assignment.title}</div>
                  <div className="flex gap-4 text-sm font-medium">
                    <span>{assignment.totalCases} Cases</span>
                    <span className="text-border">|</span>
                    <span>Aisles {assignment.startAisle}-{assignment.endAisle}</span>
                    <span className="text-border">|</span>
                    <span>Selector: {assignment.selectorUserId}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {assignment.status === 'active' && (
                    <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" onClick={() => handleStatusChange(assignment.id, 'paused')}>
                      <Pause className="h-4 w-4 mr-1" /> Pause
                    </Button>
                  )}
                  {assignment.status === 'paused' && (
                    <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => handleStatusChange(assignment.id, 'active')}>
                      <Play className="h-4 w-4 mr-1" /> Resume
                    </Button>
                  )}
                  {(assignment.status === 'pending' || assignment.status === 'paused' || assignment.status === 'active') && (
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatusChange(assignment.id, 'archived')}>
                      <Trash2 className="h-4 w-4 mr-1" /> Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}