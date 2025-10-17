import {
  type Organization,
  type InsertOrganization,
  type Team,
  type InsertTeam,
  type User,
  type InsertUser,
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
  getOrganizationUsers(organizationId: string): Promise<User[]>;
  getTeamUsers(teamId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

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

  // Stats
  getUserStats(userId: string): Promise<{ completedSessions: number; streak: number }>;
}

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization>;
  private teams: Map<string, Team>;
  private users: Map<string, User>;
  private programs: Map<string, Program>;
  private sessions: Map<string, Session>;
  private progress: Map<string, Progress>;
  private achievements: Map<string, Achievement>;
  private userAchievements: Map<string, UserAchievement>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.organizations = new Map();
    this.teams = new Map();
    this.users = new Map();
    this.programs = new Map();
    this.sessions = new Map();
    this.progress = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.chatMessages = new Map();
    
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      displayName: insertUser.displayName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      organizationId: insertUser.organizationId ?? null,
      teamId: insertUser.teamId ?? null,
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
}

import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, and, desc } from "drizzle-orm";
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
}

export const storage = new DbStorage();
