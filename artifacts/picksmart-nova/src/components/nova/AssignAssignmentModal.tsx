import { useState } from "react";
import { useTrainerStore } from "@/lib/trainerStore";
import { X, ClipboardList } from "lucide-react";

interface AssignAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  preselectedSelectorId?: number | null;
  preselectedAssignmentId?: string | null;
}

export function AssignAssignmentModal({ open, onClose, preselectedSelectorId = null, preselectedAssignmentId = null }: AssignAssignmentModalProps) {
  const { selectors, assignments, assignAssignment } = useTrainerStore();
  const [selectorId, setSelectorId] = useState<string>(
    preselectedSelectorId ? String(preselectedSelectorId) : ""
  );
  const [assignmentId, setAssignmentId] = useState(preselectedAssignmentId ?? "");
  const [toast, setToast] = useState<string | null>(null);

  if (!open) return null;

  const handleAssign = () => {
    if (!selectorId || !assignmentId) return;

    const selector = selectors.find((s) => s.id === Number(selectorId));
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!selector || !assignment) return;

    assignAssignment(Number(selectorId), assignmentId);

    const msg = `Assignment #${assignment.assignmentNumber} assigned to ${selector.name}`;
    setToast(msg);
    setTimeout(() => {
      setToast(null);
      setSelectorId("");
      setAssignmentId("");
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-400" /> Assign Assignment
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toast && (
          <div className="mb-4 rounded-2xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-300 text-sm font-bold">
            {toast}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Selector</label>
            <select
              value={selectorId}
              onChange={(e) => setSelectorId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">Choose selector</option>
              {selectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.novaId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Assignment</label>
            <select
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">Choose assignment</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.assignmentNumber} — {a.type} · {a.totalCases} cases · Aisles {a.startAisle}–{a.endAisle}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            disabled={!selectorId || !assignmentId}
            className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
