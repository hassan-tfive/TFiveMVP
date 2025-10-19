# Tfive - 25 Minutes to Personal Growth

## Overview
Tfive is an AI-powered personal development platform centered on the Pomodoro technique. It aims to drive personal growth through 25-minute focus sessions, combining AI coaching with structured learning via a Check-In → Learn → Act → Earn framework. The platform supports both professional and personal growth with distinct workspaces and integrates gamification to encourage consistent engagement. It is designed to be a comprehensive solution for individual and enterprise-level personal development, fostering focus, learning, and well-being.

## User Preferences
I prefer clear, concise explanations and iterative development. Ask before making major architectural changes. Do not make changes to files or folders unless explicitly instructed or if it's a direct result of an approved feature implementation. I value a conversational interaction style, and I prefer that the agent focuses on completing tasks efficiently while keeping me informed of progress and potential roadblocks.

## System Architecture
Tfive features a dual workspace architecture (Professional and Personal) distinguished by color themes and data contexts. The core interaction is through "Tairo," an AI companion powered by OpenAI, offering contextual guidance through phase-specific prompts during 25-minute Pomodoro sessions. These sessions consist of Check-In, Learn, Act, and Earn phases, each with specific durations and visual timer cues.

The platform includes a curated Program Library with diverse categories, and an AI-powered Program Creation Wizard allowing users to generate custom learning programs. Gamification elements like points, leveling, reward systems, and achievement badges are integrated to track and motivate progress. User profiles support avatar customization and display personal stats. An Enterprise Admin Dashboard provides organization and team management, user rosters, and engagement analytics with role-based access control.

The frontend is built with React, TypeScript, Tailwind CSS, Shadcn UI, Wouter for routing, TanStack Query for data fetching, and Framer Motion for animations. The backend uses Express.js, integrates OpenAI, and utilizes a PostgreSQL database with Drizzle ORM (Neon). Zod is used for validation, and a role-based authorization middleware secures admin features. The design system employs Inter, Sora, and JetBrains Mono fonts, with a distinct color palette for brand elements, workspaces, and timer phases, supporting dark mode.

## External Dependencies
- **OpenAI**: Integrated via Replit AI Integrations for the AI companion "Tairo" and AI-powered content generation in the Program Creation Wizard.
- **PostgreSQL**: Used as the primary database, managed with Drizzle ORM and hosted on Neon.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn UI**: Component library for UI elements.
- **Wouter**: React hook-based router.
- **TanStack Query**: For data fetching, caching, and state management.
- **Framer Motion**: For animations and interactive components.