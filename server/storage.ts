import {
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
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
  private users: Map<string, User>;
  private programs: Map<string, Program>;
  private sessions: Map<string, Session>;
  private progress: Map<string, Progress>;
  private achievements: Map<string, Achievement>;
  private userAchievements: Map<string, UserAchievement>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
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
      currentWorkspace: "professional",
      points: 0,
      level: 1,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
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

export const storage = new MemStorage();
