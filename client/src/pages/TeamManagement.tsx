import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Mail, Copy, CheckCircle2 } from "lucide-react";
import type { Organization, Team, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  teamId: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

export default function TeamManagement() {
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitedToken, setInvitedToken] = useState<string | null>(null);

  // Fetch organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const orgId = organizations[0]?.id;

  // Fetch teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/admin/organizations", orgId, "teams"],
    enabled: !!orgId,
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/organizations", orgId, "users"],
    enabled: !!orgId,
  });

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      teamId: "",
    },
  });

  const inviteUser = useMutation({
    mutationFn: async (data: InviteForm) => {
      const res = await apiRequest("POST", "/api/admin/invitations", {
        email: data.email,
        organizationId: orgId,
        teamId: data.teamId || null,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setInvitedToken(data.token);
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${form.getValues("email")}`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId, "users"] });
    },
    onError: () => {
      toast({
        title: "Failed to send invitation",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteForm) => {
    inviteUser.mutate(data);
  };

  const copyInviteLink = () => {
    if (invitedToken) {
      const link = `${window.location.origin}/signup/${invitedToken}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold" data-testid="text-team-management-title">
                Team Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your teams and invite new members
              </p>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-member">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="user@example.com"
                              data-testid="input-invite-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team (Optional)</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              data-testid="select-team"
                            >
                              <option value="">No team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {invitedToken && (
                      <div className="p-4 rounded-md bg-muted space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Invitation created!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Share this link with the invited user
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-xs bg-background px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                                {window.location.origin}/signup/{invitedToken}
                              </code>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={copyInviteLink}
                                data-testid="button-copy-link"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setInviteDialogOpen(false);
                          setInvitedToken(null);
                          form.reset();
                        }}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        type="submit"
                        disabled={inviteUser.isPending}
                        className="flex-1"
                        data-testid="button-send-invitation"
                      >
                        {inviteUser.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Teams Overview */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.map((team) => {
                const teamUsers = users.filter((u) => u.teamId === team.id);
                return (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {teamUsers.length} members
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {teams.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">No teams yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* All Users */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Members ({users.length})</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {users.map((user) => {
                    const userTeam = teams.find((t) => t.id === user.teamId);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover-elevate"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {user.username.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.displayName || user.username}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {userTeam && (
                            <Badge variant="secondary">{userTeam.name}</Badge>
                          )}
                          {user.role === "admin" && (
                            <Badge className="bg-brand-navy text-white">Admin</Badge>
                          )}
                          <Badge className="bg-slate-600 text-white">
                            Level {user.level}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                      No members yet. Invite your first team member!
                    </div>
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
