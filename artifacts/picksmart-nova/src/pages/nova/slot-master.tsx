import { useState } from "react";
import { useListSlots } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SlotMasterPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: slots, isLoading } = useListSlots({ search: debouncedSearch });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            Slot Master
          </h1>
          <p className="text-muted-foreground mt-2">Search and verify physical warehouse locations.</p>
        </div>
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search slot, label, or check code..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (!slots || slots.length === 0) ? (
            <div className="text-center py-20 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No slots found matching "{search}"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location (Aisle-Slot-Level)</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Check Code</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Product Label</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-base">
                        <span className="text-primary">{slot.aisle}</span>-{slot.slot}{slot.level ? `-${slot.level}` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-secondary border border-border px-2 py-1 rounded text-sm font-mono tracking-widest">{slot.checkCode}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {slot.label}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={slot.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary text-muted-foreground'}>
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
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