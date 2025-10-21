import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, Crown } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small teams",
    icon: Zap,
    features: [
      "Up to 10 team members",
      "Basic analytics",
      "Email support",
      "Standard programs library",
      "Mobile app access",
    ],
    current: false,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For growing organizations",
    icon: Building2,
    features: [
      "Up to 100 team members",
      "Advanced analytics",
      "Priority support",
      "Custom programs",
      "API access",
      "Team management",
      "Custom integrations",
    ],
    current: true,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month",
    description: "Enterprise-grade solution",
    icon: Crown,
    features: [
      "Unlimited team members",
      "Real-time analytics",
      "24/7 dedicated support",
      "White-label solution",
      "Advanced AI features",
      "Custom deployment",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    current: false,
  },
];

export default function Plans() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold" data-testid="text-plans-title">
              Subscription Plans
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the perfect plan for your organization
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={plan.current ? "border-primary border-2" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      {plan.current && (
                        <Badge className="bg-primary text-primary-foreground">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant={plan.current ? "outline" : "default"}
                      disabled={plan.current}
                      data-testid={`button-select-${plan.name.toLowerCase()}`}
                    >
                      {plan.current ? "Current Plan" : "Upgrade to " + plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Need a custom plan?</CardTitle>
              <CardDescription>
                Contact our sales team for enterprise solutions tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" data-testid="button-contact-sales">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
