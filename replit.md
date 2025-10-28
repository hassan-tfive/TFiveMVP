# Tfive - 25 Minutes to Personal Growth

## Overview
Tfive is an AI-powered personal development platform leveraging the Pomodoro technique for focused personal and professional growth. It integrates AI coaching, structured learning via a Check-In → Learn → Act → Earn framework, and gamification. The platform offers distinct workspaces, a curated Program Library, and an AI-powered Program Creation Wizard. Tfive aims to be a comprehensive solution for individual and enterprise-level personal development, enhancing focus, learning, and well-being.

## User Preferences
I prefer clear, concise explanations and iterative development. Ask before making major architectural changes. Do not make changes to files or folders unless explicitly instructed or if it's a direct result of an approved feature implementation. I value a conversational interaction style, and I prefer that the agent focuses on completing tasks efficiently while keeping me informed of progress and potential roadblocks.

## System Architecture
Tfive features dual Professional and Personal workspaces with distinct color themes. The core interaction involves "Tairo," an OpenAI-powered AI companion providing contextual guidance during 25-minute Pomodoro sessions, structured into Check-In, Learn, Act, and Earn phases.

The platform includes a Program Library and an AI-powered Program Creation Wizard with Quick Prompt and Step-by-Step modes. Tairo automatically infers program domain and category. Programs feature automatically generated DALL-E 2 images with Unsplash fallbacks. Dynamic duration allocation for phases is based on program domain (e.g., Focus, Leadership, Recovery).

Program content is structured into `contentItems` (jsonb field) within loops, supporting content types like podcasts, lectures, deep dives, quizzes, and flashcards. Content is categorized into "Learn by Listening," "Learn by Reading," and "Learn by Interacting." A dedicated Program Detail View at `/program/:loopId` offers Oboe-style sidebar navigation and an immersive full-screen learning experience.

The platform tracks user progress via a "Started Programs" section on the Dashboard and Programs pages, filtered by workspace. Gamification includes points, leveling, rewards, and achievement badges. User profiles allow avatar customization and display stats. An Enterprise Admin Dashboard provides organization/team management, user rosters, and analytics with role-based access control.

The frontend uses React, TypeScript, Tailwind CSS, Shadcn UI, Wouter, TanStack Query, and Framer Motion. The backend uses Express.js, integrates OpenAI, and a PostgreSQL database with Drizzle ORM (Neon). Zod handles validation, and role-based authorization secures admin features. The design system uses Inter, Sora, and JetBrains Mono fonts, a distinct brand color palette, workspace-specific colors, and custom SVG icons for key features.

Authentication is custom, using Passport.js for Google OAuth 2.0 and email/password login. Sessions are managed in PostgreSQL. Enterprise admin signup and team member invitations (via email or shareable link) are supported, with role-based access control. Security features include bcrypt password hashing, Zod validation, httpOnly/secure cookies, OAuth CSRF protection, and email verification.

## External Dependencies
- **Passport.js**: For custom authentication with Google OAuth 2.0 and email/password strategies.
- **Google OAuth**: Authentication provider for single-click login.
- **Resend**: Email delivery service for invitation emails via Replit connectors.
- **OpenAI**: Powers the "Tairo" AI companion and AI-driven content generation.
- **PostgreSQL**: Primary database, managed with Drizzle ORM and hosted on Neon. Used for session storage via `connect-pg-simple`.
- **bcryptjs**: For secure password hashing.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn UI**: Component library for UI elements.
- **Wouter**: React hook-based router.
- **TanStack Query**: For data fetching, caching, and state management.
- **Framer Motion**: For animations and interactive components.