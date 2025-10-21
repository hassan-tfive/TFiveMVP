import {
  type Organization,
  type InsertOrganization,
  type Team,
  type InsertTeam,
  type User,
  type InsertUser,
  type Invitation,
  type InsertInvitation,
  type Program,
  type InsertProgram,
  type Session,
  type InsertSession,
  type Progress,
  type InsertProgress,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type ChatMessage,
  type InsertChatMessage,
  type SessionEvent,
  type InsertSessionEvent,
  type Reflection,
  type InsertReflection,
  type RewardCatalog,
  type InsertRewardCatalog,
  type Redemption,
  type InsertRedemption,
  type Identity,
  type InsertIdentity,
  type Loop,
  type InsertLoop,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getOrganizationTeams(organizationId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getOrganizationUsers(organizationId: string): Promise<User[]>;
  getTeamUsers(teamId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: { id: string; email: string; username: string; displayName?: string | null; avatarUrl?: string | null }): Promise<User>;

  // Invitation operations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getOrganizationInvitations(organizationId: string): Promise<Invitation[]>;
  updateInvitation(id: string, updates: Partial<Invitation>): Promise<Invitation | undefined>;

  // Program operations
  getPrograms(workspace?: string): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;

  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  getUserSessions(userId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;

  // Progress operations
  getUserProgress(userId: string): Promise<Progress[]>;
  createProgress(progress: InsertProgress): Promise<Progress>;

  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // User achievement operations
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;

  // Chat operations
  getChatMessages(userId: string, workspace: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Session event operations
  getSessionEvents(sessionId: string): Promise<SessionEvent[]>;
  createSessionEvent(event: InsertSessionEvent): Promise<SessionEvent>;

  // Reflection operations
  getSessionReflection(sessionId: string): Promise<Reflection | undefined>;
  createReflection(reflection: InsertReflection): Promise<Reflection>;

  // Reward catalog operations
  getRewardCatalog(organizationId?: string): Promise<RewardCatalog[]>;
  createReward(reward: InsertRewardCatalog): Promise<RewardCatalog>;

  // Redemption operations
  getUserRedemptions(userId: string): Promise<Redemption[]>;
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  updateRedemption(id: string, updates: Partial<Redemption>): Promise<Redemption | undefined>;

  // Stats
  getUserStats(userId: string): Promise<{ completedSessions: number; streak: number }>;

  // Identity operations (for Tairo space separation)
  getUserIdentity(userId: string, space: string): Promise<Identity | undefined>;
  createIdentity(identity: InsertIdentity): Promise<Identity>;

  // Loop operations (25-minute session units)
  getLoop(id: string): Promise<Loop | undefined>;
  getProgramLoops(programId: string): Promise<Loop[]>;
  createLoop(loop: InsertLoop): Promise<Loop>;
  updateLoop(id: string, updates: Partial<Loop>): Promise<Loop | undefined>;
  
  // Analytics event operations
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(organizationId: string | null, space: string): Promise<AnalyticsEvent[]>;
}

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization>;
  private teams: Map<string, Team>;
  private users: Map<string, User>;
  private invitations: Map<string, Invitation>;
  private programs: Map<string, Program>;
  private sessions: Map<string, Session>;
  private progress: Map<string, Progress>;
  private achievements: Map<string, Achievement>;
  private userAchievements: Map<string, UserAchievement>;
  private chatMessages: Map<string, ChatMessage>;
  private sessionEvents: Map<string, SessionEvent>;
  private reflections: Map<string, Reflection>;
  private rewardCatalog: Map<string, RewardCatalog>;
  private redemptions: Map<string, Redemption>;
  private identities: Map<string, Identity>;
  private loops: Map<string, Loop>;
  private analyticsEvents: Map<string, AnalyticsEvent>;

  constructor() {
    this.organizations = new Map();
    this.teams = new Map();
    this.users = new Map();
    this.invitations = new Map();
    this.programs = new Map();
    this.sessions = new Map();
    this.progress = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.chatMessages = new Map();
    this.sessionEvents = new Map();
    this.reflections = new Map();
    this.rewardCatalog = new Map();
    this.redemptions = new Map();
    this.identities = new Map();
    this.loops = new Map();
    this.analyticsEvents = new Map();
    
    // Initialize with default user
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultUser: User = {
      id: "default-user",
      username: "demo",
      email: "demo@tfive.com",
      displayName: null,
      avatarUrl: null,
      role: "user",
      organizationId: null,
      teamId: null,
      currentWorkspace: "professional",
      points: 0,
      level: 1,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, org);
    return org;
  }

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter((t) => t.organizationId === organizationId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      ...insertTeam,
      description: insertTeam.description ?? null,
      id,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updated = { ...team, ...updates };
    this.teams.set(id, updated);
    return updated;
  }

  async getOrganizationUsers(organizationId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((u) => u.organizationId === organizationId);
  }

  async getTeamUsers(teamId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((u) => u.teamId === teamId);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      displayName: insertUser.displayName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      organizationId: insertUser.organizationId ?? null,
      teamId: insertUser.teamId ?? null,
      role: insertUser.role ?? "user",
      currentWorkspace: insertUser.currentWorkspace ?? "professional",
      points: insertUser.points ?? 0,
      level: insertUser.level ?? 1,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async upsertUser(userData: { id: string; email: string; username: string; displayName?: string | null; avatarUrl?: string | null }): Promise<User> {
    const existing = this.users.get(userData.id);
    if (existing) {
      // Update existing user
      const updated: User = {
        ...existing,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName ?? existing.displayName,
        avatarUrl: userData.avatarUrl ?? existing.avatarUrl,
      };
      this.users.set(userData.id, updated);
      return updated;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName ?? null,
        avatarUrl: userData.avatarUrl ?? null,
        passwordHash: null,
        role: "user",
        organizationId: null,
        teamId: null,
        currentWorkspace: "professional",
        points: 0,
        level: 1,
        createdAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  // Invitation operations
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const id = randomUUID();
    const invitation: Invitation = {
      id,
      ...insertInvitation,
      status: "pending",
      acceptedAt: null,
      createdAt: new Date(),
    };
    this.invitations.set(id, invitation);
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    return Array.from(this.invitations.values()).find((inv) => inv.token === token);
  }

  async getOrganizationInvitations(organizationId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values())
      .filter((inv) => inv.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateInvitation(id: string, updates: Partial<Invitation>): Promise<Invitation | undefined> {
    const invitation = this.invitations.get(id);
    if (!invitation) return undefined;
    const updated = { ...invitation, ...updates };
    this.invitations.set(id, updated);
    return updated;
  }

  // Program operations
  async getPrograms(workspace?: string): Promise<Program[]> {
    const programs = Array.from(this.programs.values());
    if (workspace) {
      return programs.filter((p) => p.workspace === workspace || p.workspace === "both");
    }
    return programs;
  }

  async getProgram(id: string): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const id = randomUUID();
    const program: Program = {
      ...insertProgram,
      imageUrl: insertProgram.imageUrl ?? null,
      domain: insertProgram.domain ?? null,
      goal: insertProgram.goal ?? null,
      durationLearn: insertProgram.durationLearn ?? null,
      durationAct: insertProgram.durationAct ?? null,
      durationEarn: insertProgram.durationEarn ?? null,
      metadata: insertProgram.metadata ?? null,
      id,
      createdAt: new Date(),
    };
    this.programs.set(id, program);
    return program;
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      mood: insertSession.mood ?? null,
      focus: insertSession.focus ?? null,
      goal: insertSession.goal ?? null,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<Progress[]> {
    return Array.from(this.progress.values()).filter((p) => p.userId === userId);
  }

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const id = randomUUID();
    const progress: Progress = {
      ...insertProgress,
      completed: insertProgress.completed ?? false,
      id,
      completedAt: null,
    };
    this.progress.set(id, progress);
    return progress;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = {
      ...insertAchievement,
      id,
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  // User achievement operations
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values()).filter((ua) => ua.userId === userId);
  }

  async createUserAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const userAchievement: UserAchievement = {
      ...insertUserAchievement,
      id,
      unlockedAt: new Date(),
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }

  // Chat operations
  async getChatMessages(userId: string, workspace: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((m) => m.userId === userId && m.workspace === workspace)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Session event operations
  async getSessionEvents(sessionId: string): Promise<SessionEvent[]> {
    return Array.from(this.sessionEvents.values())
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createSessionEvent(insertEvent: InsertSessionEvent): Promise<SessionEvent> {
    const id = randomUUID();
    const event: SessionEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.sessionEvents.set(id, event);
    return event;
  }

  // Reflection operations
  async getSessionReflection(sessionId: string): Promise<Reflection | undefined> {
    return Array.from(this.reflections.values()).find((r) => r.sessionId === sessionId);
  }

  async createReflection(insertReflection: InsertReflection): Promise<Reflection> {
    const id = randomUUID();
    const reflection: Reflection = {
      ...insertReflection,
      sentiment: insertReflection.sentiment ?? null,
      score: insertReflection.score ?? null,
      id,
      createdAt: new Date(),
    };
    this.reflections.set(id, reflection);
    return reflection;
  }

  // Reward catalog operations
  async getRewardCatalog(organizationId?: string): Promise<RewardCatalog[]> {
    const rewards = Array.from(this.rewardCatalog.values()).filter((r) => r.isActive);
    if (organizationId) {
      return rewards.filter((r) => r.organizationId === organizationId || r.provider === "sponsor");
    }
    return rewards;
  }

  async createReward(insertReward: InsertRewardCatalog): Promise<RewardCatalog> {
    const id = randomUUID();
    const reward: RewardCatalog = {
      ...insertReward,
      organizationId: insertReward.organizationId ?? null,
      description: insertReward.description ?? null,
      metadata: insertReward.metadata ?? null,
      isActive: insertReward.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.rewardCatalog.set(id, reward);
    return reward;
  }

  // Redemption operations
  async getUserRedemptions(userId: string): Promise<Redemption[]> {
    return Array.from(this.redemptions.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime());
  }

  async createRedemption(insertRedemption: InsertRedemption): Promise<Redemption> {
    const id = randomUUID();
    const redemption: Redemption = {
      ...insertRedemption,
      id,
      redeemedAt: new Date(),
      fulfilledAt: null,
    };
    this.redemptions.set(id, redemption);
    return redemption;
  }

  async updateRedemption(id: string, updates: Partial<Redemption>): Promise<Redemption | undefined> {
    const redemption = this.redemptions.get(id);
    if (!redemption) return undefined;
    const updated = { ...redemption, ...updates };
    this.redemptions.set(id, updated);
    return updated;
  }

  // Stats
  async getUserStats(userId: string): Promise<{ completedSessions: number; streak: number }> {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.status === "completed"
    );
    
    // Simple streak calculation (consecutive days)
    const completedDates = sessions
      .filter((s) => s.completedAt)
      .map((s) => s.completedAt!.toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort();

    let streak = 0;
    const today = new Date().toDateString();
    if (completedDates.includes(today)) {
      streak = 1;
      for (let i = completedDates.length - 2; i >= 0; i--) {
        const date = new Date(completedDates[i]);
        const nextDate = new Date(completedDates[i + 1]);
        const diffDays = Math.floor((nextDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      completedSessions: sessions.length,
      streak,
    };
  }

  // Identity operations (for Tairo space separation)
  async getUserIdentity(userId: string, space: string): Promise<Identity | undefined> {
    return Array.from(this.identities.values()).find(
      (i) => i.userId === userId && i.space === space
    );
  }

  async createIdentity(identity: InsertIdentity): Promise<Identity> {
    const newIdentity: Identity = {
      id: randomUUID(),
      ...identity,
      createdAt: new Date(),
    };
    this.identities.set(newIdentity.id, newIdentity);
    return newIdentity;
  }

  // Loop operations (25-minute session units)
  async getLoop(id: string): Promise<Loop | undefined> {
    return this.loops.get(id);
  }

  async getProgramLoops(programId: string): Promise<Loop[]> {
    return Array.from(this.loops.values())
      .filter((l) => l.programId === programId)
      .sort((a, b) => a.index - b.index);
  }

  async createLoop(loop: InsertLoop): Promise<Loop> {
    const newLoop: Loop = {
      id: randomUUID(),
      ...loop,
      createdAt: new Date(),
    };
    this.loops.set(newLoop.id, newLoop);
    return newLoop;
  }

  async updateLoop(id: string, updates: Partial<Loop>): Promise<Loop | undefined> {
    const loop = this.loops.get(id);
    if (!loop) return undefined;
    const updatedLoop = { ...loop, ...updates };
    this.loops.set(id, updatedLoop);
    return updatedLoop;
  }
  
  // Analytics event operations
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const newEvent: AnalyticsEvent = {
      id: randomUUID(),
      ...event,
      createdAt: new Date(),
    };
    this.analyticsEvents.set(newEvent.id, newEvent);
    return newEvent;
  }

  async getAnalyticsEvents(organizationId: string | null, space: string): Promise<AnalyticsEvent[]> {
    return Array.from(this.analyticsEvents.values())
      .filter((e) => {
        const orgMatch = organizationId 
          ? e.organizationId === organizationId 
          : e.organizationId === null;
        return orgMatch && e.space === space;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, and, desc, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database storage implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool, { schema });
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, id));
    return org;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await this.db.select().from(schema.organizations);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await this.db
      .insert(schema.organizations)
      .values(insertOrg)
      .returning();
    return org;
  }

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await this.db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.id, id));
    return team;
  }

  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return await this.db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.organizationId, organizationId));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await this.db
      .insert(schema.teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const [team] = await this.db
      .update(schema.teams)
      .set(updates)
      .where(eq(schema.teams.id, id))
      .returning();
    return team;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user;
  }

  async getOrganizationUsers(organizationId: string): Promise<User[]> {
    return await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.organizationId, organizationId));
  }

  async getTeamUsers(teamId: string): Promise<User[]> {
    return await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.teamId, teamId));
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const [user] = await this.db
      .insert(schema.users)
      .values(insertUser as any)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await this.db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: { id: string; email: string; username: string; displayName?: string | null; avatarUrl?: string | null }): Promise<User> {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName ?? null,
        avatarUrl: userData.avatarUrl ?? null,
        passwordHash: null,
        role: "user",
        currentWorkspace: "professional",
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          email: userData.email,
          username: userData.username,
          displayName: userData.displayName,
          avatarUrl: userData.avatarUrl,
        },
      })
      .returning();
    return user;
  }

  // Invitation operations
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const [invitation] = await this.db
      .insert(schema.invitations)
      .values(insertInvitation as any)
      .returning();
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await this.db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.token, token));
    return invitation;
  }

  async updateInvitation(id: string, updates: Partial<Invitation>): Promise<Invitation | undefined> {
    const [invitation] = await this.db
      .update(schema.invitations)
      .set(updates)
      .where(eq(schema.invitations.id, id))
      .returning();
    return invitation;
  }

  // Program operations
  async getPrograms(workspace?: string): Promise<Program[]> {
    if (workspace) {
      const { or } = await import("drizzle-orm");
      return await this.db
        .select()
        .from(schema.programs)
        .where(
          or(
            eq(schema.programs.workspace, workspace),
            eq(schema.programs.workspace, "both")
          )
        );
    }
    return await this.db.select().from(schema.programs);
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await this.db
      .select()
      .from(schema.programs)
      .where(eq(schema.programs.id, id));
    return program;
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const [program] = await this.db
      .insert(schema.programs)
      .values(insertProgram)
      .returning();
    return program;
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id));
    return session;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .orderBy(desc(schema.sessions.startedAt));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await this.db
      .insert(schema.sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const [session] = await this.db
      .update(schema.sessions)
      .set(updates)
      .where(eq(schema.sessions.id, id))
      .returning();
    return session;
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<Progress[]> {
    return await this.db
      .select()
      .from(schema.progress)
      .where(eq(schema.progress.userId, userId));
  }

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const [progress] = await this.db
      .insert(schema.progress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await this.db.select().from(schema.achievements);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await this.db
      .insert(schema.achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }

  // User achievement operations
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, userId));
  }

  async createUserAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [userAchievement] = await this.db
      .insert(schema.userAchievements)
      .values(insertUserAchievement)
      .returning();
    return userAchievement;
  }

  // Chat operations
  async getChatMessages(userId: string, workspace: string): Promise<ChatMessage[]> {
    return await this.db
      .select()
      .from(schema.chatMessages)
      .where(
        and(
          eq(schema.chatMessages.userId, userId),
          eq(schema.chatMessages.workspace, workspace)
        )
      )
      .orderBy(schema.chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await this.db
      .insert(schema.chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Session event operations
  async getSessionEvents(sessionId: string): Promise<SessionEvent[]> {
    return await this.db
      .select()
      .from(schema.sessionEvents)
      .where(eq(schema.sessionEvents.sessionId, sessionId))
      .orderBy(schema.sessionEvents.createdAt);
  }

  async createSessionEvent(insertEvent: InsertSessionEvent): Promise<SessionEvent> {
    const [event] = await this.db
      .insert(schema.sessionEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Reflection operations
  async getSessionReflection(sessionId: string): Promise<Reflection | undefined> {
    const [reflection] = await this.db
      .select()
      .from(schema.reflections)
      .where(eq(schema.reflections.sessionId, sessionId));
    return reflection;
  }

  async createReflection(insertReflection: InsertReflection): Promise<Reflection> {
    const [reflection] = await this.db
      .insert(schema.reflections)
      .values(insertReflection)
      .returning();
    return reflection;
  }

  // Reward catalog operations
  async getRewardCatalog(organizationId?: string): Promise<RewardCatalog[]> {
    if (organizationId) {
      const { or } = await import("drizzle-orm");
      return await this.db
        .select()
        .from(schema.rewardCatalog)
        .where(
          and(
            eq(schema.rewardCatalog.isActive, true),
            or(
              eq(schema.rewardCatalog.organizationId, organizationId),
              eq(schema.rewardCatalog.provider, "sponsor")
            )
          )
        );
    }
    return await this.db
      .select()
      .from(schema.rewardCatalog)
      .where(eq(schema.rewardCatalog.isActive, true));
  }

  async createReward(insertReward: InsertRewardCatalog): Promise<RewardCatalog> {
    const [reward] = await this.db
      .insert(schema.rewardCatalog)
      .values(insertReward)
      .returning();
    return reward;
  }

  // Redemption operations
  async getUserRedemptions(userId: string): Promise<Redemption[]> {
    return await this.db
      .select()
      .from(schema.redemptions)
      .where(eq(schema.redemptions.userId, userId))
      .orderBy(desc(schema.redemptions.redeemedAt));
  }

  async createRedemption(insertRedemption: InsertRedemption): Promise<Redemption> {
    const [redemption] = await this.db
      .insert(schema.redemptions)
      .values(insertRedemption)
      .returning();
    return redemption;
  }

  async updateRedemption(id: string, updates: Partial<Redemption>): Promise<Redemption | undefined> {
    const [redemption] = await this.db
      .update(schema.redemptions)
      .set(updates)
      .where(eq(schema.redemptions.id, id))
      .returning();
    return redemption;
  }

  // Stats
  async getUserStats(userId: string): Promise<{ completedSessions: number; streak: number }> {
    const sessions = await this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          eq(schema.sessions.status, "completed")
        )
      );

    // Simple streak calculation
    const completedDates = sessions
      .filter((s) => s.completedAt)
      .map((s) => s.completedAt!.toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort();

    let streak = 0;
    const today = new Date().toDateString();
    if (completedDates.includes(today)) {
      streak = 1;
      for (let i = completedDates.length - 2; i >= 0; i--) {
        const date = new Date(completedDates[i]);
        const nextDate = new Date(completedDates[i + 1]);
        const diffDays = Math.floor((nextDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      completedSessions: sessions.length,
      streak,
    };
  }

  // Identity operations (for Tairo space separation)
  async getUserIdentity(userId: string, space: string): Promise<Identity | undefined> {
    const [identity] = await this.db
      .select()
      .from(schema.identities)
      .where(
        and(
          eq(schema.identities.userId, userId),
          eq(schema.identities.space, space)
        )
      );
    return identity;
  }

  async createIdentity(insertIdentity: InsertIdentity): Promise<Identity> {
    const [identity] = await this.db
      .insert(schema.identities)
      .values(insertIdentity)
      .returning();
    return identity;
  }

  // Loop operations (25-minute session units)
  async getLoop(id: string): Promise<Loop | undefined> {
    const [loop] = await this.db
      .select()
      .from(schema.loops)
      .where(eq(schema.loops.id, id));
    return loop;
  }

  async getProgramLoops(programId: string): Promise<Loop[]> {
    return await this.db
      .select()
      .from(schema.loops)
      .where(eq(schema.loops.programId, programId))
      .orderBy(schema.loops.index);
  }

  async createLoop(insertLoop: InsertLoop): Promise<Loop> {
    const [loop] = await this.db
      .insert(schema.loops)
      .values(insertLoop)
      .returning();
    return loop;
  }

  async updateLoop(id: string, updates: Partial<Loop>): Promise<Loop | undefined> {
    const [loop] = await this.db
      .update(schema.loops)
      .set(updates)
      .where(eq(schema.loops.id, id))
      .returning();
    return loop;
  }
  
  // Analytics event operations
  async createAnalyticsEvent(insertEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await this.db
      .insert(schema.analyticsEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAnalyticsEvents(organizationId: string | null, space: string): Promise<AnalyticsEvent[]> {
    return await this.db
      .select()
      .from(schema.analyticsEvents)
      .where(
        and(
          organizationId 
            ? eq(schema.analyticsEvents.organizationId, organizationId)
            : isNull(schema.analyticsEvents.organizationId),
          eq(schema.analyticsEvents.space, space)
        )
      )
      .orderBy(desc(schema.analyticsEvents.createdAt));
  }
}

export const storage = new DbStorage();
