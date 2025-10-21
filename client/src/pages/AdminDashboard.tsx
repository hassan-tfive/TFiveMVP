import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, TrendingUp, Target, Award, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { Organization, Team, User } from "@shared/schema";

interface EngagementAnalytics {
  activeUsers: number;
  totalUsers: number;
  completedSessions: number;
  completionRate: number;
  popularPrograms: any[];
}

interface WellbeingAnalytics {
  averageLevel: number;
  averageStreak: number;
  averageSessions: number;
  topPerformers: any[];
  atRisk: any[];
}

export default function AdminDashboard() {
  // Fetch organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const orgId = organizations[0]?.id;

  // Fetch teams for the organization
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/admin/organizations", orgId, "teams"],
    enabled: !!orgId,
  });

  // Fetch users for the organization
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/organizations", orgId, "users"],
    enabled: !!orgId,
  });

  // Fetch engagement analytics
  const { data: engagement } = useQuery<EngagementAnalytics>({
    queryKey: ["/api/admin/analytics/engagement"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/engagement?organizationId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch engagement analytics");
      return res.json();
    },
    enabled: !!orgId,
  });

  // Fetch wellbeing analytics
  const { data: wellbeing } = useQuery<WellbeingAnalytics>({
    queryKey: ["/api/admin/analytics/wellbeing"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/wellbeing?organizationId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch wellbeing analytics");
      return res.json();
    },
    enabled: !!orgId,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold" data-testid="text-admin-title">
                Enterprise Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Team management, analytics, and wellbeing insights
              </p>
            </div>
            <Link href="/admin/team">
              <Button data-testid="button-manage-teams">
                <Users className="mr-2 h-4 w-4" />
                Manage Teams
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Organization Overview */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Organization Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organization</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-org-name">
                    {organizations[0]?.name || "No Organization"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teams.length} teams, {users.length} members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-users">
                    {engagement?.activeUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {engagement?.totalUsers || 0} total users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-completion-rate">
                    {engagement?.completionRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {engagement?.completedSessions || 0} sessions completed
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Teams */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {users.filter((u) => u.teamId === team.id).length} members
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Engagement Analytics */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Engagement Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Popular Programs</CardTitle>
                  <CardDescription>Most completed programs this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {engagement?.popularPrograms.slice(0, 3).map((program) => (
                      <div key={program.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{program.title}</p>
                          <p className="text-xs text-muted-foreground">{program.category}</p>
                        </div>
                        <Badge className="bg-slate-600 text-white">{program.difficulty}</Badge>
                      </div>
                    ))}
                    {!engagement?.popularPrograms.length && (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Wellbeing</CardTitle>
                  <CardDescription>Average team performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Level</span>
                      <span className="text-sm font-bold">{wellbeing?.averageLevel || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Streak</span>
                      <span className="text-sm font-bold">{wellbeing?.averageStreak || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Sessions</span>
                      <span className="text-sm font-bold">{wellbeing?.averageSessions || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Performers & At Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Top Performers
                </CardTitle>
                <CardDescription>Users with highest points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wellbeing?.topPerformers.slice(0, 5).map((user) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <span className="text-sm">{user.username}</span>
                      <Badge className="bg-green-600 text-white">
                        Level {user.level} • {user.points} pts
                      </Badge>
                    </div>
                  ))}
                  {!wellbeing?.topPerformers.length && (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  At Risk Users
                </CardTitle>
                <CardDescription>Users needing support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wellbeing?.atRisk.slice(0, 5).map((user) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <span className="text-sm">{user.username}</span>
                      <Badge className="bg-orange-600 text-white">
                        {user.completedSessions} sessions
                      </Badge>
                    </div>
                  ))}
                  {!wellbeing?.atRisk.length && (
                    <p className="text-sm text-muted-foreground">All users engaged</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
