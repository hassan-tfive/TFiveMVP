import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import {
  insertProgramSchema,
  insertSessionSchema,
  insertChatMessageSchema,
} from "@shared/schema";

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_USER_ID = "default-user";

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
    const updates = req.body;
    const user = await storage.updateUser(DEFAULT_USER_ID, updates);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
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
      // Get program to calculate points
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

      // Calculate points (from program content)
      const pointsEarned = (program.content as any)?.earn?.points || 100;

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
      const { content, workspace } = insertChatMessageSchema.parse({
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
      
      // Prepare system message based on workspace
      const systemMessage = workspace === "professional"
        ? "You are T, an AI companion for Tfive, a professional development platform. You help users with career growth, workplace wellbeing, and professional skills using the Pomodoro technique (25-minute sessions). Be encouraging, professional, and focused on actionable growth. Keep responses concise and supportive."
        : "You are T, an AI companion for Tfive, a personal development platform. You help users with personal growth, wellbeing, and self-discovery in their private space. Be warm, empathetic, and encouraging. Keep responses concise and supportive.";

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

  // Initialize seed data
  await initializeSeedData();

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSeedData() {
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
