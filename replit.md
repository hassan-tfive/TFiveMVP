# Tfive - 25 Minutes to Personal Growth

## Project Overview

Tfive is an AI-powered personal development platform built around the Pomodoro technique. The name "Tfive" stands for "Twenty-Five" - representing the 25-minute focus sessions that drive meaningful personal growth. The platform combines AI coaching with structured learning through the Check-In → Learn → Act → Earn framework.

## Core Features

### 1. Dual Workspace Architecture
- **Professional Workspace**: Navy blue-themed environment for career growth and workplace development
- **Personal Workspace**: Purple-themed private space with pink accent for personal growth and self-discovery
- Visual distinction through color theming and separate data contexts

### 2. AI Companion "Tairo"
- Personalized AI guidance powered by OpenAI (via Replit AI Integrations)
- Contextual responses based on workspace (professional vs personal)
- **Phase-Specific Prompts**: Adaptive guidance for each session phase
  - Check-In: Mood assessment and goal setting
  - Learn: Concept exploration and understanding
  - Act: Practice guidance and troubleshooting
  - Earn: Reflection prompts and celebration
- Conversational interface for check-ins and support
- **Animated Character Avatar**: Lifelike character with natural movements
  - Full upper body design (head, neck, torso with clothing details)
  - Breathing animation (4-second subtle movement cycle)
  - Random blinking (eyes close every 2-6 seconds)
  - Talking animation (3-frame mouth movement when speaking)
  - Thinking state (bouncing animation with sparkle effect)
  - Workspace-aware colors (navy/golden for professional, purple/pink for personal)
  - Four sizes: sm (60x80), md (80x100), lg (120x160), xl (200x260)
  - Appears prominently in chat interface (XL in header, MD in messages)

### 3. 25-Minute Pomodoro Sessions
- **Check-In Phase (2 min)**: Mood, focus, and goal tracking
- **Learn Phase (8 min)**: Absorb knowledge and context
- **Act Phase (13 min)**: Apply learning through practical exercises
- **Earn Phase (2 min)**: Reflection and rewards
- Visual timer with phase-specific colors (Pink→Navy→Purple→Golden)
- Automatic phase transitions with event tracking

### 4. Program Library
- Curated learning programs across categories:
  - Wellbeing: Mindfulness, stress reduction, mental health
  - Recovery: Resilience, emotional strength, healing
  - Inclusion: Active listening, empathy, diversity
  - Focus: Deep work, concentration, productivity
- Filtering by category and difficulty level
- Beautiful program cards with abstract imagery

### 5. Gamification & Progress
- **Points and Leveling**: 1000 points = 1 level
- **Reward System**:
  - Session completion: +50 points
  - Reflection submitted: +10 points
  - Streak bonus: +10 points per day (3+ day streaks, max +50)
  - Deep reflection: +20 bonus points (quality score > 70/100)
- Achievement badges for milestones
- Streak tracking for consistency
- Visual progress dashboard
- **Reward Catalog**: Employer and sponsor rewards (redeemable with points)

### 6. User Profile & Avatar
- **Profile Management**: Comprehensive user profile page with avatar and personal info
- **Avatar Support**: Upload avatar via URL with real-time preview
- **Display Name**: Customize display name separate from username
- **User Menu**: Avatar-based dropdown menu in navigation bar
- **Stats Display**: View progress stats (level, points, sessions, streak) on profile
- **Navigation Integration**: Profile accessible via sidebar and user menu

### 7. Enterprise Admin Dashboard
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
  - Primary Brand: Golden (#f4ac24 - 40° 90% 55%)
  - Pink Accent: #ff00c1 (318° 100% 50%)
  - Purple: #5c1cb2 (266° 73% 40%)
  - Navy: #00042d (235° 100% 9%)
  - Professional Workspace: Navy blue
  - Personal Workspace: Purple with pink accent
  - Timer phases: Pink (Check-In), Navy (Learn), Purple (Act), Golden (Earn)
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
      - Profile.tsx
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
- `PATCH /api/user` - Update user data (display name, avatar URL, workspace, points, level)
  - Validates with Zod schema
  - Supports optional fields: displayName, avatarUrl (URL or empty string)

### Programs
- `GET /api/programs?workspace=` - List programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs` - Create program (seeding)

### Sessions
- `POST /api/sessions` - Start session
- `PATCH /api/sessions/:id` - Update session
- `POST /api/sessions/complete` - Complete session and award points (50 base + streak bonuses)
- `GET /api/sessions/:sessionId/events` - Get session events (phase transitions)
- `POST /api/sessions/:sessionId/events` - Create session event

### Reflections
- `GET /api/reflections/:sessionId` - Get reflection for session
- `POST /api/reflections` - Create reflection (awards 10 pts + 20 bonus if score > 70)

### Stats & Achievements
- `GET /api/stats` - Get user stats (sessions, streak)
- `GET /api/achievements` - List all achievements
- `GET /api/user/achievements` - Get unlocked achievements

### Chat
- `GET /api/chat?workspace=` - Get chat history
- `POST /api/chat` - Send message to AI companion (supports phase-specific prompts via `phase` parameter)

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
4. Progress through Check-In → Learn → Act → Earn phases
5. Submit reflection (optional, earns bonus points)
6. Earn points (50 base + streak + reflection bonuses)
7. Update progress and level

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
  - Added: `displayName` (text) - User's display name
  - Added: `avatarUrl` (text) - URL to user's avatar image
- `programs` - Learning programs
- `sessions` - Pomodoro session tracking (4 phases: checkin, learn, act, earn)
- `session_events` - Phase transition tracking with detailed payload data
- `reflections` - Post-session reflections with sentiment scoring (0-100 scale)
- `progress` - User progress through programs
- `achievements` - Achievement definitions
- `user_achievements` - Unlocked achievements per user
- `chat_messages` - Conversation history with AI companion
- `reward_catalog` - Employer and sponsor rewards (redeemable with points)
- `redemptions` - User reward redemption history

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

### Floating Tairo Character (October 18, 2025)
- ✅ Created human-like AI coach character using AI image generation
- ✅ Professional, friendly appearance with warm expression and business casual attire
- ✅ Floating character that moves around chat interface (drifts 0-30px every 3 seconds)
- ✅ Gentle sway animation (6-second cycle with subtle rotation)
- ✅ Breathing glow effect (4-second pulsing)
- ✅ Status indicators: "Thinking..." badge during AI processing, "Speaking" badge when responding
- ✅ Sound wave animation on Speaking badge
- ✅ Non-blocking design (pointer-events: none) - doesn't interfere with chat functionality
- ✅ Workspace-aware theming (navy border for professional, purple for personal)
- ✅ Smooth transitions between positions (3-second ease-in-out)
- ✅ Appears in chat page alongside conversation
- ✅ Improved Tfive logo visibility in personal workspace (80% opacity + brightness boost)

### Minimal Navigation Design (October 17, 2025)
- ✅ Clean, neutral navigation without blue/golden gradient backgrounds
- ✅ Sidebar: Single Tfive logo (h-20/80px) with pink-purple gradient background (logo 02)
- ✅ Top nav: Transparent glass effect (`bg-background/95 backdrop-blur`) with simple border
- ✅ Workspace switcher repositioned to left corner (next to sidebar toggle)
- ✅ Navigation items use default theme colors (active state: `bg-primary text-primary-foreground`)
- ✅ Avatar menu uses theme primary color (removed golden accent border)
- ✅ Proper elevation utilities applied: `hover-elevate` and `active-elevate-2`
- ✅ Dashboard banners: Navy for professional workspace, purple for personal workspace

### User Profile & Avatar (October 17, 2025)
- ✅ Added user profile page with avatar and personal info management
- ✅ Avatar URL upload and display name customization
- ✅ User avatar menu in navigation bar with dropdown
- ✅ Profile accessible via sidebar and user menu
- ✅ Real-time avatar updates across application
- ✅ Zod validation for profile updates

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
