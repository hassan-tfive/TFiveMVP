import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, FileText, Clock } from "lucide-react";

export default function Billings() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold" data-testid="text-billings-title">
              Billings & Invoices
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your payment methods and view invoice history
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Current Plan */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Current Plan</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Enterprise Plan</CardTitle>
                    <CardDescription>Active subscription</CardDescription>
                  </div>
                  <Badge className="bg-green-600 text-white">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly billing</span>
                    <span className="text-lg font-bold">$99/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next billing date</span>
                    <span className="text-sm">December 21, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" data-testid="button-update-payment">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Update Payment Method
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-change-plan">
                      Change Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Payment Method</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credit Card</CardTitle>
                <CardDescription>Primary payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/2025</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice History */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Invoice History</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Invoices</CardTitle>
                <CardDescription>Your billing history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Nov 21, 2025", amount: "$99.00", status: "Paid" },
                    { date: "Oct 21, 2025", amount: "$99.00", status: "Paid" },
                    { date: "Sep 21, 2025", amount: "$99.00", status: "Paid" },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{invoice.date}</p>
                          <p className="text-xs text-muted-foreground">Invoice #{1000 + index}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-600 text-white">{invoice.status}</Badge>
                        <span className="text-sm font-medium">{invoice.amount}</span>
                        <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${index}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Charges */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Upcoming Charges</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <CardTitle className="text-base">Next Billing Cycle</CardTitle>
                </div>
                <CardDescription>Estimated charges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Enterprise Plan (Monthly)</p>
                    <p className="text-xs text-muted-foreground">Due on December 21, 2025</p>
                  </div>
                  <p className="text-lg font-bold">$99.00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
