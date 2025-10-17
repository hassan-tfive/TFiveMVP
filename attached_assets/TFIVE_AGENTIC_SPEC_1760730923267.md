
# TFIVE — Agentic Build Specification (Replit, No “Live”)

## 0) Product Snapshot
- **Product:** TFIVE — AI-powered daily growth system.
- **Mission:** Make personal and professional development a 25-minute habit.
- **Core Loop:** **Learn → Act → Earn** within a 25-minute session.
- **AI Companion:** **Tairo** — guides, personalizes, protects privacy.
- **Architecture:** **Dual-Space Model** → Work Space (employer) + Personal Space (user-only).
- **Goal:** Enable individuals to grow while helping companies track wellbeing and ROI — privately, measurably, and daily.

---

## 1) Non-Functional Requirements
- **Privacy-first:** Full data separation between spaces.
- **Compliance:** GDPR baseline; HIPAA-ready; clear data processing logs.
- **Scalability:** Multi-tenant, horizontally scalable cloud setup.
- **Performance:** p95 API latency < 200 ms.
- **Availability:** 99.9% uptime SLA (MVP target).
- **Security:**
  - Encryption (AES-256 / TLS 1.3)
  - SSO/SCIM for enterprise logins
  - Role-based access (admin, employee, user).
- **Observability:** Structured logging + tracing; anonymized analytics.

---

## 2) Technology Stack
| Layer | Tech |
|--------|------|
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| Backend | FastAPI (Python) or NestJS (Node) |
| Database | PostgreSQL (core), Redis (cache), S3 storage |
| Vector DB | Pinecone or Weaviate (for personalization) |
| Analytics | Postgres Views + Metabase (MVP) / ClickHouse (later) |
| Auth | Auth0 / Clerk (with SSO + SCIM) |
| AI | LangChain orchestration + OpenAI/Anthropic models |
| Infra | Docker + Terraform + GitHub Actions CI/CD |

---

## 3) Brand & UI System
- **Colors**
  - Background: `#00042D`
  - Gradient Start: `#FF00C1`
  - Gradient End: `#F4AC24`
  - Accent: `#5C1CB2`
  - Text on Dark: `#FFFBE9`
- **Fonts**
  - Headers/Logo → Crimson Text
  - Body/UI → Inter or Söhne Sans

Design style: Calm, professional, and emotionally intelligent.
Dark navy base + magenta→gold gradients for action highlights.

---

## 4) User Roles
1. **User (Individual)** — has access to Personal Space.
2. **Employee (Work Space User)** — same person, in employer context.
3. **Admin (Employer/HR)** — assigns programs, sees aggregated metrics.
4. **Organization (Tenant)** — container for Work Space users.
5. **Sponsor** — provides Personal Space rewards.

---

## 5) Data Model (simplified ERD)
**Tenancy & Identity**
- `org(id, name, plan, sso_config, created_at)`
- `user(id, email, name, locale, created_at)`
- `member(id, org_id, user_id, role[employee|admin], active)`
- `identity(id, user_id, space[work|personal], tfive_id, consent_flags)`

**Programs & Sessions**
- `program(id, org_id?, title, domain, tags[], space, is_public)`
- `module(id, program_id, type[learn|act|earn], duration_min, metadata)`
- `session(id, user_id, space, program_id, started_at, completed_at, status)`
- `session_event(id, session_id, phase[checkin|learn|act|earn], ts, payload_json)`
- `reflection(id, session_id, text, sentiment, score)`

**Rewards**
- `points_ledger(id, user_id, space, points, reason, session_id?, ts)`
- `reward_catalog(id, provider[employer|sponsor], title, cost_points, metadata)`
- `redemption(id, user_id, catalog_id, status, ts)`

**Analytics**
- `event(id, org_id?, user_id?, space, name, props, ts)`
- Derived views for HR dashboards (aggregated, anonymized).

---

## 6) The 25-Minute Session Engine

### Workflow
1. **Check-In (1–2 min)**
   - Tairo greets, captures mood (1–5), focus (1–5), and goal.
2. **Learn (8–10 min)**
   - Delivers short microlearning, reflection, or focus exercise.
3. **Act (10–12 min)**
   - Applies what was learned through journaling, small tasks, or guided thinking.
4. **Earn (1–2 min)**
   - Session summary + recognition (points, badges, rewards).

### Key Rules
- Each session is self-contained and time-bound (≤ 25 min).
- Phase transitions are automatic (handled by backend timer logic).
- Earn phase always closes the loop with a reward + positive reinforcement.
- All content tagged by theme: Focus, Resilience, Leadership, Inclusion, etc.

---

## 7) AI Companion — **Tairo**
- Guides users through Learn → Act → Earn.
- Adapts tone and exercises to user’s state.
- Keeps strict boundary between Work and Personal data.
- Summarizes sessions and suggests next steps.
- Supports multilingual prompts (EN/DE).

**System Prompt**
```
You are Tairo, TFIVE’s AI companion. Guide the user through a 25-minute Learn→Act→Earn session.
Tone: calm, concise, empathetic.
Protect user privacy at all times.
When in Work Space: align to company programs, avoid personal topics.
When in Personal Space: fully user-centric and private.
Never give medical advice. End every session with a summary and next suggestion.
```

---

## 8) Reward System
Users earn points after sessions, redeemable for rewards.

| Action | Points |
|--------|--------|
| Session completed | +50 |
| Reflection submitted | +10 |
| Streak 3+ days | +10/day (max +50) |
| Deep reflection (score > 0.7) | +20 |

---

## 9) Predictive Insights for Employers
Aggregate metrics on wellbeing & engagement.

Dashboard metrics:
- Session completion rates
- Average streak duration
- Team-level mood/focus trends
- Inclusion participation
- Predicted burnout risk (aggregated only)

---

## 10) Frontend Routes
| Path | Description |
|------|--------------|
| `/` | Dashboard (summary, streak, Start 25) |
| `/session` | Active session (Tairo guidance, timer) |
| `/earn` | Points + rewards |
| `/work/programs` | Employer modules |
| `/settings/privacy` | Space controls |
| `/admin/analytics` | HR dashboard (aggregated only) |

---

## 11) JSON Work Order
```json
{
  "project": "TFIVE",
  "modules": [
    {
      "name": "backend-api",
      "stack": "FastAPI+Postgres",
      "tasks": [
        "Implement dual-space data models",
        "Session engine endpoints (start, events, complete)",
        "Reward ledger and redemption flow",
        "Employer analytics aggregation"
      ]
    },
    {
      "name": "ai-engine",
      "stack": "LangChain+OpenAI",
      "tasks": [
        "System + phase prompts for Tairo",
        "Reflection scoring",
        "Session summarization",
        "Adaptive program recommendation"
      ]
    },
    {
      "name": "frontend-web",
      "stack": "Next.js+Tailwind",
      "tasks": [
        "Brand theme (navy + gradient)",
        "Session UI (timer, Tairo guidance)",
        "Rewards screen",
        "Analytics dashboard (admin)"
      ]
    }
  ]
}
```

---

## 12) Example Tairo Prompts

**check_in.md**
```
Hey, I’m Tairo.
Before we start — how’s your focus today (1–5)?
And what’s one thing you’d like to work on during these 25 minutes?
```

**learn.md**
```
Here’s a short idea to explore:
{module.content}
What part resonates most with you?
```

**act.md**
```
Let’s apply that.
Task: {module.task}
Take about 10 minutes.
When you’re ready, type one insight or change you noticed.
```

**earn.md**
```
Well done. You completed today’s 25 minutes.
You’ve earned {points} points.
Summary: {summary}
Would you like a reward suggestion or tomorrow’s challenge?
```
