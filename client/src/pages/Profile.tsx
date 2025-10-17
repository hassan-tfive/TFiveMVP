import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Award, Mail, Building2, Users, Camera, Trophy } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const { data: stats } = useQuery<{
    totalSessions: number;
    currentStreak: number;
    completedPrograms: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName?: string; avatarUrl?: string }) => {
      return await apiRequest("PATCH", "/api/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setDisplayName("");
      setAvatarUrl("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    const updates: { displayName?: string; avatarUrl?: string } = {};
    
    if (displayName.trim()) {
      updates.displayName = displayName.trim();
    }
    
    if (avatarUrl.trim()) {
      updates.avatarUrl = avatarUrl.trim();
    }

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayNameValue = user.displayName || user.username;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.avatarUrl || undefined} alt={displayNameValue} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(displayNameValue)}
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full space-y-3">
              <div>
                <Label htmlFor="avatarUrl" className="text-sm">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  data-testid="input-avatar-url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleUpdateProfile}
                disabled={!avatarUrl.trim() && !displayName.trim()}
                className="w-full"
                data-testid="button-update-avatar"
              >
                <Camera className="w-4 h-4 mr-2" />
                Update Avatar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                <Input
                  id="displayName"
                  data-testid="input-display-name"
                  placeholder={displayNameValue}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Username</div>
                    <div className="text-sm text-muted-foreground">{user.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                {user.role && (
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Role</div>
                      <Badge variant="outline" className="mt-1">
                        {user.role === "admin" ? "Administrator" : user.role === "team_lead" ? "Team Lead" : "User"}
                      </Badge>
                    </div>
                  </div>
                )}

                {user.organizationId && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Organization</div>
                      <div className="text-sm text-muted-foreground">Organization ID: {user.organizationId}</div>
                    </div>
                  </div>
                )}

                {user.teamId && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Team</div>
                      <div className="text-sm text-muted-foreground">Team ID: {user.teamId}</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={!displayName.trim() && !avatarUrl.trim()}
                className="w-full"
                data-testid="button-update-profile"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Progress & Achievements
          </CardTitle>
          <CardDescription>Your journey with Tfive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">{user.level}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">{user.points.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
            {stats && (
              <>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{stats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
