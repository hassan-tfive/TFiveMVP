
# TFIVE — Agentic Specification for Dynamic 25-Minute Program Generation (Tairo Engine)

## 0) Overview
Define the AI logic for how **Tairo**, TFIVE’s AI companion, dynamically creates personalized 25-minute (or shorter) development programs based on user intent.

Each program:
- Is unique to the user’s emotional state or goal.
- Adapts durations across Learn, Act, and Earn.
- Always totals ≤ 25 minutes.
- Is saved and trackable.

---

## 1) Adaptive Timing
Tairo assigns different time weights to Learn, Act, and Earn phases depending on intent and topic intensity.

| Domain | Learn | Act | Earn |
|---------|--------|------|------|
| Focus/Productivity | 6 | 15 | 4 |
| Leadership | 12 | 9 | 4 |
| Recovery | 14 | 7 | 4 |
| Stress | 8 | 12 | 5 |
| Inclusion/Empathy | 10 | 10 | 5 |

---

## 2) Workflow
1. **User Prompt → Intent Parsing**  
   Extract `goal`, `tone`, and `domain`.
2. **Dynamic Duration Allocation**  
   Distribute 25 minutes proportionally.
3. **Phase Generation**  
   Produce text content for Learn, Act, and Earn.
4. **Validation**  
   Ensure total time ≤ 25 minutes.
5. **Storage**  
   Persist as JSON in `programs` table.

---

## 3) AI Output JSON
```json
{
  "title": "Calm Focus Reset",
  "domain": "resilience",
  "goal": "Regain calm after stressful calls",
  "structure": {
    "learn": { "duration_min": 7, "content": "..." },
    "act": { "duration_min": 13, "content": "..." },
    "earn": { "duration_min": 5, "content": "..." }
  },
  "followup_suggestion": "Try 'Recenter in 5' next."
}
```

---

## 4) Backend Requirements
### Endpoint
`POST /programs/generate`
- Request: `{ "prompt": "help me relax before a meeting", "space": "work" }`
- Response: Program JSON above

### DB Schema
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  user_id UUID,
  space TEXT,
  title TEXT,
  domain TEXT,
  goal TEXT,
  learn_text TEXT,
  act_text TEXT,
  earn_text TEXT,
  duration_learn INT,
  duration_act INT,
  duration_earn INT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

---

## 5) System Prompt for Tairo
```
You are Tairo, TFIVE’s AI companion.
Generate a personalized 25-minute (or shorter) Learn–Act–Earn program.

Steps:
1. Understand the user’s request.
2. Identify topic domain.
3. Dynamically assign durations (total ≤ 25).
4. Write content for each phase.
Output structured JSON only.
```

---

## 6) Frontend (Next.js)
| Route | Function |
|--------|-----------|
| `/create` | Prompt input |
| `/session` | Timer-driven Learn → Act → Earn |
| `/summary` | Reflection + rewards |
| `/complete` | Program recap |

UI: Gradient ring (magenta→gold), animated Tairo avatar, pause/resume controls.

---

## 7) Rewards
- +50 points for completion  
- +10 for reflection entry  

---

## 8) Agentic Build JSON for Replit
```json
{
  "project": "TFIVE-Program-Generator",
  "modules": [
    {
      "name": "tairo-engine",
      "stack": "LangChain + OpenAI",
      "tasks": [
        "Intent classification",
        "Dynamic duration allocation",
        "Phase content generation",
        "JSON validation"
      ]
    },
    {
      "name": "api-backend",
      "stack": "FastAPI + Postgres",
      "tasks": [
        "Expose /programs/generate",
        "Save generated sessions",
        "Reward and reflection endpoints"
      ]
    },
    {
      "name": "frontend-session",
      "stack": "Next.js + Tailwind",
      "tasks": [
        "Timer-based UI",
        "Display Tairo dialogue",
        "Dynamic duration rendering"
      ]
    }
  ]
}
```

---

## 9) Summary
Tairo intelligently builds 25-minute programs tailored to the user’s topic and emotion.  
This spec enables Replit to generate:
- AI backend (LangChain + FastAPI)  
- Database persistence  
- Session runner UI  
