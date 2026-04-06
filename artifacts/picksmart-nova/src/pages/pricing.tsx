import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      price: "$299",
      period: "/month per facility",
      description: "Basic training and assignment tracking for small operations.",
      features: [
        "Up to 50 active selectors",
        "Basic training modules",
        "Standard assignment tracking",
        "Weekly reporting",
        "Email support"
      ],
      cta: "Start Free Trial",
      highlighted: false
    },
    {
      name: "Professional",
      price: "$799",
      period: "/month per facility",
      description: "Advanced voice simulation and live tracking for growing teams.",
      features: [
        "Up to 200 active selectors",
        "All training modules + Voice Simulation",
        "Live selector tracking",
        "Real-time performance metrics",
        "Priority support",
        "Custom door & slot configurations"
      ],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: " pricing",
      description: "Full-scale industrial deployment across multiple facilities.",
      features: [
        "Unlimited selectors",
        "Multi-facility management",
        "Custom training content creation",
        "API access & WMS integration",
        "Dedicated success manager",
        "24/7 phone support"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Industrial Pricing for Real Operations</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Equip your facility with the tools to train faster and pick smarter. Choose the tier that matches your scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`flex flex-col border-2 ${tier.highlighted ? 'border-primary shadow-lg shadow-primary/10 relative' : 'border-border bg-card'}`}
          >
            {tier.highlighted && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">MOST POPULAR</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-4xl font-black text-foreground">{tier.price}</span>
                <span className="text-sm text-muted-foreground font-medium">{tier.period}</span>
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${tier.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full font-bold ${tier.highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                variant={tier.highlighted ? 'default' : 'outline'}
              >
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}