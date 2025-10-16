# Tfive - 25 Minutes to Personal Growth

## Project Overview

Tfive is an AI-powered personal development platform built around the Pomodoro technique. The name "Tfive" stands for "Twenty-Five" - representing the 25-minute focus sessions that drive meaningful personal growth. The platform combines AI coaching with structured learning through the Learn → Act → Earn framework.

## Core Features

### 1. Dual Workspace Architecture
- **Professional Workspace**: Blue-themed environment for career growth and workplace development
- **Personal Workspace**: Purple-themed private space for personal growth and self-discovery
- Visual distinction through color theming and separate data contexts

### 2. AI Companion "Tairo"
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

### 6. Enterprise Admin Dashboard
- **Organization Management**: Create and manage organizations
- **Team Management**: Create teams, assign users, track team performance
- **User Roster**: View all organization members with team assignments
- **Engagement Analytics**: Track active users, session completion rates, popular programs
- **Wellbeing Insights**: Monitor average user levels, streaks, and identify at-risk users
- **Role-Based Access**: Admin-only features protected with authorization middleware
- **Security**: All admin endpoints require authentication and validate inputs with Zod schemas

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
- **PostgreSQL** database with Drizzle ORM (using Neon)
- **In-memory storage** fallback (MemStorage) for development
- **Zod** for validation and input sanitization
- **Role-based authorization** middleware for admin features

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
      - AdminDashboard.tsx
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

### Admin (Protected with requireAdmin middleware)
- `GET /api/admin/organizations` - List all organizations
- `POST /api/admin/organizations` - Create organization (validated)
- `GET /api/admin/organizations/:id/teams` - Get teams for organization
- `POST /api/admin/teams` - Create team (validated)
- `PATCH /api/admin/teams/:id` - Update team (validated, prevents organizationId changes)
- `GET /api/admin/organizations/:id/users` - Get users for organization
- `GET /api/admin/teams/:id/users` - Get users for team
- `GET /api/admin/analytics/engagement` - Get engagement metrics
- `GET /api/admin/analytics/wellbeing` - Get wellbeing metrics

## Key User Journeys

### 1. Daily Check-in
1. User opens app → Dashboard
2. Switches workspace (Professional/Personal)
3. Chats with Tairo for guidance
4. Tairo recommends a program based on mood/goals

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
- 1 demo organization ("Demo Corp")
- 3 teams (Engineering, Product, Design)
- 1 demo admin user
- 5 sample programs across all categories
- 5 achievements to unlock

## Database Schema

The application uses PostgreSQL with the following main tables:
- `organizations` - Multi-tenant organization management
- `teams` - Team groupings within organizations
- `users` - User accounts with role (user/admin), organization, and team assignments
- `programs` - Learning programs
- `sessions` - Pomodoro session tracking
- `progress` - User progress through programs
- `achievements` - Achievement definitions
- `user_achievements` - Unlocked achievements per user
- `chat_messages` - Conversation history with AI companion

## Security

### Authorization
- Admin endpoints protected with `requireAdmin` middleware
- Middleware checks user role before allowing access to admin features
- Returns 403 Forbidden for non-admin users

### Input Validation
- All admin POST/PATCH endpoints validate with Zod schemas
- Request bodies parsed before database operations
- Returns 400 Bad Request with validation errors

### Data Integrity
- Organizations cannot be changed on team updates
- Foreign key constraints maintain referential integrity
- UUID primary keys prevent enumeration attacks

## Recent Changes (October 2025)

### Enterprise Features Implemented
- ✅ Migrated from in-memory to PostgreSQL database
- ✅ Multi-tenant organization and team management
- ✅ Role-based access control (admin/user roles)
- ✅ Enterprise admin dashboard with analytics
- ✅ Engagement and wellbeing metrics
- ✅ Security: Authorization middleware and input validation

## Future Enhancements

Phase 2 features planned:
- Tfive-Live peer matching for group sessions
- Calendar integration
- Custom program builder
- Reward marketplace
- SSO/SCIM integration
- Slack, Teams, WhatsApp integration
- Multi-user authentication (currently uses DEFAULT_USER_ID)
- Team lead role with limited admin permissions
