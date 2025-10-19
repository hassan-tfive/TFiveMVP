import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
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
} from "./ai-workflows";

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_USER_ID = "default-user";

// Admin authorization middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await storage.getUser(DEFAULT_USER_ID);
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
  // User routes
  app.get("/api/user", async (req, res) => {
    const user = await storage.getUser(DEFAULT_USER_ID);
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

  app.get("/api/programs/:id", async (req, res) => {
    const program = await storage.getProgram(req.params.id);
    if (!program) {
      return res.status(404).json({ error: "Program not found" });
    }
    res.json(program);
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

  // Create program from wizard data or natural prompt with AI-generated content
  app.post("/api/programs/generate", async (req, res) => {
    try {
      // Support both wizard mode (structured) and prompt mode (natural language)
      const requestSchema = z.union([
        // Wizard mode
        z.object({
          topic: z.string(),
          goal: z.string(),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]),
          workspace: z.enum(["professional", "personal", "both"]),
        }),
        // Prompt mode
        z.object({
          prompt: z.string(),
          workspace: z.enum(["professional", "personal", "both"]).optional(),
        }),
      ]);

      const requestData = requestSchema.parse(req.body);
      const isWizardMode = 'topic' in requestData;

      // Sophisticated Tairo system prompt with dynamic duration allocation
      const systemPrompt = `You are Tairo, TFIVE's AI companion that creates personalized 25-minute (or shorter) Learn→Act→Earn development programs.

Your task is to:
1. Understand the user's request and emotional/professional context
2. Identify the topic DOMAIN and CATEGORY that best fits (choose from these options):
   DOMAINS: focus, leadership, recovery, stress, inclusion, wellbeing
   CATEGORIES: wellbeing, recovery, inclusion, focus
3. Dynamically assign phase durations based on domain (total ≤ 25 minutes):
   - Focus/Productivity: Learn 6min, Act 15min, Earn 4min
   - Leadership: Learn 12min, Act 9min, Earn 4min
   - Recovery: Learn 14min, Act 7min, Earn 4min
   - Wellbeing: Learn 10min, Act 11min, Earn 4min
   - Stress: Learn 8min, Act 12min, Earn 5min
   - Inclusion/Empathy: Learn 9min, Act 12min, Earn 4min
4. Write rich, actionable content for each phase
5. Create a visual description for the program image
6. Suggest a follow-up program

${isWizardMode ? `User provided structured input:
- Topic: ${requestData.topic}
- Goal: ${requestData.goal}
- Difficulty: ${requestData.difficulty}
- Workspace: ${requestData.workspace}` : `User's natural language request: "${requestData.prompt}"
Workspace context: ${requestData.workspace || 'professional'}`}

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling title (3-6 words)",
  "description": "Brief engaging description (2-3 sentences)",
  "domain": "focus|leadership|recovery|stress|inclusion|wellbeing",
  "category": "wellbeing|recovery|inclusion|focus",
  "difficulty": "beginner|intermediate|advanced",
  "goal": "Specific user goal statement",
  "imagePrompt": "Detailed visual description for an abstract, calming image that represents this program's theme (be specific about colors, mood, elements)",
  "durations": {
    "learn": <number>,
    "act": <number>,
    "earn": <number>
  },
  "content": {
    "learn": "Educational content, key concepts, insights",
    "act": "Practical exercises, specific steps to practice",
    "earnMessage": "Celebration message with specific takeaway"
  },
  "followupSuggestion": "Suggested next program title"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      // Helper function to create fallback content
      const createFallbackContent = (reason: string) => {
        console.log(`Using fallback content. Reason: ${reason}`);
        
        // Determine values from request
        const topic = isWizardMode ? requestData.topic : requestData.prompt;
        const goal = isWizardMode ? requestData.goal : `Achieve progress with ${topic}`;
        const category = 'wellbeing';
        const difficulty = isWizardMode ? requestData.difficulty : 'beginner';
        const workspace = isWizardMode ? requestData.workspace : (requestData.workspace || 'professional');
        
        // Default domain-based durations (wellbeing)
        const durations = { learn: 10, act: 11, earn: 4 };
        
        return {
          title: `${topic.charAt(0).toUpperCase()}${topic.slice(1, 40)}`,
          description: goal,
          domain: 'wellbeing',
          category,
          difficulty,
          goal,
          imagePrompt: `Calming abstract background with soft gradients, peaceful colors like blue and purple, representing mindfulness and personal growth, minimalist design, serene atmosphere`,
          durations,
          content: {
            learn: `Explore the fundamentals of ${topic}. Understand key concepts and insights that will help you ${goal.toLowerCase()}.`,
            act: `Practice exercises related to ${topic}. Apply what you've learned through actionable steps.`,
            earnMessage: `Great work exploring ${topic}! You're one step closer to ${goal.toLowerCase()}.`,
          },
          followupSuggestion: `Continue your journey with ${category}`,
        };
      };

      // Define validation schema for OpenAI response
      const aiResponseSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(10).max(500),
        domain: z.enum(["focus", "leadership", "recovery", "stress", "inclusion", "wellbeing"]),
        category: z.enum(["wellbeing", "recovery", "inclusion", "focus"]),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        goal: z.string().min(5),
        imagePrompt: z.string().min(20),
        durations: z.object({
          learn: z.number().min(1).max(20),
          act: z.number().min(1).max(20),
          earn: z.number().min(1).max(10),
        }).refine(d => d.learn + d.act + d.earn <= 25, {
          message: "Total duration must be ≤ 25 minutes"
        }),
        content: z.object({
          learn: z.string().min(20),
          act: z.string().min(20),
          earnMessage: z.string().min(10),
        }),
        followupSuggestion: z.string().optional(),
      });

      let generatedContent;

      // Try to parse and validate AI response, fall back if anything fails
      if (!responseText) {
        console.error("OpenAI returned empty response");
        generatedContent = createFallbackContent("Empty AI response");
      } else {
        try {
          const parsedContent = JSON.parse(responseText);
          const validationResult = aiResponseSchema.safeParse(parsedContent);
          
          if (validationResult.success) {
            generatedContent = validationResult.data;
          } else {
            console.error("OpenAI response validation failed:", validationResult.error);
            console.error("Raw content:", parsedContent);
            generatedContent = createFallbackContent("Schema validation failed");
          }
        } catch (parseError) {
          console.error("Failed to parse OpenAI JSON:", responseText);
          generatedContent = createFallbackContent("JSON parsing failed");
        }
      }

      // Calculate total duration
      const totalDuration = generatedContent.durations.learn + 
                           generatedContent.durations.act + 
                           generatedContent.durations.earn;

      // Generate program image using DALL-E 2 (more compatible)
      let imageUrl: string | null = null;
      try {
        console.log('[Image Generation] Generating image with prompt:', generatedContent.imagePrompt);
        const imageResponse = await openai.images.generate({
          model: "dall-e-2",
          prompt: generatedContent.imagePrompt,
          n: 1,
          size: "512x512",
        });
        imageUrl = imageResponse.data?.[0]?.url || null;
        console.log('[Image Generation] Image generated successfully:', imageUrl ? 'Yes' : 'No');
      } catch (imageError: any) {
        console.error('[Image Generation] Failed to generate image:', imageError?.message || imageError);
        // Set a placeholder/fallback image URL based on domain
        const domainImages: Record<string, string> = {
          'focus': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop',
          'leadership': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
          'recovery': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
          'stress': 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop',
          'inclusion': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
          'wellbeing': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
        };
        imageUrl = domainImages[generatedContent.domain] || domainImages['wellbeing'];
        console.log('[Image Generation] Using fallback image for domain:', generatedContent.domain);
      }

      // Create the program with dynamic durations
      const programData = {
        title: generatedContent.title,
        description: generatedContent.description,
        category: generatedContent.category,
        difficulty: generatedContent.difficulty,
        duration: totalDuration,
        content: {
          learn: generatedContent.content.learn,
          act: generatedContent.content.act,
          earn: {
            points: 50,
            message: generatedContent.content.earnMessage,
          },
        },
        workspace: isWizardMode ? requestData.workspace : (requestData.workspace || 'both'),
        imageUrl,
        // Enhanced fields
        domain: generatedContent.domain,
        goal: generatedContent.goal,
        durationLearn: generatedContent.durations.learn,
        durationAct: generatedContent.durations.act,
        durationEarn: generatedContent.durations.earn,
        metadata: {
          followupSuggestion: generatedContent.followupSuggestion,
          generatedAt: new Date().toISOString(),
          mode: isWizardMode ? 'wizard' : 'prompt',
        },
      };

      console.log('[Program Generation] Creating program with data:', {
        domain: programData.domain,
        durationLearn: programData.durationLearn,
        durationAct: programData.durationAct,
        durationEarn: programData.durationEarn,
      });

      const program = await storage.createProgram(programData);
      
      console.log('[Program Generation] Program created:', {
        id: program.id,
        domain: program.domain,
        durationLearn: program.durationLearn,
        durationAct: program.durationAct,
        durationEarn: program.durationEarn,
      });
      
      res.status(201).json(program);
    } catch (error) {
      console.error("Program generation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to generate program" });
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

  // Chat routes with OpenAI integration
  app.get("/api/chat", async (req, res) => {
    const workspace = req.query.workspace as string;
    const messages = await storage.getChatMessages(DEFAULT_USER_ID, workspace);
    res.json(messages);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { content, workspace, phase, sessionId } = insertChatMessageSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
        role: "user",
      });

      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        role: "user",
        content,
        workspace,
      });

      // Get conversation history for context
      const history = await storage.getChatMessages(DEFAULT_USER_ID, workspace);
      
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
      });

      res.json({
        userMessage,
        assistantMessage,
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
  app.get("/api/admin/organizations", requireAdmin, async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
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
      });

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

  // POST /api/sessions/start - Start a loop session
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

      // Create session for this loop
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
  app.get("/api/programs/:id/loops", async (req, res) => {
    try {
      const { id } = req.params;
      const loops = await storage.getProgramLoops(id);
      res.json(loops);
    } catch (error) {
      console.error("Get loops error:", error);
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
      res.json(loop);
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
  if (existingPrograms.length > 0) {
    return; // Already seeded
  }

  // Seed programs
  const programs = [
    {
      title: "Mindful Breathing for Focus",
      description: "Learn breathing techniques to enhance concentration and reduce stress during work sessions.",
      category: "wellbeing",
      difficulty: "beginner",
      duration: 25,
      workspace: "both",
      imageUrl: "/src/assets/generated_images/Wellbeing_program_abstract_background_8b262da7.png",
      content: {
        learn: "Deep breathing activates your parasympathetic nervous system, reducing stress and improving focus. The 4-7-8 technique involves inhaling for 4 counts, holding for 7, and exhaling for 8. This pattern helps regulate your nervous system and brings immediate calm.",
        act: "Practice the 4-7-8 breathing technique right now. Find a comfortable position, close your eyes if you wish, and complete 5 full cycles. Breathe in through your nose for 4 counts, hold for 7, and exhale slowly through your mouth for 8 counts. Notice how your body feels after each cycle.",
        earn: {
          points: 100,
          message: "Excellent work! You've completed your first mindfulness session. Regular breathing practice can reduce stress by up to 40% and improve focus within just a few days.",
        },
      },
    },
    {
      title: "Building Resilience Through Reflection",
      description: "Develop emotional strength by reflecting on challenges and growth opportunities.",
      category: "recovery",
      difficulty: "intermediate",
      duration: 25,
      workspace: "personal",
      imageUrl: "/src/assets/generated_images/Recovery_program_abstract_background_ac13e09c.png",
      content: {
        learn: "Resilience isn't about avoiding difficult emotions—it's about processing them constructively. Reflection helps you identify patterns, recognize growth, and build emotional intelligence. Studies show that regular reflection increases resilience by 35%.",
        act: "Think of a recent challenge you faced. Write down: 1) What happened, 2) How you felt, 3) What you learned, 4) How you can use this wisdom going forward. Be honest and compassionate with yourself.",
        earn: {
          points: 150,
          message: "You've taken a powerful step in building resilience. Self-reflection is the foundation of personal growth and emotional strength.",
        },
      },
    },
    {
      title: "Active Listening for Inclusion",
      description: "Master the art of truly hearing others to build stronger, more inclusive relationships.",
      category: "inclusion",
      difficulty: "intermediate",
      duration: 25,
      workspace: "professional",
      imageUrl: "/src/assets/generated_images/Inclusion_program_abstract_background_17e057a0.png",
      content: {
        learn: "Active listening goes beyond hearing words—it's about understanding meaning, emotions, and context. It involves full presence, curiosity, and suspended judgment. Research shows active listening increases team collaboration by 50% and reduces conflicts significantly.",
        act: "In your next conversation today, practice these three techniques: 1) Maintain eye contact and nod to show engagement, 2) Paraphrase what you hear ('So what you're saying is...'), 3) Ask open-ended questions to deepen understanding. Notice the difference it makes.",
        earn: {
          points: 150,
          message: "Excellent! Active listening is one of the most powerful skills for building inclusive environments and meaningful connections.",
        },
      },
    },
    {
      title: "Deep Work: Eliminating Distractions",
      description: "Create an environment optimized for deep, focused work and maximum productivity.",
      category: "focus",
      difficulty: "advanced",
      duration: 25,
      workspace: "both",
      imageUrl: "/src/assets/generated_images/Focus_program_abstract_background_cffc6aef.png",
      content: {
        learn: "Deep work requires eliminating all distractions for sustained periods. Studies by Cal Newport show that it takes an average of 23 minutes to regain focus after an interruption. Creating a distraction-free environment can increase productivity by 300%.",
        act: "Prepare your deep work environment now: 1) Close all unnecessary browser tabs and apps, 2) Put your phone in another room or drawer, 3) Set specific work boundaries (no email, no chat), 4) Choose one important task and work on it for the next 25 minutes with complete focus.",
        earn: {
          points: 200,
          message: "Outstanding! You've mastered the art of deep work. This skill will transform your productivity and the quality of your output.",
        },
      },
    },
    {
      title: "Gratitude Practice for Wellbeing",
      description: "Cultivate positivity and mental health through structured gratitude exercises.",
      category: "wellbeing",
      difficulty: "beginner",
      duration: 25,
      workspace: "both",
      imageUrl: "/src/assets/generated_images/Wellbeing_program_abstract_background_8b262da7.png",
      content: {
        learn: "Gratitude rewires your brain for positivity. Research shows that daily gratitude practice can increase happiness by 25%, improve sleep quality, and strengthen relationships. The key is specificity—being precise about what you're grateful for and why.",
        act: "Write down three specific things you're grateful for today. For each one, explain why it matters and how it impacted your life. Go beyond surface-level ('I'm grateful for coffee') to deeper meaning ('I'm grateful for my morning coffee because it's a peaceful moment before the day begins').",
        earn: {
          points: 100,
          message: "Beautiful work! Regular gratitude practice is scientifically proven to improve mental health and overall life satisfaction.",
        },
      },
    },
  ];

  for (const program of programs) {
    await storage.createProgram(program);
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
