# Tfive - 25 Minutes to Personal Growth

## Overview
Tfive is an AI-powered personal development platform centered on the Pomodoro technique. It aims to drive personal growth through 25-minute focus sessions, combining AI coaching with structured learning via a Check-In → Learn → Act → Earn framework. The platform supports both professional and personal growth with distinct workspaces and integrates gamification to encourage consistent engagement. It is designed to be a comprehensive solution for individual and enterprise-level personal development, fostering focus, learning, and well-being.

## User Preferences
I prefer clear, concise explanations and iterative development. Ask before making major architectural changes. Do not make changes to files or folders unless explicitly instructed or if it's a direct result of an approved feature implementation. I value a conversational interaction style, and I prefer that the agent focuses on completing tasks efficiently while keeping me informed of progress and potential roadblocks.

## System Architecture
Tfive features a dual workspace architecture (Professional and Personal) distinguished by color themes and data contexts. The core interaction is through "Tairo," an AI companion powered by OpenAI, offering contextual guidance through phase-specific prompts during 25-minute Pomodoro sessions. These sessions consist of Check-In, Learn, Act, and Earn phases, each with specific durations and visual timer cues.

The platform includes a curated Program Library with diverse categories, and a simplified AI-powered Program Creation Wizard. The wizard offers two modes: Quick Prompt (natural language) and Step-by-Step (guided 3-step flow: Topic → Goal → Difficulty → Workspace). Tairo automatically infers both the domain (for timing allocation) and category (for display) from user input, eliminating the need for manual categorization. All programs include automatically generated images using DALL-E 2, with curated Unsplash fallbacks by domain to ensure every program has visually appealing artwork. Dynamic duration allocation is based on domain: Focus (6/15/4), Leadership (12/9/4), Recovery (14/7/4), Wellbeing (10/11/4), Inclusion (9/12/4), and Stress Management (8/13/4).

Gamification elements like points, leveling, reward systems, and achievement badges are integrated to track and motivate progress. User profiles support avatar customization and display personal stats. An Enterprise Admin Dashboard provides organization and team management, user rosters, and engagement analytics with role-based access control.

The frontend is built with React, TypeScript, Tailwind CSS, Shadcn UI, Wouter for routing, TanStack Query for data fetching, and Framer Motion for animations. The backend uses Express.js, integrates OpenAI, and utilizes a PostgreSQL database with Drizzle ORM (Neon). Zod is used for validation, and a role-based authorization middleware secures admin features. The design system employs Inter, Sora, and JetBrains Mono fonts, with a distinct color palette for brand elements (Navy Blue #003C51, Soft Gold #E3B34A, Teal #2D9DA8), workspaces, and timer phases, supporting dark mode. Custom SVG icons enhance the UI: "Rising Spiral" for Achievements (growth), "Fingerprint Lines" for Profile (uniqueness), and "Eye with Frame" for Admin (oversight).

## Authentication & User Management
Tfive uses **custom authentication** with Passport.js supporting both **Google OAuth 2.0** and **email/password** authentication, with PostgreSQL session management and role-based access control.

### Authentication Methods
1. **Google OAuth**: Single-click authentication using Google account
2. **Email/Password**: Traditional credentials with bcrypt password hashing (10 rounds, 8-char minimum)

### Technical Implementation
- **Backend**: `server/auth.ts` with Passport.js strategies (Google OAuth, Local)
- **Session Storage**: PostgreSQL session store with 7-day TTL
- **Security**: httpOnly, secure cookies with sameSite: lax, OAuth state CSRF protection
- **Validation**: Zod schema validation for registration endpoints
- **Password Hashing**: bcrypt with 10 salt rounds

### Authentication Flow
**Enterprise Admin Signup:**
1. Visit `/admin/signup` → Beautiful standalone signup page (no sidebar/header)
2. Frontend sets `signupIntent: "admin"` in session via `POST /api/signup-intent`
3. User chooses Google OAuth (`GET /api/auth/google`) OR email/password form
4. For email/password: `POST /api/auth/register` with name, email, password (Zod validated)
5. Backend creates user with `role: "admin"` based on session signup intent
6. Session `signupIntent` cleared, user logged in
7. Redirected to `/admin/onboarding` wizard
8. Complete 2-step onboarding → Creates organization
9. Access admin dashboard with full team management capabilities

**Team Member Invitation:**
1. Admin invites user via email from Team Management page
2. System creates invitation token (7-day expiration) and sends branded HTML email via **Resend**
3. User receives professional invitation email with organization name and one-click accept link
4. User clicks link → Redirected to `/signup/:token` with beautiful standalone page
5. Frontend stores `invitationToken` in session via `POST /api/store-invitation-token`
6. User authenticates via Google OAuth OR email/password registration
7. Backend creates user with `role: "member"`, logs them in
8. Redirected back to `/signup/:token`, invitation auto-accepted via `POST /api/invitations/:token/accept`
9. User assigned to organization and team, redirected to dashboard

### Security Features
- **Session-based signup intent tracking** prevents privilege escalation
- **Email verification** ensures invitation matches authenticated user's email
- **Token expiration** (7 days) limits invitation validity
- **Role-based middleware** (`requireAdmin`) protects admin endpoints
- **Password security**: bcrypt hashing, 8-char minimum, client-side validation
- **OAuth CSRF protection**: State parameter enabled for Google OAuth
- **Zod validation**: All registration inputs validated with Zod schemas
- **Provider isolation**: Users created with email/password can't login with Google (and vice versa)
- **Standalone auth layout** for login/signup pages (no app shell, gradient background)

### Email Integration
- **Resend connector** for reliable email delivery with Replit-managed API keys
- **Branded HTML templates** with Tfive design system
- **Automatic email sending** when admins invite team members
- Fallback logging if email fails (invitation still created)

## External Dependencies
- **Passport.js**: Custom authentication with Google OAuth 2.0 and email/password strategies
- **Google OAuth**: OAuth 2.0 authentication provider for single-click login
- **Resend**: Email delivery service for invitation emails, integrated via Replit connectors
- **OpenAI**: Integrated via Replit AI Integrations for the AI companion "Tairo" and AI-powered content generation in the Program Creation Wizard.
- **PostgreSQL**: Used as the primary database, managed with Drizzle ORM and hosted on Neon. Also stores sessions via connect-pg-simple.
- **bcryptjs**: Password hashing for secure credential storage
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn UI**: Component library for UI elements.
- **Wouter**: React hook-based router.
- **TanStack Query**: For data fetching, caching, and state management.
- **Framer Motion**: For animations and interactive components.