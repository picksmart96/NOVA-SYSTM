import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Mic, Volume2 } from "lucide-react";

export default function VoiceCommandsPage() {
  const commands = [
    {
      category: "Navigation & Confirmation",
      items: [
        { command: "Ready", description: "Confirm you are ready to proceed to the next step or start picking." },
        { command: "[Check Code]", description: "Speak the 2-4 digit check code at the slot to verify location (e.g., '4 2')." },
        { command: "Short [Qty]", description: "Report that the slot doesn't have enough cases (e.g., 'Short 2')." },
        { command: "Skip", description: "Skip the current slot and return to it later in the assignment." },
      ]
    },
    {
      category: "System Information",
      items: [
        { command: "Say Again", description: "Repeats the last instruction given by NOVA." },
        { command: "Where Am I", description: "NOVA tells you your current expected aisle and slot." },
        { command: "How Much More", description: "NOVA tells you the remaining cases and stops for the assignment." },
        { command: "Pace", description: "NOVA tells you your current performance percentage vs the goal time." },
      ]
    },
    {
      category: "Control & Settings",
      items: [
        { command: "Pause", description: "Pauses the current assignment. Use this when going on break." },
        { command: "Louder / Softer", description: "Adjusts the volume of NOVA's voice." },
        { command: "Faster / Slower", description: "Adjusts the speaking speed of NOVA's voice." },
        { command: "Change Battery", description: "Logs a battery change event and pauses." },
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Headphones className="h-8 w-8 text-primary" />
          Voice Commands
        </h1>
        <p className="text-muted-foreground mt-2">Reference guide for all supported NOVA voice interactions.</p>
      </div>

      <div className="space-y-8">
        {commands.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
              {idx === 0 ? <Mic className="h-5 w-5 text-primary" /> : idx === 1 ? <Volume2 className="h-5 w-5 text-primary" /> : <Headphones className="h-5 w-5 text-primary" />}
              {section.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item, i) => (
                <Card key={i} className="border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="font-mono text-primary font-bold text-lg mb-2">"{item.command}"</div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}