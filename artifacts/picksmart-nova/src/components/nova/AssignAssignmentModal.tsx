import { useState, useEffect } from "react";
import { useTrainerStore } from "@/lib/trainerStore";
import { X, ClipboardList, Copy, Check, ShieldCheck, KeyRound } from "lucide-react";

interface AssignAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  preselectedSelectorId?: number | null;
  preselectedAssignmentId?: string | null;
}

export function AssignAssignmentModal({
  open,
  onClose,
  preselectedSelectorId = null,
  preselectedAssignmentId = null,
}: AssignAssignmentModalProps) {
  const { selectors, assignments, assignAssignment } = useTrainerStore();

  const [selectorId, setSelectorId] = useState<string>(
    preselectedSelectorId ? String(preselectedSelectorId) : ""
  );
  const [assignmentId, setAssignmentId] = useState(preselectedAssignmentId ?? "");
  const [successPin, setSuccessPin] = useState<string | null>(null);
  const [successSelector, setSuccessSelector] = useState<string>("");
  const [successAssignment, setSuccessAssignment] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectorId(preselectedSelectorId ? String(preselectedSelectorId) : "");
      setAssignmentId(preselectedAssignmentId ?? "");
      setSuccessPin(null);
      setCopied(false);
    }
  }, [open, preselectedSelectorId, preselectedAssignmentId]);

  if (!open) return null;

  const handleAssign = () => {
    if (!selectorId || !assignmentId) return;
    const selector = selectors.find((s) => s.id === Number(selectorId));
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!selector || !assignment) return;

    const pin = assignAssignment(Number(selectorId), assignmentId);
    setSuccessPin(pin);
    setSuccessSelector(selector.name);
    setSuccessAssignment(assignment.assignmentNumber);
  };

  const handleCopy = () => {
    if (successPin) {
      navigator.clipboard.writeText(successPin).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSuccessPin(null);
    setSelectorId("");
    setAssignmentId("");
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

        {successPin ? (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 mx-auto">
              <ShieldCheck className="h-8 w-8 text-green-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Training Registered</h2>
              <p className="mt-2 text-slate-400 text-sm">
                Assignment <span className="text-white font-bold">#{successAssignment}</span> assigned to{" "}
                <span className="text-white font-bold capitalize">{successSelector}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-yellow-400" />
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">NOVA User ID</p>
              </div>
              <p className="text-5xl font-black text-white tracking-[0.25em] my-3">{successPin}</p>
              <p className="text-xs text-slate-400">Give this code to the selector — they'll use it to start their NOVA session</p>

              <button
                onClick={handleCopy}
                className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <><Check className="h-4 w-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy Code</>
                )}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-yellow-400" /> Assign Training
              </h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                      {s.name} — {s.novaId}
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

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-yellow-500/60" />
                A unique NOVA user ID will be generated for the selector on assignment.
              </p>

              <button
                onClick={handleAssign}
                disabled={!selectorId || !assignmentId}
                className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Register Training &amp; Generate ID
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
