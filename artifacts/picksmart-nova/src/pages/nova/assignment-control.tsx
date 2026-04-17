import { useState, useEffect } from "react";
import { useListAssignments, useCreateAssignment, useUpdateAssignment, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Pause, Play, Trash2, UserCheck, BarChart2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore";
import { Link } from "wouter";

interface Selector {
  id: string;
  username: string;
  fullName: string;
  accountNumber: string;
}

export default function AssignmentControlPage() {
  const queryClient  = useQueryClient();
  const { jwtToken, currentUser } = useAuthStore();
  const { data: assignments, isLoading } = useListAssignments();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectors, setSelectors]       = useState<Selector[]>([]);
  const [loadingSelectors, setLoadingSelectors] = useState(false);

  // Assign-existing dialog
  const [assignDialogId, setAssignDialogId]     = useState<string | null>(null);
  const [assignSelectorId, setAssignSelectorId] = useState("");

  const [formData, setFormData] = useState({
    title:           "",
    selectorUserId:  "",
    selectorName:    "",
    voiceMode:       "training",
    startAisle:      10,
    endAisle:        15,
    totalCases:      150,
    totalCube:       120,
    totalPallets:    2,
    doorNumber:      42,
    goalTimeMinutes: 60,
    printerNumber:   307,
    alphaLabelNumber: 242,
    bravoLabelNumber: 578,
  });

  // Fetch selectors on mount + when create dialog opens
  const fetchSelectors = async () => {
    if (!jwtToken || loadingSelectors) return;
    setLoadingSelectors(true);
    try {
      const res = await fetch("/api/users/selectors", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) setSelectors(await res.json());
    } catch {}
    setLoadingSelectors(false);
  };

  useEffect(() => { fetchSelectors(); }, [jwtToken]); // eslint-disable-line
  useEffect(() => { if (isCreateOpen) fetchSelectors(); }, [isCreateOpen]); // eslint-disable-line

  // Build a quick lookup: userId → display name
  const selectorMap = Object.fromEntries(selectors.map(s => [s.id, s.fullName || s.username]));

  const handleCreate = () => {
    createAssignment.mutate({
      data: {
        assignmentNumber:  Math.floor(Math.random() * 900000) + 100000,
        title:             formData.title || `Training Run ${new Date().toLocaleDateString()}`,
        selectorUserId:    formData.selectorUserId || null,
        trainerUserId:     currentUser?.id ?? null,
        startAisle:        Number(formData.startAisle),
        endAisle:          Number(formData.endAisle),
        totalCases:        Number(formData.totalCases),
        totalCube:         Number(formData.totalCube),
        totalPallets:      Number(formData.totalPallets),
        doorNumber:        Number(formData.doorNumber),
        goalTimeMinutes:   Number(formData.goalTimeMinutes),
        goalTimeSeconds:   0,
        printerNumber:     Number(formData.printerNumber),
        alphaLabelNumber:  Number(formData.alphaLabelNumber),
        bravoLabelNumber:  Number(formData.bravoLabelNumber),
        voiceMode:         formData.voiceMode,
        status:            "active",
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        setIsCreateOpen(false);
        toast.success("Assignment created" + (formData.selectorName ? ` and assigned to ${formData.selectorName}` : ""));
        setFormData(prev => ({ ...prev, selectorUserId: "", selectorName: "", title: "" }));
      },
      onError: () => toast.error("Failed to create assignment"),
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateAssignment.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
          toast.success(`Assignment ${status}`);
        }
      }
    );
  };

  const handleAssignSelector = (assignmentId: string) => {
    if (!assignSelectorId) return;
    updateAssignment.mutate(
      { id: assignmentId, data: { selectorUserId: assignSelectorId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
          const name = selectorMap[assignSelectorId] ?? assignSelectorId;
          toast.success(`Assigned to ${name}`);
          setAssignDialogId(null);
          setAssignSelectorId("");
        },
        onError: () => toast.error("Failed to assign trainee"),
      }
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Assignment Control
          </h1>
          <p className="text-muted-foreground mt-2">Create and assign picking assignments to trainees.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/training-reports">
            <Button variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
              <BarChart2 className="mr-2 h-4 w-4" /> Training Reports
            </Button>
          </Link>

          {/* Create Assignment Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create & Assign Picking Assignment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">

                {/* Assign to trainee */}
                <div className="space-y-2">
                  <Label>Assign to Trainee</Label>
                  {loadingSelectors ? (
                    <div className="h-10 rounded-md bg-muted animate-pulse" />
                  ) : selectors.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      No trainees registered yet. Invite them first.
                    </div>
                  ) : (
                    <Select
                      value={formData.selectorUserId}
                      onValueChange={(val) => {
                        const sel = selectors.find(s => s.id === val);
                        setFormData(prev => ({
                          ...prev,
                          selectorUserId: val,
                          selectorName: sel?.fullName ?? "",
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select trainee…" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectors.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-400" />
                              <span className="font-medium">{s.fullName}</span>
                              <span className="text-muted-foreground text-xs">{s.accountNumber}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Morning Dry Grocery — Aisle 10-15"
                    className="bg-background border-border"
                  />
                </div>

                {/* Voice Mode */}
                <div className="space-y-2">
                  <Label>Voice Mode</Label>
                  <Select value={formData.voiceMode} onValueChange={val => setFormData({ ...formData, voiceMode: val })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="ultra_fast">Ultra Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Aisles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Aisle</Label>
                    <Input type="number" value={formData.startAisle} onChange={e => setFormData({ ...formData, startAisle: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Aisle</Label>
                    <Input type="number" value={formData.endAisle} onChange={e => setFormData({ ...formData, endAisle: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                </div>

                {/* Cases + Goal Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Cases</Label>
                    <Input type="number" value={formData.totalCases} onChange={e => setFormData({ ...formData, totalCases: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Goal Time (min)</Label>
                    <Input type="number" value={formData.goalTimeMinutes} onChange={e => setFormData({ ...formData, goalTimeMinutes: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                </div>

                {/* Door + Pallets */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Door Number</Label>
                    <Input type="number" value={formData.doorNumber} onChange={e => setFormData({ ...formData, doorNumber: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Pallets</Label>
                    <Input type="number" value={formData.totalPallets} onChange={e => setFormData({ ...formData, totalPallets: Number(e.target.value) })} className="bg-background border-border" />
                  </div>
                </div>

                {/* Printer */}
                <div className="space-y-2">
                  <Label>Printer Number</Label>
                  <Input type="number" value={formData.printerNumber} onChange={e => setFormData({ ...formData, printerNumber: Number(e.target.value) })} className="bg-background border-border" />
                </div>

                {/* Label Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alpha Label #</Label>
                    <Input type="number" value={formData.alphaLabelNumber} onChange={e => setFormData({ ...formData, alphaLabelNumber: Number(e.target.value) })} className="bg-background border-border" placeholder="e.g. 242" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bravo Label #</Label>
                    <Input type="number" value={formData.bravoLabelNumber} onChange={e => setFormData({ ...formData, bravoLabelNumber: Number(e.target.value) })} className="bg-background border-border" placeholder="e.g. 578" />
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={createAssignment.isPending}
                  className="bg-primary text-primary-foreground font-bold"
                >
                  {createAssignment.isPending ? "Creating…" : "Create & Assign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assign-to-selector dialog (for existing assignments) */}
      <Dialog open={!!assignDialogId} onOpenChange={open => { if (!open) { setAssignDialogId(null); setAssignSelectorId(""); } }}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Assign Trainee</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>Select Trainee</Label>
            {selectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trainees registered yet.</p>
            ) : (
              <Select value={assignSelectorId} onValueChange={setAssignSelectorId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choose trainee…" />
                </SelectTrigger>
                <SelectContent>
                  {selectors.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-400" />
                        <span className="font-medium">{s.fullName}</span>
                        <span className="text-muted-foreground text-xs">{s.accountNumber}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialogId(null); setAssignSelectorId(""); }}>Cancel</Button>
            <Button
              onClick={() => assignDialogId && handleAssignSelector(assignDialogId)}
              disabled={!assignSelectorId || updateAssignment.isPending}
              className="bg-primary text-primary-foreground font-bold"
            >
              {updateAssignment.isPending ? "Assigning…" : "Assign Trainee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (!assignments || assignments.length === 0) ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2">No assignments yet</h3>
          <p className="text-muted-foreground text-sm">Create your first assignment and assign it to a trainee.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((a) => {
            const selectorName = a.selectorUserId ? (selectorMap[a.selectorUserId] ?? a.selectorUserId.slice(0, 8) + "…") : null;
            return (
              <Card key={a.id} className="border-border bg-card hover:border-border/80 transition">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-black text-lg">#{a.assignmentNumber}</span>
                      <Badge variant="outline" className={
                        a.status === 'active'    ? 'bg-primary/20 text-primary border-primary/30' :
                        a.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        a.status === 'paused'    ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                        'bg-secondary text-muted-foreground'
                      }>
                        {a.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {a.voiceMode.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold mb-1 truncate">{a.title}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{a.totalCases} Cases</span>
                      <span>·</span>
                      <span>Aisles {a.startAisle}–{a.endAisle}</span>
                      <span>·</span>
                      <span>Goal {a.goalTimeMinutes}m</span>
                      <span>·</span>
                      <span className={`flex items-center gap-1 font-medium ${selectorName ? "text-green-400" : "text-amber-400"}`}>
                        <UserCheck className="h-3.5 w-3.5" />
                        {selectorName ?? "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap shrink-0">
                    {/* Assign trainee button for unassigned or any non-completed */}
                    {a.status !== 'completed' && a.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                        onClick={() => { setAssignDialogId(a.id); setAssignSelectorId(a.selectorUserId ?? ""); }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {a.selectorUserId ? "Reassign" : "Assign"}
                      </Button>
                    )}
                    {a.status === 'active' && (
                      <Button size="sm" variant="outline" className="border-yellow-500/60 text-yellow-500" onClick={() => handleStatusChange(a.id, 'paused')}>
                        <Pause className="h-4 w-4 mr-1" /> Pause
                      </Button>
                    )}
                    {a.status === 'paused' && (
                      <Button size="sm" variant="outline" className="border-primary/60 text-primary" onClick={() => handleStatusChange(a.id, 'active')}>
                        <Play className="h-4 w-4 mr-1" /> Resume
                      </Button>
                    )}
                    {a.status === 'pending' && (
                      <Button size="sm" variant="outline" className="border-primary/60 text-primary" onClick={() => handleStatusChange(a.id, 'active')}>
                        <Play className="h-4 w-4 mr-1" /> Activate
                      </Button>
                    )}
                    {a.status === 'completed' && (
                      <Link href="/training-reports">
                        <Button size="sm" variant="outline" className="border-blue-500/40 text-blue-400">
                          <BarChart2 className="h-4 w-4 mr-1" /> View Report
                        </Button>
                      </Link>
                    )}
                    {a.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="border-destructive/60 text-destructive" onClick={() => handleStatusChange(a.id, 'archived')}>
                        <Trash2 className="h-4 w-4 mr-1" /> Archive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
