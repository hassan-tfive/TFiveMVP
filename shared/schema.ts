import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // hashed password (null for social auth)
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"), // user | admin | enterprise_admin
  organizationId: varchar("organization_id").references(() => organizations.id),
  teamId: varchar("team_id").references(() => teams.id),
  currentWorkspace: text("current_workspace").notNull().default("professional"), // professional | personal
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invitations for user onboarding
export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(), // unique token for invitation link
  status: text("status").notNull().default("pending"), // pending | accepted | expired | cancelled
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Identity table for space separation (personal vs work)
export const identities = pgTable("identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  space: text("space").notNull(), // personal | work
  tfiveId: text("tfive_id").notNull().unique(),
  consentFlags: jsonb("consent_flags"), // privacy consents per space
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // wellbeing | recovery | inclusion | focus
  difficulty: text("difficulty"), // beginner | intermediate | advanced
  duration: integer("duration"), // total duration in minutes (legacy)
  content: jsonb("content"), // legacy { learn: string, act: string, earn: { points: number, message: string } }
  imageUrl: text("image_url"),
  workspace: text("workspace").notNull(), // professional | personal | both
  // Enhanced fields for Tairo interaction model (nullable for backward compatibility)
  ownerSpace: text("owner_space"), // personal | work
  type: text("type"), // one_off | short_series | mid_series | long_series
  topic: text("topic"), // focus | confidence | recovery | leadership | inclusion | creativity
  tone: text("tone"), // calm | energizing | instructional | reflective
  durationWeeks: integer("duration_weeks"), // for series types
  journeyId: varchar("journey_id"), // for long series with arcs
  arcIndex: integer("arc_index"), // which arc in the journey
  metadata: jsonb("metadata"), // { journey: { arcs: [...] }, ... }
  // Legacy fields
  domain: text("domain"),
  goal: text("goal"),
  durationLearn: integer("duration_learn"),
  durationAct: integer("duration_act"),
  durationEarn: integer("duration_earn"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loops are 25-minute session units within programs
export const loops = pgTable("loops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => programs.id),
  index: integer("index").notNull(), // 1, 2, 3... in the series
  title: text("title").notNull(),
  phaseLearnText: text("phase_learn_text").notNull(),
  phaseActText: text("phase_act_text").notNull(),
  phaseEarnText: text("phase_earn_text").notNull(),
  durLearn: integer("dur_learn").notNull(), // minutes
  durAct: integer("dur_act").notNull(), // minutes
  durEarn: integer("dur_earn").notNull(), // minutes (sum must = 25)
  audioLearnUrl: text("audio_learn_url"), // TTS audio for Learn phase
  audioActUrl: text("audio_act_url"), // TTS audio for Act phase
  audioEarnUrl: text("audio_earn_url"), // TTS audio for Earn phase
  videoUrl: text("video_url"), // Video content URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  programId: varchar("program_id").references(() => programs.id), // legacy, nullable now
  loopId: varchar("loop_id").references(() => loops.id), // new: reference to loop
  status: text("status").notNull(), // in_progress | completed | paused
  phase: text("phase").notNull(), // checkin | learn | act | earn
  timeRemaining: integer("time_remaining").notNull(), // in seconds
  workspace: text("workspace").notNull(), // professional | personal
  mood: integer("mood"), // 1-5 from check-in
  focus: integer("focus"), // 1-5 from check-in
  goal: text("goal"), // user's goal from check-in
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Analytics events for work space (aggregated, anonymized)
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id), // null for personal space
  space: text("space").notNull(), // personal | work
  name: text("name").notNull(), // event name (e.g., 'session_completed', 'program_created')
  props: jsonb("props"), // event properties (anonymized for work space)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessionEvents = pgTable("session_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  phase: text("phase").notNull(), // checkin | learn | act | earn
  payload: jsonb("payload"), // flexible data for each phase
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reflections = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  sentiment: text("sentiment"), // positive | neutral | negative
  score: integer("score"), // 0-100 reflection quality score
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewardCatalog = pgTable("reward_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // employer | sponsor
  organizationId: varchar("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  costPoints: integer("cost_points").notNull(),
  metadata: jsonb("metadata"), // additional reward details
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const redemptions = pgTable("redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  catalogId: varchar("catalog_id").notNull().references(() => rewardCatalog.id),
  status: text("status").notNull(), // pending | fulfilled | cancelled
  pointsSpent: integer("points_spent").notNull(),
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
  fulfilledAt: timestamp("fulfilled_at"),
});

export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  programId: varchar("program_id").notNull().references(() => programs.id),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  requirement: integer("requirement").notNull(), // number needed to unlock
  type: text("type").notNull(), // sessions_completed | points_earned | streak_days
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  workspace: text("workspace").notNull(), // professional | personal
  metadata: jsonb("metadata"), // wizard state, program creation data, etc
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const updateTeamSchema = insertTeamSchema.partial().omit({
  organizationId: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  completedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSessionEventSchema = createInsertSchema(sessionEvents).omit({
  id: true,
  createdAt: true,
});

export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  createdAt: true,
});

export const insertRewardCatalogSchema = createInsertSchema(rewardCatalog).omit({
  id: true,
  createdAt: true,
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({
  id: true,
  redeemedAt: true,
  fulfilledAt: true,
});

export const insertIdentitySchema = createInsertSchema(identities).omit({
  id: true,
  createdAt: true,
});

export const insertLoopSchema = createInsertSchema(loops).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertSessionEvent = z.infer<typeof insertSessionEventSchema>;
export type SessionEvent = typeof sessionEvents.$inferSelect;

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Reflection = typeof reflections.$inferSelect;

export type InsertRewardCatalog = z.infer<typeof insertRewardCatalogSchema>;
export type RewardCatalog = typeof rewardCatalog.$inferSelect;

export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type Redemption = typeof redemptions.$inferSelect;

export type InsertIdentity = z.infer<typeof insertIdentitySchema>;
export type Identity = typeof identities.$inferSelect;

export type InsertLoop = z.infer<typeof insertLoopSchema>;
export type Loop = typeof loops.$inferSelect;

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Additional types for frontend
export type Workspace = "professional" | "personal";
export type Space = "personal" | "work";
export type SessionPhase = "checkin" | "learn" | "act" | "earn";
export type SessionStatus = "in_progress" | "completed" | "paused";
export type ProgramCategory = "wellbeing" | "recovery" | "inclusion" | "focus";
export type ProgramDifficulty = "beginner" | "intermediate" | "advanced";
export type ProgramType = "one_off" | "short_series" | "mid_series" | "long_series";
export type Topic = "focus" | "confidence" | "recovery" | "leadership" | "inclusion" | "creativity" | "motivation";
export type Tone = "calm" | "energizing" | "instructional" | "reflective";
export type UserRole = "user" | "admin" | "team_lead";
export type RewardProvider = "employer" | "sponsor";
export type RedemptionStatus = "pending" | "fulfilled" | "cancelled";
export type Sentiment = "positive" | "neutral" | "negative";
