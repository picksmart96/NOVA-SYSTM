import { useState } from "react";
import { useListSlots } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SlotMasterPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: slots, isLoading } = useListSlots({ search: debouncedSearch });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-slate-950" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Slot Master</h1>
            </div>
            <p className="text-slate-400 text-sm mt-2 ml-1">
              80 active locations from assignments 251736 · 251737 · 251738
            </p>
          </div>
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Aisle, slot, check code, or label..."
              className="pl-9 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-11 w-full bg-slate-800" />
              ))}
            </div>
          ) : (!slots || slots.length === 0) ? (
            <div className="text-center py-20 text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-semibold">No slots found{search ? ` for "${search}"` : ""}</p>
              <p className="text-sm mt-1 text-slate-600">Try searching by aisle, slot number, check code, or product label</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60">
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Location</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Aisle</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Slot</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Level</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Check Code</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Product Label</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-5 font-black text-base text-white tracking-wide">
                        <span className="text-yellow-400">{slot.aisle}</span>
                        <span className="text-slate-500">-</span>
                        <span>{String(slot.slot).padStart(3, "0")}</span>
                        {slot.level && (
                          <>
                            <span className="text-slate-500">-</span>
                            <span className="text-yellow-300">{slot.level}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-5 text-slate-300 font-semibold">{slot.aisle}</td>
                      <td className="py-3 px-5 text-slate-300 font-semibold">{slot.slot}</td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-bold">
                          {slot.level ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono tracking-widest text-base font-bold bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-100">
                          {slot.checkCode}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-sm font-semibold text-slate-300">{slot.label}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          slot.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}>
                          {slot.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600 font-medium">
                {slots.length} slot{slots.length !== 1 ? "s" : ""} {search ? "found" : "total"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
