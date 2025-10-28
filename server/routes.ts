import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertProgramSchema,
  insertSessionSchema,
  insertChatMessageSchema,
  insertOrganizationSchema,
  insertTeamSchema,
  updateTeamSchema,
  insertLoopSchema,
} from "@shared/schema";
import {
  parseIntent,
  getWizardQuestions,
  composeLoop,
  buildSeries,
  generateAudioNarration,
  getCuratedVideoUrl,
} from "./ai-workflows";
import { getProgramTypeConfig } from "@shared/programTypes";

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_USER_ID = "default-user";

// Helper to get userId from authenticated request
function getUserId(req: any): string {
  return req.user?.id || DEFAULT_USER_ID;
}

// Admin authorization middleware
async function requireAdmin(req: any, res: Response, next: NextFunction) {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization failed" });
  }
}

// Helper function to get phase-specific Tairo guidance
function getPhaseGuidance(phase: string, workspace: string): string {
  const isProfessional = workspace === "professional";
  
  switch (phase) {
    case "checkin":
      return isProfessional
        ? "You're in the CHECK-IN phase. Ask about their current work state, energy level, and what they want to accomplish this session. Help them set a clear, achievable goal for the next 25 minutes."
        : "You're in the CHECK-IN phase. Ask how they're feeling emotionally and mentally. Help them identify what they need most right now - calm, energy, clarity, or connection. Guide them to set a personal intention for this session.";
    
    case "learn":
      return isProfessional
        ? "You're in the LEARN phase (8-10 minutes). Help them absorb key concepts and context. Ask reflective questions to deepen understanding. Connect new information to their professional experience."
        : "You're in the LEARN phase (8-10 minutes). Help them understand the concept or practice they're exploring. Use examples from everyday life. Encourage curiosity and openness to new perspectives.";
    
    case "act":
      return isProfessional
        ? "You're in the ACT phase (10-12 minutes). Guide them through practical application. Provide clear steps, troubleshoot challenges, and keep them focused on action. Celebrate small wins as they practice."
        : "You're in the ACT phase (10-12 minutes). Encourage them to fully engage in the practice or exercise. Remind them there's no wrong way to try. Support them through any discomfort or resistance that comes up.";
    
    case "earn":
      return isProfessional
        ? "You're in the EARN phase (1-2 minutes). Ask what went well and what they learned. Help them identify one specific takeaway they can use at work. Celebrate their effort and progress. Prompt for a brief reflection."
        : "You're in the EARN phase (1-2 minutes). Ask them to reflect on how this session felt. What shifted? What did they notice? Celebrate their commitment to growth. Invite them to capture any insights in a brief reflection.";
    
    default:
      return "Provide supportive, contextual guidance based on where they are in their growth journey.";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Whitelist of allowed image extensions for avatar uploads
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Setup multer for avatar uploads
  const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'attached_assets', 'avatars');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Extract and sanitize extension from original filename
      const originalExt = path.extname(file.originalname).toLowerCase();
      
      // Validate extension is in whitelist
      if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
        return cb(new Error('Invalid file extension'));
      }
      
      // Check for path traversal attempts
      if (originalExt.includes('..') || originalExt.includes('/') || originalExt.includes('\\')) {
        return cb(new Error('Invalid filename'));
      }
      
      const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
      cb(null, `avatar-${uniqueSuffix}${originalExt}`);
    }
  });

  const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      // Check MIME type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, GIF, and WebP images are allowed'));
      }
      
      // Check extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension'));
      }
      
      cb(null, true);
    }
  });

  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Signup intent endpoint
  app.post('/api/signup-intent', (req: any, res) => {
    const { intent } = req.body;
    if (intent === 'admin') {
      req.session.signupIntent = 'admin';
      // Explicitly save session to ensure it persists
      req.session.save((err: any) => {
        if (err) {
          console.error('Failed to save session:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  // Avatar upload endpoint with error handling
  app.post('/api/upload/avatar', isAuthenticated, (req: any, res) => {
    uploadAvatar.single('avatar')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = getUserId(req);
        const avatarUrl = `/attached_assets/avatars/${req.file.filename}`;

        // Update user's avatar URL
        await storage.updateUser(userId, { avatarUrl });

        res.json({ avatarUrl, message: 'Avatar uploaded successfully' });
      } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
      }
    });
  });

  // Store invitation token in session
  app.post('/api/store-invitation-token', (req: any, res) => {
    const { token } = req.body;
    if (token) {
      req.session.invitationToken = token;
    }
    res.json({ success: true });
  });

  // User routes
  app.get("/api/user", async (req: any, res) => {
    // If authenticated, return the authenticated user; otherwise return demo user
    const userId = req.user?.id || DEFAULT_USER_ID;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.patch("/api/user", async (req, res) => {
    try {
      const updateSchema = z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        currentWorkspace: z.enum(["professional", "personal"]).optional(),
        points: z.number().optional(),
        level: z.number().optional(),
      }).strict();

      const updates = updateSchema.parse(req.body);
      const user = await storage.updateUser(DEFAULT_USER_ID, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Program routes
  app.get("/api/programs", async (req, res) => {
    const workspace = req.query.workspace as string | undefined;
    const programs = await storage.getPrograms(workspace);
    res.json(programs);
  });

  app.get("/api/programs/started", async (req, res) => {
    const workspace = req.query.workspace as string | undefined;
    const userId = req.user?.id || DEFAULT_USER_ID;
    const programs = await storage.getStartedPrograms(userId, workspace);
    res.json(programs);
  });

  app.get("/api/programs/:id", async (req, res) => {
    const program = await storage.getProgram(req.params.id);
    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }
    res.json(program);
  });

  // Loop routes
  app.get("/api/loops/:id", async (req, res) => {
    const loop = await storage.getLoop(req.params.id);
    if (!loop) {
      return res.status(404).json({ error: "Loop not found" });
    }
    res.json(loop);
  });

  app.post("/api/programs", async (req, res) => {
    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  // Session routes
  app.get("/api/sessions/:id", async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    const updates = req.body;
    const session = await storage.updateSession(req.params.id, updates);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  });

  app.post("/api/sessions/complete", async (req, res) => {
    const { programId, workspace } = req.body;
    
    try {
      // Get program to validate it exists
      const program = await storage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Create completed session
      const session = await storage.createSession({
        userId: DEFAULT_USER_ID,
        programId,
        status: "completed",
        phase: "earn",
        timeRemaining: 0,
        workspace,
      });

      await storage.updateSession(session.id, {
        status: "completed",
        completedAt: new Date(),
      });

      // Calculate points according to spec
      let pointsEarned = 50; // Base points for completing a session

      // Get user stats to calculate streak bonus
      const stats = await storage.getUserStats(DEFAULT_USER_ID);
      if (stats.streak >= 3) {
        // Streak bonus: +10 points per day, max +50
        const streakBonus = Math.min(stats.streak * 10, 50);
        pointsEarned += streakBonus;
      }

      // Update user points and level
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (user) {
        const newPoints = user.points + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        await storage.updateUser(DEFAULT_USER_ID, {
          points: newPoints,
          level: newLevel,
        });
      }

      // Mark progress
      await storage.createProgress({
        userId: DEFAULT_USER_ID,
        programId,
        completed: true,
      });

      res.json({
        success: true,
        pointsEarned,
        session,
      });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  // Reflection routes
  app.get("/api/reflections/:sessionId", async (req, res) => {
    try {
      const reflection = await storage.getSessionReflection(req.params.sessionId);
      if (!reflection) {
        return res.status(404).json({ error: "Reflection not found" });
      }
      res.json(reflection);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reflection" });
    }
  });

  app.post("/api/reflections", async (req, res) => {
    try {
      const { sessionId, content, sentiment, score } = req.body;
      
      // Validate session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Create reflection
      const reflection = await storage.createReflection({
        sessionId,
        userId: DEFAULT_USER_ID,
        content,
        sentiment: sentiment || null,
        score: score || null,
      });

      // Award points for reflection
      let pointsEarned = 10; // Base points for reflection
      
      // Deep reflection bonus (score > 70 on 0-100 scale)
      if (score && score > 70) {
        pointsEarned += 20;
      }

      // Update user points
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (user) {
        const newPoints = user.points + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        await storage.updateUser(DEFAULT_USER_ID, {
          points: newPoints,
          level: newLevel,
        });
      }

      res.status(201).json({
        reflection,
        pointsEarned,
      });
    } catch (error) {
      console.error("Error creating reflection:", error);
      res.status(500).json({ error: "Failed to create reflection" });
    }
  });

  // Session event routes
  app.get("/api/sessions/:sessionId/events", async (req, res) => {
    try {
      const events = await storage.getSessionEvents(req.params.sessionId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session events" });
    }
  });

  app.post("/api/sessions/:sessionId/events", async (req, res) => {
    try {
      const { eventType, phase, payload } = req.body;
      
      const event = await storage.createSessionEvent({
        sessionId: req.params.sessionId,
        eventType,
        phase,
        payload: payload || null,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating session event:", error);
      res.status(500).json({ error: "Failed to create session event" });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getUserStats(DEFAULT_USER_ID);
    res.json(stats);
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    const achievements = await storage.getAchievements();
    res.json(achievements);
  });

  app.get("/api/user/achievements", async (req, res) => {
    const userAchievements = await storage.getUserAchievements(DEFAULT_USER_ID);
    res.json(userAchievements);
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievement = await storage.createAchievement(req.body);
      res.status(201).json(achievement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create achievement" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    const workspace = req.query.workspace as string;
    const conversations = await storage.getConversations(DEFAULT_USER_ID, workspace);
    res.json(conversations);
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation({
        userId: DEFAULT_USER_ID,
        workspace: req.body.workspace,
        title: req.body.title,
      });
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Chat routes with OpenAI integration
  app.get("/api/chat", async (req, res) => {
    const conversationId = req.query.conversationId as string;
    const workspace = req.query.workspace as string;
    
    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } else if (workspace) {
      // Get all messages for a workspace (legacy)
      const messages = await storage.getChatMessages(DEFAULT_USER_ID, workspace);
      res.json(messages);
    } else {
      res.status(400).json({ error: "Either conversationId or workspace is required" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { content, workspace, phase, sessionId, conversationId } = insertChatMessageSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
        role: "user",
      });

      // Validate workspace is provided
      if (!workspace) {
        return res.status(400).json({ error: "workspace is required" });
      }

      // If no conversationId, create a new conversation
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        try {
          const conversation = await storage.createConversation({
            userId: DEFAULT_USER_ID,
            workspace,
            title: content.slice(0, 50), // Use first message as title
          });
          activeConversationId = conversation.id;
        } catch (convError) {
          console.error("Failed to create conversation:", convError);
          return res.status(500).json({ error: "Failed to create conversation" });
        }
      }

      // Ensure we have a conversationId before proceeding
      if (!activeConversationId) {
        return res.status(500).json({ error: "Failed to establish conversation" });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        role: "user",
        content,
        workspace,
        conversationId: activeConversationId,
      });

      // Get conversation history for context (only from this conversation)
      const history = await storage.getConversationMessages(activeConversationId);
      
      // Prepare base system message based on workspace
      let systemMessage = workspace === "professional"
        ? "You are Tairo, an AI companion for Tfive, a professional development platform. You help users with career growth, workplace wellbeing, and professional skills using the Pomodoro technique (25-minute sessions). Be encouraging, professional, and focused on actionable growth."
        : "You are Tairo, an AI companion for Tfive, a personal development platform. You help users with personal growth, wellbeing, and self-discovery in their private space. Be warm, empathetic, and encouraging.";

      // Add phase-specific guidance
      if (phase) {
        const phaseGuidance = getPhaseGuidance(phase, workspace);
        systemMessage += `\n\n${phaseGuidance}`;
      }

      systemMessage += "\n\nKeep responses concise and supportive (2-3 sentences max).";

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          ...history.slice(-10).map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const assistantContent = completion.choices[0]?.message?.content || "I'm here to help you grow!";

      // Save assistant message
      const assistantMessage = await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        role: "assistant",
        content: assistantContent,
        workspace,
        conversationId: activeConversationId,
      });

      // Update conversation timestamp
      await storage.updateConversation(activeConversationId, { updatedAt: new Date() });

      res.json({
        userMessage,
        assistantMessage,
        conversationId: activeConversationId,
      });
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Admin routes - Organization and Team Management
  app.get("/api/admin/organizations", requireAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.json([]);
      }
      
      // Admin should only see their own organization
      const org = await storage.getOrganization(user.organizationId);
      res.json(org ? [org] : []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/admin/organizations", requireAdmin, async (req, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(orgData);
      res.status(201).json(org);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.get("/api/admin/organizations/:id/teams", requireAdmin, async (req, res) => {
    try {
      const teams = await storage.getOrganizationTeams(req.params.id);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/admin/teams", requireAdmin, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.patch("/api/admin/teams/:id", requireAdmin, async (req, res) => {
    try {
      const updates = updateTeamSchema.parse(req.body);
      const team = await storage.updateTeam(req.params.id, updates);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.get("/api/admin/organizations/:id/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getOrganizationUsers(req.params.id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/teams/:id/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getTeamUsers(req.params.id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team users" });
    }
  });

  // Admin onboarding endpoint
  app.post("/api/admin/organizations/onboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const email = req.user.email;
      const session = req.session as any;
      
      // Debug logging
      console.log("[ONBOARDING] Session data:", {
        signupIntent: session.signupIntent,
        hasSession: !!session,
        sessionId: session.id,
        user: { id: userId, email }
      });
      
      // Security: Verify admin signup intent
      if (session.signupIntent !== "admin") {
        console.log("[ONBOARDING] Access denied - signupIntent:", session.signupIntent);
        return res.status(403).json({ error: "Unauthorized: Not an admin signup flow" });
      }
      
      // Security: Only allow users who don't already have an organization
      const existingUser = await storage.getUser(userId);
      if (existingUser?.organizationId) {
        return res.status(403).json({ error: "User already belongs to an organization" });
      }
      
      const onboardingSchema = z.object({
        companySize: z.string(),
        industry: z.string(),
        values: z.string(),
        goals: z.string(),
      });
      
      const data = onboardingSchema.parse(req.body);
      
      // Create organization (use email domain as default name)
      const domain = email.split("@")[1];
      const orgName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
      // Add random suffix to ensure slug uniqueness
      const baseSlug = domain.replace(/\./g, "-");
      const uniqueSuffix = crypto.randomUUID().substring(0, 8);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      
      const org = await storage.createOrganization({
        name: orgName,
        slug: slug,
      });
      
      // Update user to be admin of this organization
      await storage.updateUser(userId, {
        organizationId: org.id,
        role: "admin",
      });
      
      // Fetch the updated user from DB and update session
      const updatedUser = await storage.getUser(userId);
      if (updatedUser) {
        req.user = updatedUser; // Update session with latest user data
      }
      
      // Clear the signup intent now that onboarding is complete
      delete session.signupIntent;
      
      // Explicitly save session to ensure updated user persists
      req.session.save((saveErr: any) => {
        if (saveErr) {
          console.error("[ONBOARDING] Failed to save session:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        console.log("[ONBOARDING] Onboarding complete. User updated:", {
          userId,
          organizationId: org.id,
          role: updatedUser?.role
        });
        
        // TODO: Store onboarding data (companySize, industry, values, goals) 
        // in organization metadata once schema is updated to include these fields
        
        res.json({ success: true, organizationId: org.id });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Invitation routes
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(410).json({ error: "Invitation has expired" });
      }
      
      // Get organization name
      const org = await storage.getOrganization(invitation.organizationId);
      
      res.json({
        id: invitation.id,
        email: invitation.email,
        organizationId: invitation.organizationId,
        organizationName: org?.name || "Unknown Organization",
        teamId: invitation.teamId || null,
        status: invitation.status,
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const email = req.user.email;
      
      // Get invitation
      const invitation = await storage.getInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ error: "Invitation already accepted or cancelled" });
      }
      
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(410).json({ error: "Invitation has expired" });
      }
      
      if (invitation.email !== email) {
        return res.status(403).json({ error: "Email does not match invitation" });
      }
      
      // Update user with organization and team
      await storage.updateUser(userId, {
        organizationId: invitation.organizationId,
        teamId: invitation.teamId || undefined,
        role: invitation.role || "user",
      });
      
      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, {
        status: "accepted",
        acceptedAt: new Date(),
      });
      
      res.json({ success: true, message: "Invitation accepted" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Get all invitations for an organization
  app.get("/api/admin/organizations/:id/invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getOrganizationInvitations(req.params.id);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.post("/api/admin/invitations", requireAdmin, async (req: any, res) => {
    try {
      const inviteSchema = z.object({
        email: z.string().email(),
        organizationId: z.string(),
        teamId: z.string().optional().nullable(),
      });
      
      const data = inviteSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get organization details
      const organization = await storage.getOrganization(data.organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      // Generate unique token
      const token = randomUUID() + "-" + Date.now();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      const invitation = await storage.createInvitation({
        email: data.email,
        role: "user",
        organizationId: data.organizationId,
        teamId: data.teamId || undefined,
        invitedBy: userId,
        token: token,
        expiresAt: expiresAt,
      });
      
      // Send invitation email
      try {
        const { sendInvitationEmail } = await import("./email");
        await sendInvitationEmail(data.email, organization.name, token);
        console.log(`Invitation email sent to ${data.email}`);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole request if email fails
        // The invitation is still created and can be resent
      }
      
      // Return the full invitation with token for copy link functionality
      res.json({ 
        success: true, 
        invitation: {
          id: invitation.id,
          email: data.email,
          token: token,
          organizationId: data.organizationId,
          teamId: data.teamId || null,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/analytics/engagement", requireAdmin, async (req, res) => {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }

    try {
      const users = await storage.getOrganizationUsers(organizationId as string);
      const allSessions = await Promise.all(
        users.map(u => storage.getUserSessions(u.id))
      );
      const flatSessions = allSessions.flat();
      
      const activeUsers = new Set(flatSessions.map(s => s.userId)).size;
      const completedSessions = flatSessions.filter(s => s.status === "completed").length;
      const totalSessions = flatSessions.length;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Popular programs
      const programCounts = flatSessions.reduce((acc, session) => {
        acc[session.programId] = (acc[session.programId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularProgramIds = Object.entries(programCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      const popularPrograms = await Promise.all(
        popularProgramIds.map(id => storage.getProgram(id))
      );

      res.json({
        activeUsers,
        totalUsers: users.length,
        completedSessions,
        completionRate: Math.round(completionRate),
        popularPrograms: popularPrograms.filter(Boolean),
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/wellbeing", requireAdmin, async (req, res) => {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }

    try {
      const users = await storage.getOrganizationUsers(organizationId as string);
      const userStats = await Promise.all(
        users.map(async (u) => {
          const stats = await storage.getUserStats(u.id);
          return {
            userId: u.id,
            username: u.username,
            level: u.level,
            points: u.points,
            ...stats,
          };
        })
      );

      const avgLevel = userStats.reduce((sum, u) => sum + u.level, 0) / userStats.length;
      const avgStreak = userStats.reduce((sum, u) => sum + u.streak, 0) / userStats.length;
      const avgSessions = userStats.reduce((sum, u) => sum + u.completedSessions, 0) / userStats.length;

      res.json({
        averageLevel: Math.round(avgLevel * 10) / 10,
        averageStreak: Math.round(avgStreak * 10) / 10,
        averageSessions: Math.round(avgSessions),
        topPerformers: userStats.sort((a, b) => b.points - a.points).slice(0, 5),
        atRisk: userStats.filter(u => u.streak === 0 && u.completedSessions < 3),
      });
    } catch (error) {
      console.error("Wellbeing analytics error:", error);
      res.status(500).json({ error: "Failed to fetch wellbeing analytics" });
    }
  });

  // ========================================
  // TAIRO INTERACTION MODEL ROUTES
  // ========================================

  // POST /api/intent/parse - Parse user's free-text intent
  app.post("/api/intent/parse", async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1),
        space: z.enum(["personal", "work"]),
      });
      
      const { text, space } = schema.parse(req.body);
      const intent = await parseIntent(text, space);
      
      res.json(intent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Intent parse error:", error);
      res.status(500).json({ error: "Failed to parse intent" });
    }
  });

  // POST /api/wizard/next - Get next wizard question(s)
  app.post("/api/wizard/next", async (req, res) => {
    try {
      console.log("Wizard /next request body:", JSON.stringify(req.body, null, 2));
      
      const schema = z.object({
        context: z.object({
          topic: z.string(),
          emotion: z.string(),
          scope_hint: z.enum(["short_term", "mid_term", "long_term"]),
          space: z.enum(["personal", "work"]),
          confidence: z.number(),
        }),
        previous_answers: z.record(z.any()).optional(),
      });
      
      const { context, previous_answers } = schema.parse(req.body);
      const questions = await getWizardQuestions(context, previous_answers);
      
      res.json({ questions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Wizard validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: error.errors });
      }
      console.error("Wizard error:", error);
      res.status(500).json({ error: "Failed to generate wizard questions" });
    }
  });

  // POST /api/programs/generate - Generate a program with loops
  app.post("/api/programs/generate", async (req, res) => {
    try {
      const schema = z.object({
        space: z.enum(["personal", "work"]),
        inputs: z.object({
          topic: z.string(),
          tone: z.string(),
          series_type: z.enum(["one_off", "short_series", "mid_series", "long_series"]),
          cadence_per_week: z.number().optional(),
          duration_weeks: z.number().optional(),
        }),
      });
      
      const { space, inputs } = schema.parse(req.body);
      const user = await storage.getUser(DEFAULT_USER_ID);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Build the series using AI
      const programOutput = await buildSeries({
        ...inputs,
        space,
      });

      // Generate program image using DALL-E 2
      let imageUrl: string | null = null;
      try {
        const imagePrompt = `Abstract, calming visual representing ${inputs.topic}, minimalist design, soft gradients, peaceful atmosphere, personal growth theme`;
        console.log('[Image Generation] Generating image with prompt:', imagePrompt);
        const imageResponse = await openai.images.generate({
          model: "dall-e-2",
          prompt: imagePrompt,
          n: 1,
          size: "512x512",
        });
        imageUrl = imageResponse.data?.[0]?.url || null;
        console.log('[Image Generation] Image generated successfully:', imageUrl ? 'Yes' : 'No');
      } catch (imageError: any) {
        console.error('[Image Generation] Failed to generate image:', imageError?.message || imageError);
        // Set a placeholder/fallback image URL based on topic
        const topicImages: Record<string, string> = {
          'focus': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop',
          'leadership': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
          'recovery': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
          'stress': 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop',
          'inclusion': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
          'confidence': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
          'creativity': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop',
          'motivation': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        };
        imageUrl = topicImages[inputs.topic.toLowerCase()] || topicImages['focus'];
        console.log('[Image Generation] Using fallback image for topic:', inputs.topic);
      }

      // Create the program in the database
      const program = await storage.createProgram({
        title: programOutput.program.title,
        description: `AI-generated ${inputs.topic} program`,
        workspace: space === "personal" ? "personal" : "professional",
        ownerSpace: space,
        type: inputs.series_type,
        topic: inputs.topic,
        tone: inputs.tone,
        durationWeeks: programOutput.program.duration_weeks,
        metadata: programOutput.program.metadata,
        imageUrl,
      });

      // Generate audio narration for all three phases
      console.log('[Audio] Generating TTS audio for Learn, Act, and Earn phases...');
      const [audioLearnUrl, audioActUrl, audioEarnUrl] = await Promise.all([
        generateAudioNarration(programOutput.next_loop.learn, "learn", inputs.tone),
        generateAudioNarration(programOutput.next_loop.act, "act", inputs.tone),
        generateAudioNarration(programOutput.next_loop.earn, "earn", inputs.tone),
      ]);
      console.log('[Audio] Generated audio URLs:', { audioLearnUrl, audioActUrl, audioEarnUrl });

      // Get curated video URL based on topic
      const videoUrl = getCuratedVideoUrl(inputs.topic);
      console.log('[Video] Selected video URL:', videoUrl);

      // Create the first loop
      const firstLoop = await storage.createLoop({
        programId: program.id,
        index: 1,
        title: programOutput.next_loop.title,
        phaseLearnText: programOutput.next_loop.learn,
        phaseActText: programOutput.next_loop.act,
        phaseEarnText: programOutput.next_loop.earn,
        durLearn: programOutput.next_loop.durations.learn,
        durAct: programOutput.next_loop.durations.act,
        durEarn: programOutput.next_loop.durations.earn,
        audioLearnUrl: audioLearnUrl || undefined,
        audioActUrl: audioActUrl || undefined,
        audioEarnUrl: audioEarnUrl || undefined,
        videoUrl: videoUrl || undefined,
      });

      res.json({
        program,
        next_loop: firstLoop,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Program generation error:", error);
      res.status(500).json({ error: "Failed to generate program" });
    }
  });

  // GET /api/loops/:loopId/session - Get active session for a loop
  app.get("/api/loops/:loopId/session", async (req, res) => {
    try {
      const { loopId } = req.params;
      const user = await storage.getUser(DEFAULT_USER_ID);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all user sessions and find active one for this loop
      const sessions = await storage.getUserSessions(user.id);
      const activeSession = sessions.find(
        (s) => s.loopId === loopId && s.status === "in_progress"
      );

      if (!activeSession) {
        return res.status(404).json({ error: "No active session found" });
      }

      res.json(activeSession);
    } catch (error) {
      console.error("Get loop session error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // POST /api/sessions/start - Start a loop session (idempotent)
  app.post("/api/sessions/start", async (req, res) => {
    try {
      const schema = z.object({
        loop_id: z.string(),
      });
      
      const { loop_id } = schema.parse(req.body);
      const user = await storage.getUser(DEFAULT_USER_ID);
      const loop = await storage.getLoop(loop_id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!loop) {
        return res.status(404).json({ error: "Loop not found" });
      }

      // Check if there's already an active session for this loop
      const existingSessions = await storage.getUserSessions(user.id);
      const existingSession = existingSessions.find(
        (s) => s.loopId === loop_id && s.status === "in_progress"
      );

      if (existingSession) {
        // Return existing session instead of creating a new one
        return res.json({ session_id: existingSession.id, session: existingSession });
      }

      // Create new session for this loop
      const session = await storage.createSession({
        userId: user.id,
        loopId: loop.id,
        status: "in_progress",
        phase: "learn",
        timeRemaining: (loop.durLearn + loop.durAct + loop.durEarn) * 60, // total seconds
        workspace: user.currentWorkspace,
      });

      res.json({ session_id: session.id, session });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Session start error:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  // POST /api/sessions/:id/complete - Complete a session with reflection
  app.post("/api/sessions/:id/complete", async (req, res) => {
    try {
      const schema = z.object({
        reflection: z.string().optional(),
      });
      
      const { id } = req.params;
      const { reflection } = schema.parse(req.body);
      
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update session status
      await storage.updateSession(id, {
        status: "completed",
        completedAt: new Date(),
      });

      // Award points (base 100 points per completed loop)
      const user = await storage.getUser(session.userId);
      if (user) {
        const newPoints = user.points + 100;
        const newLevel = Math.floor(newPoints / 500) + 1;
        await storage.updateUser(user.id, {
          points: newPoints,
          level: newLevel,
        });
      }

      // Save reflection if provided
      if (reflection) {
        await storage.createReflection({
          sessionId: id,
          userId: session.userId,
          text: reflection,
        });
      }

      // Create analytics event
      await storage.createAnalyticsEvent({
        organizationId: user?.organizationId || null,
        space: session.workspace === "professional" ? "work" : "personal",
        name: "session_completed",
        props: {
          loopId: session.loopId,
          programId: session.programId,
        },
      });

      res.json({
        points_awarded: 100,
        summary: "Session completed successfully!",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Session complete error:", error);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  // GET /api/programs/:id/loops - Get all loops for a program
  app.get("/api/programs/:id/loops", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[API] GET /api/programs/${id}/loops - User: ${req.user?.id || 'anonymous'}`);
      
      const loops = await storage.getProgramLoops(id);
      console.log(`[API] Found ${loops.length} loops for program ${id}`);
      
      // Derive durations from program type for each loop (only if programType is set)
      const { getProgramTypeConfig } = await import("@shared/programTypes");
      const loopsWithCorrectDurations = loops.map(loop => {
        // Only override durations if programType is explicitly set
        if (loop.programType && loop.programType !== null) {
          const typeConfig = getProgramTypeConfig(loop.programType);
          return {
            ...loop,
            durLearn: typeConfig.durLearn,
            durAct: typeConfig.durAct,
            durEarn: typeConfig.durEarn,
          };
        }
        // Preserve stored durations for legacy loops without programType
        return loop;
      });
      
      res.json(loopsWithCorrectDurations);
    } catch (error) {
      console.error(`[API] Error getting loops for program ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch loops" });
    }
  });

  // GET /api/loops/:id - Get a single loop by ID
  app.get("/api/loops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const loop = await storage.getLoop(id);
      if (!loop) {
        return res.status(404).json({ error: "Loop not found" });
      }
      
      // Only override durations if programType is explicitly set
      if (loop.programType && loop.programType !== null) {
        const { getProgramTypeConfig } = await import("@shared/programTypes");
        const typeConfig = getProgramTypeConfig(loop.programType);
        
        // Override stored durations with values from program type config
        const loopWithCorrectDurations = {
          ...loop,
          durLearn: typeConfig.durLearn,
          durAct: typeConfig.durAct,
          durEarn: typeConfig.durEarn,
        };
        
        res.json(loopWithCorrectDurations);
      } else {
        // Preserve stored durations for legacy loops without programType
        res.json(loop);
      }
    } catch (error) {
      console.error("Get loop error:", error);
      res.status(500).json({ error: "Failed to fetch loop" });
    }
  });

  // Initialize seed data
  await initializeSeedData();

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSeedData() {
  // Create demo organization if doesn't exist
  const existingOrgs = await storage.getOrganizations();
  let demoOrg;
  if (existingOrgs.length === 0) {
    demoOrg = await storage.createOrganization({
      name: "Demo Corp",
      slug: "demo-corp",
    });

    // Create demo teams
    await storage.createTeam({
      organizationId: demoOrg.id,
      name: "Engineering",
      description: "Software development team",
    });

    await storage.createTeam({
      organizationId: demoOrg.id,
      name: "Product",
      description: "Product management team",
    });

    await storage.createTeam({
      organizationId: demoOrg.id,
      name: "Design",
      description: "UX/UI design team",
    });
  } else {
    demoOrg = existingOrgs[0];
  }

  // Create default user if doesn't exist
  const existingUser = await storage.getUser(DEFAULT_USER_ID);
  if (!existingUser) {
    const teams = await storage.getOrganizationTeams(demoOrg.id);
    await storage.createUser({
      id: DEFAULT_USER_ID,
      username: "demo",
      email: "demo@tfive.com",
      role: "admin",
      organizationId: demoOrg.id,
      teamId: teams[0]?.id,
      currentWorkspace: "professional",
      points: 0,
      level: 1,
    } as any);
  }

  // Check if data already exists
  const existingPrograms = await storage.getPrograms();
  
  // If programs exist, check if they have loops and create them if needed
  if (existingPrograms.length > 0) {
    const phaseDurations: Record<string, { learn: number; act: number; earn: number }> = {
      wellbeing: { learn: 10, act: 11, earn: 4 },
      focus: { learn: 6, act: 15, earn: 4 },
      recovery: { learn: 14, act: 7, earn: 4 },
      inclusion: { learn: 9, act: 12, earn: 4 },
    };
    
    // Create loops for programs that don't have any, and backfill audio/video for existing loops
    for (const program of existingPrograms) {
      const loops = await storage.getProgramLoops(program.id);
      
      if (loops.length === 0 && program.content) {
        // This is an old seed program without loops, create one with audio/video
        const durations = phaseDurations[program.category as keyof typeof phaseDurations] || phaseDurations.wellbeing;
        
        console.log(`[Seed] Generating audio for ${program.title}...`);
        const [audioLearnUrl, audioActUrl, audioEarnUrl] = await Promise.all([
          generateAudioNarration(program.content.learn, "learn", "calm"),
          generateAudioNarration(program.content.act, "act", "calm"),
          generateAudioNarration(program.content.earn?.message || "Great work!", "earn", "calm"),
        ]);
        
        const videoUrl = getCuratedVideoUrl(program.topic || program.category || "focus");
        
        await storage.createLoop({
          programId: program.id,
          index: 1,
          title: `${program.title} - Session 1`,
          phaseLearnText: program.content.learn,
          phaseActText: program.content.act,
          phaseEarnText: program.content.earn?.message || "Great work!",
          durLearn: durations.learn,
          durAct: durations.act,
          durEarn: durations.earn,
          audioLearnUrl: audioLearnUrl || undefined,
          audioActUrl: audioActUrl || undefined,
          audioEarnUrl: audioEarnUrl || undefined,
          videoUrl: videoUrl || undefined,
        });
        console.log(`[Seed] Created loop with audio and video for ${program.title}`);
      } else {
        // Backfill audio/video for existing loops that don't have media
        for (const loop of loops) {
          const needsAudio = !loop.audioLearnUrl || !loop.audioActUrl || !loop.audioEarnUrl;
          const needsVideo = !loop.videoUrl;
          
          if (needsAudio || needsVideo) {
            console.log(`[Seed] Backfilling media for loop: ${loop.title}`);
            
            let audioLearnUrl = loop.audioLearnUrl;
            let audioActUrl = loop.audioActUrl;
            let audioEarnUrl = loop.audioEarnUrl;
            let videoUrl = loop.videoUrl;
            
            if (needsAudio) {
              console.log(`[Seed] Generating audio for loop ${loop.id}...`);
              [audioLearnUrl, audioActUrl, audioEarnUrl] = await Promise.all([
                loop.audioLearnUrl || generateAudioNarration(loop.phaseLearnText, "learn", "calm"),
                loop.audioActUrl || generateAudioNarration(loop.phaseActText, "act", "calm"),
                loop.audioEarnUrl || generateAudioNarration(loop.phaseEarnText, "earn", "calm"),
              ]);
            }
            
            if (needsVideo) {
              videoUrl = getCuratedVideoUrl(program.topic || program.category || "focus");
            }
            
            // Update the loop with new media URLs
            await storage.updateLoop(loop.id, {
              audioLearnUrl: audioLearnUrl || undefined,
              audioActUrl: audioActUrl || undefined,
              audioEarnUrl: audioEarnUrl || undefined,
              videoUrl: videoUrl || undefined,
            });
            console.log(`[Seed] Backfilled media for ${loop.title}`);
          }
        }
      }
    }
    
    console.log("✅ Updated existing programs with loops");
    return; // Already seeded
  }

  // Seed programs - 5 showcase programs featuring all new content types
  const programs = [
    {
      title: "Mindful Focus Mastery",
      description: "Discover the power of mindfulness to enhance concentration and mental clarity through breathing exercises and expert guidance.",
      category: "focus",
      difficulty: "beginner",
      duration: 25,
      workspace: "both",
      imageUrl: "/attached_assets/stock_images/mindfulness_meditati_c97195b0.jpg",
      content: {
        learn: "Introduction to mindfulness and focused breathing techniques.",
        act: "Practice the 4-7-8 breathing technique.",
        earn: {
          points: 100,
          message: "Great start on your mindfulness journey!",
        },
      },
    },
    {
      title: "Leadership Communication Excellence",
      description: "Master the art of effective communication to inspire teams, build trust, and drive organizational success.",
      category: "inclusion",
      difficulty: "intermediate",
      duration: 25,
      workspace: "professional",
      imageUrl: "/attached_assets/stock_images/business_leadership__3b97950f.jpg",
      content: {
        learn: "Essential communication strategies for modern leaders.",
        act: "Practice active listening techniques.",
        earn: {
          points: 150,
          message: "Excellent progress in leadership skills!",
        },
      },
    },
    {
      title: "Creative Problem Solving Workshop",
      description: "Unlock your creative potential with hands-on exercises that transform challenges into innovative solutions.",
      category: "focus",
      difficulty: "intermediate",
      duration: 25,
      workspace: "both",
      imageUrl: "/attached_assets/stock_images/mindfulness_meditati_c97195b0.jpg",
      content: {
        learn: "Creative thinking frameworks and methodologies.",
        act: "Engage in movement-based creative exercises.",
        earn: {
          points: 150,
          message: "Your creative problem-solving skills are growing!",
        },
      },
    },
    {
      title: "Stress Relief & Recovery",
      description: "Restore balance and renew energy through scientifically-proven relaxation techniques and guided practices.",
      category: "recovery",
      difficulty: "beginner",
      duration: 25,
      workspace: "both",
      imageUrl: "/attached_assets/stock_images/stress_relief_relaxa_7d16b29a.jpg",
      content: {
        learn: "Understanding stress and recovery mechanisms.",
        act: "Progressive relaxation exercises.",
        earn: {
          points: 100,
          message: "You've taken an important step toward stress relief!",
        },
      },
    },
    {
      title: "Innovation Thinking Lab",
      description: "Explore cutting-edge innovation strategies and develop the mindset to generate breakthrough ideas consistently.",
      category: "focus",
      difficulty: "advanced",
      duration: 25,
      workspace: "professional",
      imageUrl: "/attached_assets/stock_images/business_leadership__3b97950f.jpg",
      content: {
        learn: "Innovation frameworks from leading thinkers.",
        act: "Guided innovation ideation exercises.",
        earn: {
          points: 200,
          message: "Outstanding innovation thinking!",
        },
      },
    },
  ];

  // Create loops with rich content for each program
  for (let i = 0; i < programs.length; i++) {
    const programData = programs[i];
    const createdProgram = await storage.createProgram(programData);
    
    let programType: "getting_started" | "deep_learning" | "hands_on_practice" | "personal_wellbeing" | "creative_exploration";
    let contentItems: any[];
    
    // Program 1: Mindful Focus Mastery (getting_started: 15/5/5)
    if (i === 0) {
      programType = "getting_started";
      contentItems = [
        {
          id: "podcast-mindfulness-intro",
          type: "podcast",
          title: "Introduction to Mindful Focus",
          duration: 8,
          section: "learn",
          content: "https://example.com/mindfulness-intro.mp3" // Audio URL would go here
        },
        {
          id: "deep-dive-breathing",
          type: "deep_dive",
          title: "The Science of Breathing",
          duration: 7,
          section: "learn",
          content: {
            quick: "Mindful breathing activates your parasympathetic nervous system, reducing stress and improving focus. The 4-7-8 technique is scientifically proven to calm your mind.",
            deep: "Mindful breathing activates your parasympathetic nervous system, reducing stress and improving focus. The 4-7-8 technique—inhaling for 4 counts, holding for 7, and exhaling for 8—is scientifically proven to calm your mind and body.\n\nResearch from Harvard Medical School shows that controlled breathing can reduce cortisol levels by up to 40%. When you practice deep breathing, you stimulate the vagus nerve, which signals your body to relax. This physiological response decreases heart rate, lowers blood pressure, and promotes a state of calm alertness.\n\nThe 4-7-8 pattern is particularly effective because the extended exhale activates the parasympathetic nervous system more strongly than normal breathing. The hold phase allows for better oxygen exchange in your lungs, while the counting provides a focal point that quiets racing thoughts.\n\nRegular practice—even just 5 minutes daily—can rewire your brain's stress response, making you more resilient to daily pressures and improving your ability to focus on demanding tasks."
          }
        },
        {
          id: "guided-breathing",
          type: "guided_activity",
          title: "4-7-8 Breathing Practice",
          duration: 5,
          section: "act",
          content: {
            activityType: "breathing",
            description: "Follow the guided breathing exercise to experience immediate calm and clarity.",
            steps: [
              { id: "step-1", instruction: "Breathe in deeply through your nose", duration: 4, visualCue: "inhale" },
              { id: "step-2", instruction: "Hold your breath gently", duration: 7, visualCue: "hold" },
              { id: "step-3", instruction: "Exhale slowly through your mouth", duration: 8, visualCue: "exhale" },
              { id: "step-4", instruction: "Breathe in deeply through your nose", duration: 4, visualCue: "inhale" },
              { id: "step-5", instruction: "Hold your breath gently", duration: 7, visualCue: "hold" },
              { id: "step-6", instruction: "Exhale slowly through your mouth", duration: 8, visualCue: "exhale" },
              { id: "step-7", instruction: "Breathe in deeply through your nose", duration: 4, visualCue: "inhale" },
              { id: "step-8", instruction: "Hold your breath gently", duration: 7, visualCue: "hold" },
              { id: "step-9", instruction: "Exhale slowly through your mouth", duration: 8, visualCue: "exhale" }
            ]
          }
        },
        {
          id: "quiz-breathing",
          type: "quiz_multiple_choice",
          title: "Test Your Knowledge",
          duration: 5,
          section: "earn",
          content: [
            {
              id: "q1",
              question: "What does the 4-7-8 breathing technique involve?",
              options: [
                "Inhale 4, hold 7, exhale 8",
                "Inhale 8, hold 7, exhale 4",
                "Inhale 4, hold 4, exhale 8",
                "Inhale 7, hold 8, exhale 4"
              ],
              correctAnswer: 0,
              explanation: "The 4-7-8 technique involves inhaling for 4 counts, holding for 7 counts, and exhaling for 8 counts."
            },
            {
              id: "q2",
              question: "Which part of the nervous system does deep breathing activate?",
              options: [
                "Sympathetic nervous system",
                "Parasympathetic nervous system",
                "Central nervous system",
                "Peripheral nervous system"
              ],
              correctAnswer: 1,
              explanation: "Deep breathing activates the parasympathetic nervous system, which promotes relaxation and reduces stress."
            }
          ]
        }
      ];
    }
    // Program 2: Leadership Communication Excellence (deep_learning: 18/2/5)
    else if (i === 1) {
      programType = "deep_learning";
      contentItems = [
        {
          id: "lecture-communication",
          type: "lecture",
          title: "Leadership Communication Fundamentals",
          duration: 10,
          section: "learn",
          content: "https://example.com/leadership-communication.mp3"
        },
        {
          id: "key-takeaways-leadership",
          type: "key_takeaways",
          title: "Key Communication Principles",
          duration: 8,
          section: "learn",
          content: {
            quick: "Effective leaders master three core skills: active listening, clear messaging, and empathetic response. These create trust and alignment.",
            deep: "Effective leaders master three core communication skills: active listening, clear messaging, and empathetic response. These create trust and alignment in teams.\n\n**Active Listening**: Go beyond hearing words to understand intent, emotions, and context. Leaders who practice active listening report 50% higher team engagement. Maintain eye contact, ask clarifying questions, and paraphrase to confirm understanding.\n\n**Clear Messaging**: Articulate vision and expectations with precision. Ambiguity breeds confusion and misalignment. Use the 'headline first' approach—state your main point upfront, then provide supporting details. This respects your team's time and ensures key messages land.\n\n**Empathetic Response**: Acknowledge emotions and perspectives before problem-solving. Research shows empathy increases psychological safety by 60%, enabling teams to take creative risks and innovate fearlessly.\n\nThese three skills compound: active listening builds trust, clear messaging provides direction, and empathetic response maintains morale through challenges."
          }
        },
        {
          id: "practice-listening",
          type: "deep_dive",
          title: "Active Listening in Practice",
          duration: 2,
          section: "act",
          content: "In your next conversation, practice these three techniques: 1) Maintain eye contact and nod to show engagement, 2) Paraphrase what you hear, 3) Ask open-ended questions to deepen understanding."
        },
        {
          id: "quiz-leadership",
          type: "quiz_true_false",
          title: "Leadership Communication Check",
          duration: 5,
          section: "earn",
          content: [
            {
              id: "q1",
              question: "Active listening increases team engagement by approximately 50%.",
              correctAnswer: true,
              explanation: "Research confirms that active listening significantly boosts team engagement, with studies showing increases around 50%."
            },
            {
              id: "q2",
              question: "The 'headline first' approach means providing details before stating your main point.",
              correctAnswer: false,
              explanation: "The 'headline first' approach means stating your main point upfront, then providing supporting details."
            },
            {
              id: "q3",
              question: "Empathy increases psychological safety in teams by about 60%.",
              correctAnswer: true,
              explanation: "Studies show that empathetic leadership increases psychological safety by approximately 60%, enabling teams to innovate and take creative risks."
            }
          ]
        }
      ];
    }
    // Program 3: Creative Problem Solving Workshop (hands_on_practice: 8/12/5)
    else if (i === 2) {
      programType = "hands_on_practice";
      contentItems = [
        {
          id: "key-creativity",
          type: "key_takeaways",
          title: "Creative Thinking Frameworks",
          duration: 5,
          section: "learn",
          content: {
            quick: "Creativity isn't magic—it's a skill. Use divergent thinking to generate many ideas, then convergent thinking to refine the best ones.",
            deep: "Creativity isn't magic—it's a skill you can develop through practice. Two complementary thinking modes drive creative problem-solving:\n\n**Divergent Thinking**: Generate many ideas without judgment. Quantity breeds quality. Set a timer for 10 minutes and brainstorm at least 20 solutions to your challenge. Wild ideas welcome—they often spark practical innovations.\n\n**Convergent Thinking**: Evaluate and refine your ideas. Group similar concepts, identify patterns, and select the most promising solutions based on feasibility and impact.\n\nCreative problem-solving also benefits from constraint-based thinking. Paradoxically, limitations force innovative solutions. If budget or time is constrained, your brain finds creative workarounds it wouldn't discover with unlimited resources.\n\nFinally, movement unlocks creativity. Physical activity increases blood flow to the brain's creative centers. A 5-minute walk can boost creative output by 60%."
          }
        },
        {
          id: "podcast-innovation",
          type: "podcast",
          title: "Innovation in Action",
          duration: 3,
          section: "learn",
          content: "https://example.com/innovation.mp3"
        },
        {
          id: "movement-activity",
          type: "guided_activity",
          title: "Creative Movement Break",
          duration: 10,
          section: "act",
          content: {
            activityType: "movement",
            description: "Physical movement to unlock creative thinking and generate fresh perspectives.",
            steps: [
              { id: "step-1", instruction: "Stand up and stretch your arms overhead", duration: 30, visualCue: "move" },
              { id: "step-2", instruction: "Shake out your hands and wrists", duration: 20, visualCue: "move" },
              { id: "step-3", instruction: "Roll your shoulders backwards 5 times", duration: 25, visualCue: "move" },
              { id: "step-4", instruction: "Take 3 deep breaths while swaying gently", duration: 30, visualCue: "move" },
              { id: "step-5", instruction: "Walk in place for 30 steps", duration: 40, visualCue: "move" },
              { id: "step-6", instruction: "Stretch side to side, reaching overhead", duration: 35, visualCue: "move" },
              { id: "step-7", instruction: "Return to center and breathe deeply", duration: 20, visualCue: "rest" }
            ]
          }
        },
        {
          id: "brainstorm-practice",
          type: "deep_dive",
          title: "Rapid Ideation Exercise",
          duration: 2,
          section: "act",
          content: "Think of a current challenge. Set a 60-second timer and write down at least 10 possible solutions—no judgment, just quantity. Wild ideas encouraged!"
        },
        {
          id: "quiz-creativity",
          type: "quiz_multiple_choice",
          title: "Creative Thinking Assessment",
          duration: 5,
          section: "earn",
          content: [
            {
              id: "q1",
              question: "What is the primary goal of divergent thinking?",
              options: [
                "To evaluate and refine ideas",
                "To generate many ideas without judgment",
                "To eliminate bad solutions quickly",
                "To focus on one perfect solution"
              ],
              correctAnswer: 1,
              explanation: "Divergent thinking aims to generate many ideas without judgment. Quantity leads to quality in creative brainstorming."
            },
            {
              id: "q2",
              question: "How much can a 5-minute walk boost creative output?",
              options: [
                "20%",
                "40%",
                "60%",
                "80%"
              ],
              correctAnswer: 2,
              explanation: "Research shows a 5-minute walk can boost creative output by approximately 60%."
            }
          ]
        }
      ];
    }
    // Program 4: Stress Relief & Recovery (personal_wellbeing: 10/10/5)
    else if (i === 3) {
      programType = "personal_wellbeing";
      contentItems = [
        {
          id: "podcast-stress",
          type: "podcast",
          title: "Understanding Stress and Recovery",
          duration: 7,
          section: "learn",
          content: "https://example.com/stress-recovery.mp3"
        },
        {
          id: "deep-dive-recovery",
          type: "deep_dive",
          title: "The Science of Relaxation",
          duration: 3,
          section: "learn",
          content: {
            quick: "Progressive muscle relaxation reduces stress by systematically tensing and releasing muscle groups. This technique lowers cortisol and promotes deep calm.",
            deep: "Progressive muscle relaxation (PMR) reduces stress by systematically tensing and releasing muscle groups. This technique lowers cortisol and promotes deep calm.\n\nDeveloped by Dr. Edmund Jacobson in the 1920s, PMR works by teaching your body to recognize the difference between tension and relaxation. When you deliberately tense muscles and then release them, you create a deeper state of relaxation than you could achieve through rest alone.\n\nThe physiological benefits are profound: PMR reduces cortisol levels by up to 30%, decreases muscle tension headaches, improves sleep quality, and lowers blood pressure. Many therapists recommend PMR for anxiety management because it gives you a tangible technique to counter stress in the moment.\n\nThe practice is simple: starting with your toes and moving upward, tense each muscle group for 5 seconds, then release for 30 seconds. Focus on the sensation of tension leaving your body. This systematic approach ensures you address tension you may not even realize you're carrying.\n\nRegular practice—just 10 minutes daily—rewires your stress response, making you more resilient and better able to recover from challenging situations."
          }
        },
        {
          id: "relaxation-practice",
          type: "guided_activity",
          title: "Progressive Relaxation",
          duration: 10,
          section: "act",
          content: {
            activityType: "relaxation",
            description: "Systematically release tension from every part of your body for deep stress relief.",
            steps: [
              { id: "step-1", instruction: "Tense your feet, then release", duration: 35, visualCue: "rest" },
              { id: "step-2", instruction: "Tense your calves, then release", duration: 35, visualCue: "rest" },
              { id: "step-3", instruction: "Tense your thighs, then release", duration: 35, visualCue: "rest" },
              { id: "step-4", instruction: "Tense your abdomen, then release", duration: 35, visualCue: "rest" },
              { id: "step-5", instruction: "Tense your hands and arms, then release", duration: 35, visualCue: "rest" },
              { id: "step-6", instruction: "Tense your shoulders, then release", duration: 35, visualCue: "rest" },
              { id: "step-7", instruction: "Tense your face and jaw, then release", duration: 35, visualCue: "rest" },
              { id: "step-8", instruction: "Breathe deeply and scan your whole body", duration: 55, visualCue: "rest" }
            ]
          }
        },
        {
          id: "quiz-recovery",
          type: "quiz_true_false",
          title: "Recovery Knowledge Check",
          duration: 5,
          section: "earn",
          content: [
            {
              id: "q1",
              question: "Progressive muscle relaxation can reduce cortisol levels by up to 30%.",
              correctAnswer: true,
              explanation: "Research shows that PMR can reduce cortisol levels by approximately 30%, significantly lowering stress."
            },
            {
              id: "q2",
              question: "In progressive muscle relaxation, you should hold tension for 30 seconds.",
              correctAnswer: false,
              explanation: "You should tense muscles for about 5 seconds, then release and relax for 30 seconds."
            }
          ]
        }
      ];
    }
    // Program 5: Innovation Thinking Lab (creative_exploration: 7/13/5)
    else {
      programType = "creative_exploration";
      contentItems = [
        {
          id: "lecture-innovation",
          type: "lecture",
          title: "Innovation Frameworks Masterclass",
          duration: 7,
          section: "learn",
          content: "https://example.com/innovation-frameworks.mp3"
        },
        {
          id: "guided-ideation",
          type: "guided_activity",
          title: "Innovation Sprint Exercise",
          duration: 8,
          section: "act",
          content: {
            activityType: "movement",
            description: "A dynamic innovation exercise combining movement and rapid ideation.",
            steps: [
              { id: "step-1", instruction: "Stand and think of a problem to solve", duration: 30, visualCue: "move" },
              { id: "step-2", instruction: "Walk around while brainstorming—motion sparks ideas", duration: 90, visualCue: "move" },
              { id: "step-3", instruction: "Pause and write down your best 3 ideas", duration: 60, visualCue: "rest" },
              { id: "step-4", instruction: "Move again, building on those ideas", duration: 90, visualCue: "move" },
              { id: "step-5", instruction: "Return and refine your top solution", duration: 60, visualCue: "rest" }
            ]
          }
        },
        {
          id: "deep-dive-innovation",
          type: "deep_dive",
          title: "Innovation Mindset Principles",
          duration: 5,
          section: "act",
          content: {
            quick: "Innovation requires embracing failure as learning. Rapid prototyping and user feedback beat perfectionism. Test early, iterate often.",
            deep: "Innovation requires embracing failure as learning. Rapid prototyping and user feedback beat perfectionism. Test early, iterate often.\n\n**Embrace Productive Failure**: Every failed experiment teaches you what doesn't work, narrowing the path to what will. Companies like Google and Amazon celebrate 'intelligent failures' because they accelerate learning. When you shift from fearing failure to mining it for insights, innovation accelerates.\n\n**Rapid Prototyping**: Build the simplest version of your idea that you can test. Don't wait for perfection. A rough prototype tested with real users beats a polished concept that never leaves the drawing board. Speed of learning trumps polish in early stages.\n\n**User-Centered Feedback**: Your assumptions about what users need are often wrong. Talk to real users early and often. Their feedback will surprise you and redirect your innovation in valuable ways you couldn't have predicted.\n\n**Iterate Relentlessly**: Each iteration should be a meaningful experiment. Ask: What's the riskiest assumption I'm making? How can I test it quickly and cheaply? This experimental mindset transforms innovation from guesswork into a systematic process.\n\nThe most successful innovators aren't the smartest—they're the ones who test ideas fastest and learn from each experiment."
          }
        },
        {
          id: "quiz-innovation",
          type: "quiz_multiple_choice",
          title: "Innovation Mastery Quiz",
          duration: 5,
          section: "earn",
          content: [
            {
              id: "q1",
              question: "What is the primary benefit of rapid prototyping?",
              options: [
                "Creating perfect products",
                "Avoiding all mistakes",
                "Learning quickly through testing",
                "Impressing stakeholders"
              ],
              correctAnswer: 2,
              explanation: "Rapid prototyping enables fast learning through testing real ideas with users, which beats waiting for perfection."
            },
            {
              id: "q2",
              question: "According to innovation best practices, when should you seek user feedback?",
              options: [
                "Only after the product is complete",
                "Early and often",
                "Never, trust your expertise",
                "Only when problems arise"
              ],
              correctAnswer: 1,
              explanation: "User feedback should be sought early and often to ensure your innovation meets real needs and to catch wrong assumptions quickly."
            },
            {
              id: "q3",
              question: "What should each iteration in innovation focus on?",
              options: [
                "Adding more features",
                "Making it look better",
                "Testing the riskiest assumption",
                "Getting stakeholder approval"
              ],
              correctAnswer: 2,
              explanation: "Each iteration should test your riskiest assumption to learn quickly and systematically reduce uncertainty."
            }
          ]
        }
      ];
    }
    
    // Get correct durations for this program type
    const typeConfig = getProgramTypeConfig(programType);
    
    // Create the loop with contentItems and correct durations
    await storage.createLoop({
      programId: createdProgram.id,
      index: 1,
      title: `${createdProgram.title} - Session 1`,
      programType: programType,
      phaseLearnText: programData.content.learn,
      phaseActText: programData.content.act,
      phaseEarnText: programData.content.earn.message,
      durLearn: typeConfig.durLearn,
      durAct: typeConfig.durAct,
      durEarn: typeConfig.durEarn,
      contentItems: contentItems as any,
    });
  }

  // Seed achievements
  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first Pomodoro session",
      icon: "Flag",
      requirement: 1,
      type: "sessions_completed",
    },
    {
      title: "Consistency Builder",
      description: "Complete 10 Pomodoro sessions",
      icon: "Target",
      requirement: 10,
      type: "sessions_completed",
    },
    {
      title: "Growth Champion",
      description: "Reach Level 5",
      icon: "Trophy",
      requirement: 5,
      type: "points_earned",
    },
    {
      title: "On Fire",
      description: "Maintain a 7-day streak",
      icon: "Flame",
      requirement: 7,
      type: "streak_days",
    },
    {
      title: "Dedication Master",
      description: "Complete 50 sessions",
      icon: "Award",
      requirement: 50,
      type: "sessions_completed",
    },
  ];

  for (const achievement of achievements) {
    await storage.createAchievement(achievement);
  }

  console.log("✅ Seed data initialized successfully");
}
