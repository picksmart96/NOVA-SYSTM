import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, ShieldAlert, XCircle } from "lucide-react";

export default function CommonMistakesPage() {
  const mistakes = [
    {
      id: 1,
      title: "Mispick (Wrong Item)",
      description: "Selecting a similar looking item instead of the required one. Often happens with flavor variants or different sizes of the same brand.",
      prevention: "Always verify the check digit and scan the barcode. Don't rely solely on visual appearance. Read the label description carefully.",
      icon: XCircle,
      severity: "High"
    },
    {
      id: 2,
      title: "Short Pick (Missing Quantity)",
      description: "Grabbing fewer cases than requested by the system. E.g., picking 4 cases instead of 5.",
      prevention: "Count aloud as you place cases on the pallet. Confirm the final quantity matches the NOVA prompt before saying 'Ready'.",
      icon: AlertCircle,
      severity: "Medium"
    },
    {
      id: 3,
      title: "Over Pick (Extra Quantity)",
      description: "Grabbing more cases than requested, which throws off inventory and frustrates receivers.",
      prevention: "Double-check the requested quantity. Don't assume you need to empty the slot just because it's almost empty.",
      icon: ArrowRight,
      severity: "Medium"
    },
    {
      id: 4,
      title: "Bad Stacking (Crush Damage)",
      description: "Placing heavy items on top of fragile items, or creating an unstable pallet that leans or falls during transit.",
      prevention: "Follow the Ti-Hi rules. Build a solid base with heavy, square cases. Keep fragile items (chips, light boxes) for the top layers. Interlock cases like bricks.",
      icon: ShieldAlert,
      severity: "High"
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Common Mistakes</h1>
        <p className="text-muted-foreground mt-2">Learn how to prevent the most frequent selector errors to maintain high accuracy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mistakes.map((mistake) => (
          <Card key={mistake.id} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <mistake.icon className="h-5 w-5 text-primary" />
                  {mistake.title}
                </CardTitle>
                <span className={`text-xs font-bold px-2 py-1 rounded-sm ${mistake.severity === 'High' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {mistake.severity} Risk
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">The Mistake</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{mistake.description}</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-md border border-border">
                <h4 className="text-sm font-bold text-primary mb-1">Prevention</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{mistake.prevention}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}