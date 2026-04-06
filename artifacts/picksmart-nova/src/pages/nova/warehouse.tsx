import { useListSlots, useListDoorCodes, useGetSystemDefaults } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, MapPin, DoorOpen, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WarehouseReferencePage() {
  const { data: slots, isLoading: loadingSlots } = useListSlots();
  const { data: doors, isLoading: loadingDoors } = useListDoorCodes();
  const { data: defaults, isLoading: loadingDefaults } = useGetSystemDefaults();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Warehouse Reference
        </h1>
        <p className="text-muted-foreground mt-2">System defaults and physical layout information.</p>
      </div>

      <Tabs defaultValue="defaults" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary border border-border">
          <TabsTrigger value="defaults" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Settings className="w-4 h-4 mr-2" /> System Defaults
          </TabsTrigger>
          <TabsTrigger value="doors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <DoorOpen className="w-4 h-4 mr-2" /> Doors & Staging
          </TabsTrigger>
          <TabsTrigger value="slots" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <MapPin className="w-4 h-4 mr-2" /> Slot Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="defaults">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Label & Printer Defaults</CardTitle>
              <CardDescription>Global values assigned when not explicitly set during assignment creation.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDefaults ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !defaults ? (
                <div className="text-center py-8 text-muted-foreground">Failed to load system defaults</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-secondary/30 border border-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Default Printer</p>
                      <p className="text-2xl font-bold">{defaults.printerNumber}</p>
                    </div>
                    <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center border border-border">
                      <LayoutGrid className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="bg-secondary/30 border border-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Alpha Label Base</p>
                      <p className="text-2xl font-bold font-mono">{defaults.alphaLabelNumber}</p>
                    </div>
                    <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center border border-border text-primary font-black">A</div>
                  </div>
                  <div className="bg-secondary/30 border border-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Bravo Label Base</p>
                      <p className="text-2xl font-bold font-mono">{defaults.bravoLabelNumber}</p>
                    </div>
                    <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center border border-border text-primary font-black">B</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doors">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DoorOpen className="h-5 w-5 text-primary" /> Door Staging Codes</CardTitle>
              <CardDescription>Required verification codes for dropping pallets at shipping doors.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDoors ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (!doors || doors.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">No doors configured</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doors.map((door) => (
                    <div key={door.id} className={`flex items-center justify-between p-4 border rounded-lg ${door.isActive ? 'border-border bg-secondary/20' : 'border-border bg-background opacity-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded border border-primary/20 flex items-center justify-center font-bold text-lg text-primary">
                          {door.doorNumber}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Door {door.doorNumber}</p>
                          <Badge variant="outline" className={door.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary'}>
                            {door.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-background border border-border px-3 py-1.5 rounded font-mono text-sm tracking-widest text-muted-foreground">
                        {door.stagingCode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Slot Master Extract</CardTitle>
              <CardDescription>Subset of active warehouse locations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSlots ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (!slots || slots.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">No slots found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Label</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Check Code</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <span className="text-primary">{slot.aisle}</span>-{slot.slot}{slot.level ? `-${slot.level}` : ''}
                          </td>
                          <td className="py-3 px-4">{slot.label}</td>
                          <td className="py-3 px-4">
                            <span className="bg-secondary border border-border px-2 py-1 rounded text-xs font-mono tracking-wider">{slot.checkCode}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={slot.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary'}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}