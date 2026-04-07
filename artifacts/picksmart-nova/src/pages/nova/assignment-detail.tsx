import { useRoute, Link, useLocation } from "wouter";
import { ASSIGNMENTS } from "@/data/assignments";
import { ASSIGNMENT_STOPS } from "@/data/assignmentStops";
import { DoorOpen, ArrowLeft, Printer, Tag } from "lucide-react";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    active: "bg-blue-500/20 text-blue-300",
    completed: "bg-green-500/20 text-green-300",
    archived: "bg-slate-500/20 text-slate-300",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${map[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
      type === "PRODUCTION"
        ? "bg-orange-500/20 text-orange-300"
        : "bg-blue-500/20 text-blue-300"
    }`}>
      {type}
    </span>
  );
}

function StopTable({ stops }: { stops: ReturnType<typeof ASSIGNMENT_STOPS.filter> }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Assignment Stops</h2>
        <p className="mt-2 text-slate-400">Route sequence for this assignment.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-sm font-bold text-slate-300">Order</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-300">Aisle</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-300">Slot</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-300">Check Code</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-300">Qty</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, index) => (
              <tr
                key={stop.id}
                className={index % 2 === 0 ? "bg-slate-900" : "bg-slate-950/60"}
              >
                <td className="px-4 py-3 font-semibold text-white">{stop.stopOrder}</td>
                <td className="px-4 py-3 text-white">{stop.aisle}</td>
                <td className="px-4 py-3 text-white">{stop.slot}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-xl bg-sky-500/15 px-3 py-1 font-bold text-sky-300 tracking-widest">
                    {stop.checkCode}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-white">{stop.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const [, params] = useRoute("/nova/assignments/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "";

  const assignment =
    ASSIGNMENTS.find((a) => a.id === id) ||
    ASSIGNMENTS.find((a) => a.assignmentNumber === id);

  const stops = assignment
    ? ASSIGNMENT_STOPS.filter((s) => s.assignmentId === assignment.id).sort(
        (a, b) => a.stopOrder - b.stopOrder
      )
    : [];

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-lg text-center">
            <h1 className="text-3xl font-black">Assignment not found</h1>
            <p className="mt-4 text-slate-400">The assignment you tried to open does not exist.</p>
            <button
              onClick={() => navigate(-1 as any)}
              className="mt-8 rounded-2xl border border-slate-700 px-5 py-3 font-semibold hover:border-yellow-400 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={assignment.status} />
              <TypeBadge type={assignment.type} />
            </div>
            <h1 className="mt-4 text-4xl font-black text-white">
              Assignment #{assignment.assignmentNumber}
            </h1>
            <p className="mt-3 text-slate-400">
              {assignment.title} · Selector:{" "}
              <span className="text-white font-semibold">{assignment.selectorUserId}</span>
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1 as any)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Link
              href="/nova-trainer"
              className="rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              Open in NOVA Trainer
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard label="Assignment" value={`#${assignment.assignmentNumber}`} />
          <StatCard label="Aisles" value={`${assignment.startAisle} → ${assignment.endAisle}`} />
          <StatCard label="Total Cases" value={assignment.totalCases} />
          <StatCard label="Pallets" value={assignment.totalPallets} />
          <StatCard label="Goal Time" value={`${assignment.goalTimeMinutes}m`} />
          <StatCard label="Stops" value={assignment.stops} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-bold">Assignment Info</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-sm text-slate-400">Type</p>
                <p className="mt-2 font-semibold text-white">{assignment.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="mt-2 font-semibold text-white capitalize">{assignment.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Selector</p>
                <p className="mt-2 font-semibold text-white">{assignment.selectorUserId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Voice Mode</p>
                <p className="mt-2 font-semibold text-white capitalize">{assignment.voiceMode.replace("_", " ")}</p>
              </div>
              <div className="flex items-start gap-2">
                <DoorOpen className="h-4 w-4 text-slate-400 mt-2.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-400">Door</p>
                  <p className="mt-2 font-bold text-yellow-300 text-lg">{assignment.doorNumber} · Code {assignment.doorCode}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Printer className="h-4 w-4 text-slate-400 mt-2.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-400">Printer / Labels</p>
                  <p className="mt-2 font-semibold text-white">
                    {assignment.printerNumber} · α{assignment.alphaLabelNumber} · β{assignment.bravoLabelNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-bold">Voice Flow Summary</h2>
            <div className="mt-6 space-y-4 text-slate-300">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="font-semibold text-white">Start</p>
                <p className="mt-2 text-sm">
                  NOVA reads aisle range, total cases ({assignment.totalCases}), pallets ({assignment.totalPallets}), and goal time ({assignment.goalTimeMinutes}m).
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="font-semibold text-white">Pick Flow</p>
                <p className="mt-2 text-sm">
                  NOVA prompts: aisle, slot, check code, then quantity after valid confirmation.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="font-semibold text-white">Completion</p>
                <p className="mt-2 text-sm">
                  Printer {assignment.printerNumber} → Alpha {assignment.alphaLabelNumber} → Bravo {assignment.bravoLabelNumber} → Door {assignment.doorNumber} code {assignment.doorCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <StopTable stops={stops} />
      </div>
    </div>
  );
}
