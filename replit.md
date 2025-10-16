# Tfive - 25 Minutes to Personal Growth

## Project Overview

Tfive is an AI-powered personal development platform built around the Pomodoro technique. The name "Tfive" stands for "Twenty-Five" - representing the 25-minute focus sessions that drive meaningful personal growth. The platform combines AI coaching with structured learning through the Learn → Act → Earn framework.

## Core Features

### 1. Dual Workspace Architecture
- **Professional Workspace**: Blue-themed environment for career growth and workplace development
- **Personal Workspace**: Purple-themed private space for personal growth and self-discovery
- Visual distinction through color theming and separate data contexts

### 2. AI Companion "T"
- Personalized AI guidance powered by OpenAI (via Replit AI Integrations)
- Contextual responses based on workspace (professional vs personal)
- Conversational interface for check-ins and support

### 3. 25-Minute Pomodoro Sessions
- **Learn Phase (5 min)**: Absorb knowledge and context
- **Act Phase (15 min)**: Apply learning through practical exercises
- **Earn Phase (5 min)**: Reflection and rewards
- Visual timer with phase-specific colors

### 4. Program Library
- Curated learning programs across categories:
  - Wellbeing: Mindfulness, stress reduction, mental health
  - Recovery: Resilience, emotional strength, healing
  - Inclusion: Active listening, empathy, diversity
  - Focus: Deep work, concentration, productivity
- Filtering by category and difficulty level
- Beautiful program cards with abstract imagery

### 5. Gamification & Progress
- Points and leveling system (1000 points = 1 level)
- Achievement badges for milestones
- Streak tracking for consistency
- Visual progress dashboard

## Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn UI** component library
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Framer Motion** for animations

### Backend
- **Express.js** server
- **OpenAI** integration via Replit AI Integrations
- **In-memory storage** for MVP (MemStorage)
- **Zod** for validation

### Design System
- **Fonts**: Inter (UI), Sora (Display), JetBrains Mono (Timer)
- **Colors**:
  - Professional: Blue (220, 90%, 56%)
  - Personal: Purple (280, 70%, 60%)
  - Timer phases: Blue (Learn), Green (Act), Gold (Earn)
- **Dark mode** support with theme toggle

## Project Structure

```
client/
  src/
    components/          # Reusable UI components
      - WorkspaceSwitcher.tsx
      - PomodoroTimer.tsx
      - ChatInterface.tsx
      - ProgramCard.tsx
      - ProgressDashboard.tsx
      - AchievementCard.tsx
      - app-sidebar.tsx
    contexts/            # React contexts
      - ThemeContext.tsx
      - WorkspaceContext.tsx
    pages/              # Route pages
      - Dashboard.tsx
      - Programs.tsx
      - ChatPage.tsx
      - SessionPage.tsx
      - Achievements.tsx
    lib/                # Utilities
      - programImages.ts

server/
  - routes.ts          # API endpoints
  - storage.ts         # Data storage interface

shared/
  - schema.ts          # Shared TypeScript types

attached_assets/
  generated_images/    # AI-generated program thumbnails
```

## API Endpoints

### User
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update user data

### Programs
- `GET /api/programs?workspace=` - List programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs` - Create program (seeding)

### Sessions
- `POST /api/sessions` - Start session
- `PATCH /api/sessions/:id` - Update session
- `POST /api/sessions/complete` - Complete session and award points

### Stats & Achievements
- `GET /api/stats` - Get user stats (sessions, streak)
- `GET /api/achievements` - List all achievements
- `GET /api/user/achievements` - Get unlocked achievements

### Chat
- `GET /api/chat?workspace=` - Get chat history
- `POST /api/chat` - Send message to AI companion

## Key User Journeys

### 1. Daily Check-in
1. User opens app → Dashboard
2. Switches workspace (Professional/Personal)
3. Chats with T for guidance
4. T recommends a program based on mood/goals

### 2. Complete a Session
1. Browse program library
2. Select program → Session page
3. Start 25-minute Pomodoro timer
4. Progress through Learn → Act → Earn phases
5. Earn points and update progress

### 3. Track Progress
1. View dashboard stats (level, points, streak)
2. Check achievements
3. See completed programs

## Design Principles

1. **Focus-First**: Every UI element supports the 25-minute concentration cycle
2. **Privacy-Conscious**: Clear visual distinction between workspaces
3. **Progress-Visible**: Gamification that feels mature and meaningful
4. **Conversational**: AI companion feels present and helpful

## Development Commands

- `npm run dev` - Start development server (both frontend and backend)
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (managed by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL (managed by Replit)
- `SESSION_SECRET` - Express session secret

## Seed Data

The application initializes with:
- 5 sample programs across all categories
- 5 achievements to unlock
- 1 demo user account

## Future Enhancements

Phase 2 features planned:
- Tfive-Live peer matching for group sessions
- Enterprise admin dashboard
- Calendar integration
- Custom program builder
- Reward marketplace
- SSO/SCIM integration
- Slack, Teams, WhatsApp integration
