// Custom authentication service with Google OAuth and email/password
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "auth_sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Setup authentication
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
  const callbackURL = `https://${domain}/api/callback`;

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL,
          passReqToCallback: true,
          state: true,
        },
        async (req: any, accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email from Google"), undefined);
            }

            // Check if user exists
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Check signup intent to determine role
              const session = req.session as any;
              const isAdminSignup = session.signupIntent === "admin";
              const role = isAdminSignup ? "admin" : "member";

              // Create new user with Google OAuth
              const username = email.split("@")[0] + "-" + crypto.randomUUID().substring(0, 8);
              user = await storage.createUser({
                email: email,
                username: username,
                displayName: profile.displayName || null,
                avatarUrl: profile.photos?.[0]?.value || null,
                provider: "google",
                oauthSubject: profile.id,
                passwordHash: null,
                role,
              });
            } else if (user.provider !== "google") {
              // User exists with different provider
              return done(new Error("Email already registered with different method"), undefined);
            }

            return done(null, { id: user.id, email: user.email });
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // Local email/password Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (user.provider !== "local" || !user.passwordHash) {
            return done(null, false, { message: "Please use Google to sign in" });
          }

          const isValid = await comparePassword(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Return full user object so it gets properly serialized
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"), null);
      }
      // Return the FULL user object so req.user has all fields (role, organizationId, etc.)
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth routes
  
  // Google OAuth initiation
  app.get("/api/auth/google", (req, res, next) => {
    // Store signup intent in session
    if (req.query.signup === "admin") {
      (req.session as any).signupIntent = "admin";
    } else if (req.query.token) {
      (req.session as any).invitationToken = req.query.token;
    }
    
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  // Google OAuth callback
  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any) => {
      if (err || !user) {
        return res.redirect("/login?error=auth_failed");
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.redirect("/login?error=login_failed");
        }

        // Check signup intent
        const session = req.session as any;
        if (session.signupIntent === "admin") {
          delete session.signupIntent;
          return res.redirect("/admin/onboarding");
        } else if (session.invitationToken) {
          const token = session.invitationToken;
          delete session.invitationToken;
          return res.redirect(`/signup/${token}`);
        }

        // Redirect based on user role: admins to /admin, regular users to chat home
        const redirectPath = user.role === "admin" ? "/admin" : "/";
        return res.redirect(redirectPath);
      });
    })(req, res, next);
  });

  // Local email/password registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request body
      const registerSchema = z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().optional(),
      });

      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password, name } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Check signup intent to determine role
      const session = req.session as any;
      const isAdminSignup = session.signupIntent === "admin";
      const role = isAdminSignup ? "admin" : "member";

      // Create user
      const username = email.split("@")[0] + "-" + crypto.randomUUID().substring(0, 8);
      const user = await storage.createUser({
        email,
        username,
        displayName: name || null,
        passwordHash,
        provider: "local",
        oauthSubject: null,
        avatarUrl: null,
        role,
      });

      // Log them in (pass full user object so session has all fields including role)
      // Note: req.login() can regenerate session, so we preserve signupIntent/invitationToken
      const savedSignupIntent = session.signupIntent;
      const savedInvitationToken = session.invitationToken;
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Registration successful but login failed" });
        }

        // Restore preserved session values (in case req.login regenerated session)
        if (savedSignupIntent) {
          req.session.signupIntent = savedSignupIntent;
        }
        if (savedInvitationToken) {
          req.session.invitationToken = savedInvitationToken;
        }
        
        // Explicitly save session to ensure persistence
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("[REGISTRATION] Failed to save session after login:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          
          console.log("[REGISTRATION] Session saved. SignupIntent:", req.session.signupIntent);
          
          // Redirect based on signup type (don't clear signupIntent yet - onboarding needs it)
          if (isAdminSignup) {
            return res.json({ success: true, redirect: "/admin/onboarding" });
          } else if (savedInvitationToken) {
            return res.json({ success: true, redirect: `/signup/${savedInvitationToken}` });
          }

          res.json({ success: true, redirect: "/" });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Local email/password login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }

        // Check signup intent
        const session = req.session as any;
        if (session.signupIntent === "admin") {
          return res.json({ success: true, redirect: "/admin/onboarding" });
        } else if (session.invitationToken) {
          const token = session.invitationToken;
          delete session.invitationToken;
          return res.json({ success: true, redirect: `/signup/${token}` });
        }

        // Redirect based on user role: admins to /admin, regular users to chat home
        const redirectPath = user.role === "admin" ? "/admin" : "/";
        res.json({ success: true, redirect: redirectPath });
      });
    })(req, res, next);
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as { id: string; email: string };
      res.json(user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/login");
      });
    });
  });
}

// Auth middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export const requireAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = (req.user as any).id;
  const user = await storage.getUser(userId);

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};
