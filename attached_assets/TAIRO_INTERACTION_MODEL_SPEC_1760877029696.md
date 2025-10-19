
# TFIVE — Tairo Interaction Model (Personal + Pro) — Agentic Build Spec for Replit

## 0) Purpose
Define how users *talk to Tairo* and how Tairo *builds programs automatically* using:
- Free-text intent → semantic parsing
- Adaptive wizard (follow-up questions)
- Fixed 25-minute session unit (“Loop”)
- Scalable series types: One-Off, Short, Mid, Long (Arcs/Journeys)
- Dual-space privacy (Personal vs Work with Tairo Pro)

This spec is designed so Replit agents can scaffold backend, AI workflows, and UI.

---

## 1) Core Concepts
- **Loop (25 min):** Always Learn → Act → Earn → Reflect. Tairo adjusts phase durations but total is 25 minutes.
- **Series Types:**  
  - `one_off` (1 loop)  
  - `short_series` (3–5 loops)  
  - `mid_series` (6–15 loops)  
  - `long_series` (16–30+ loops), grouped into **Arcs** and **Journeys** (up to 6+ months).
- **Spaces:** `personal` (Tairo) vs `work` (Tairo Pro). Data never crosses.
- **Goal:** “You speak. Tairo builds.” Minimal UI friction, maximum personalization.

---

## 2) User Flow (Personal Space — Tairo)
1) **Free Expression** (text/voice): user describes need.
2) **Intent Parse:** topic, tone, urgency, likely duration scope.
3) **Adaptive Wizard:** 1–4 clarifying questions only if needed.
4) **Program Build:** Tairo proposes One-Off or a Series (Short/Mid/Long).
5) **Loop Delivery:** render 25-minute session immediately.
6) **Evolution:** after N loops, Tairo adapts next Loops, Arcs, or whole Journey.

### Example Conversation
- User: “I’m exhausted and can’t focus.”  
- Tairo: “Is this work-related or personal?” → “Personal.”  
- Tairo: “Quick reset or multi-week support?” → “6 weeks.”  
- Tairo: “Calm or energetic tone?” → “Calm.”  
- → Tairo builds a 6-week Short/Mid series (25-min loops) and starts Loop #1 now.

---

## 3) User Flow (Work Space — Tairo Pro)
1) **Requester:** HR/Manager provides goal in natural language.  
2) **Adaptive Wizard:** asks about audience, objectives, cadence, compliance notes.  
3) **Program Build:** series spec (e.g., 4 weeks × 3 loops/week), tailored to role/skills.  
4) **Assign:** push to target cohorts (via SSO/SCIM roster).  
5) **Analytics:** aggregated, anonymized team metrics and ROI cards.

### Example
- HR: “We need a 4-week resilience program for frontline support.”  
- Pro: asks audience size, time windows, tone, outcomes → builds → assigns.

---

## 4) AI Pipeline (Shared)
**Stages:** `ingest → interpret → clarify → compose → validate → persist → deliver`

- **Ingest:** capture text/voice, transcript.  
- **Interpret:** classify (`topic`, `emotion`, `scope_hint`).  
- **Clarify (Wizard):** top-3 info gaps, ask only if confidence < threshold.  
- **Compose:** create program JSON (series + first Loop), respecting 25-min total.  
- **Validate:** schema + totals + space policy.  
- **Persist:** save Program, Series map, and Loop plan.  
- **Deliver:** start first Loop immediately.

---

## 5) Data Model (ERD textual)
- `user(id, email, locale, created_at)`
- `identity(id, user_id, space enum['personal','work'], tfive_id, consent_flags)`
- `program(id, owner_space, type enum['one_off','short_series','mid_series','long_series'], title, topic, tone, duration_weeks, journey_id?, arc_index?, metadata jsonb, created_at)`
- `loop(id, program_id, index, title, phase_learn_text, phase_act_text, phase_earn_text, dur_learn, dur_act, dur_earn, created_at)`
- `session(id, loop_id, user_id, started_at, completed_at, status)`
- `reflection(id, session_id, content, sentiment_score, created_at)`
- `analytics_event(id, org_id?, space, name, props jsonb, ts)`

**Privacy rule:** space=`work` rows never join with space=`personal`; analytics for work are aggregated (no PII).

---

## 6) Program JSON (Series + Loop)
```json
{
  "program": {
    "id": "prog_abc",
    "space": "personal",
    "type": "mid_series",
    "title": "Rebuild Focus in 6 Weeks",
    "topic": "focus",
    "tone": "calm",
    "duration_weeks": 6,
    "journey": {
      "arcs": [
        {"title": "Stabilize", "loops": 5},
        {"title": "Refocus", "loops": 5},
        {"title": "Strengthen", "loops": 5}
      ]
    }
  },
  "next_loop": {
    "index": 1,
    "title": "Calm Attention",
    "durations": {"learn": 6, "act": 15, "earn": 4},
    "learn": "Two attention myths and the one-tab rule.",
    "act": "Single-task for 10–12 minutes on one chosen item, then note obstacles.",
    "earn": "Summarize one win; streak + points awarded."
  }
}
```

---

## 7) Intent & Wizard Outputs
### 7.1 Intent Parse Output
```json
{
  "topic": "confidence",
  "emotion": "anxious",
  "scope_hint": "mid_term",
  "space": "personal",
  "confidence": 0.81
}
```

### 7.2 Wizard Question Schema
```json
{
  "questions": [
    {"id":"scope","type":"choice","prompt":"Quick reset or longer journey?","options":["one_off","short_series","mid_series","long_series"]},
    {"id":"tone","type":"choice","prompt":"What tone fits best?","options":["calm","energizing","instructional","reflective"]},
    {"id":"cadence","type":"choice","prompt":"How often per week?","options":["2","3","5","daily"]}
  ]
}
```

### 7.3 Wizard Answer Merge
```json
{
  "topic": "confidence",
  "tone": "reflective",
  "series_type": "mid_series",
  "cadence_per_week": 3,
  "duration_weeks": 8
}
```

---

## 8) Loop Composer (25-Minute Enforcement)
- Compute phase weights by topic/tone (sum = 25).
- Examples:
  - Focus/Productivity → L:6 A:15 E:4
  - Leadership → L:12 A:9 E:4
  - Recovery/Stress → L:8 A:12 E:5
- Validate: `dur_learn + dur_act + dur_earn == 25`.

**Loop Output**
```json
{
  "title": "Speak with Presence",
  "durations": {"learn": 7, "act": 14, "earn": 4},
  "learn": "Breathing + posture cues reduce vocal tension.",
  "act": "Record a 60s practice intro. Note 1 thing to improve.",
  "earn": "You showed up. Points + streak updated."
}
```

---

## 9) API (FastAPI Sketch)
```yaml
POST /intent/parse
  body: { text, space }
  returns: { topic, emotion, scope_hint, confidence }

POST /wizard/next
  body: { context, previous_answers }
  returns: { question or null }

POST /programs/generate
  body: { space, inputs: { topic, tone, series_type, cadence_per_week, duration_weeks } }
  returns: { program, next_loop }

POST /sessions/start
  body: { loop_id }
  returns: { session_id }

POST /sessions/{id}/complete
  body: { reflection? }
  returns: { points_awarded, summary }
```

---

## 10) Tairo System Prompts (Condensed)
**Intent Parser (classifier):**
```
Classify user text into {topic, emotion, scope_hint}. Be concise. Topics: focus, confidence, recovery, leadership, inclusion, creativity, motivation. Scope hints: short_term, mid_term, long_term.
```

**Wizard Brain:**
```
Given current context and confidence, ask up to 3 concise questions to clarify scope, tone, and cadence. Stop asking when confidence >= 0.8.
```

**Composer:**
```
Create a 25-minute Loop with Learn, Act, Earn. Pick durations based on topic+tone. Output JSON with durations summing to 25 and short, actionable text for each phase.
```

**Series Builder (Arcs/Journeys):**
```
Given topic, tone, cadence, and duration_weeks, build a program plan {type, total_loops, optional arcs}. Provide a compelling title and a next_loop plan.
```

---

## 11) UI (Next.js Routes)
- `/tairo` — free-text input + “Start a Loop” CTA
- `/tairo/wizard` — progressive small Q&A (max 3)
- `/session` — 25-min runner (phase timer, content panes)
- `/summary` — reflection, points, streak
- `/program` — series progress (loops done, next up)
- `/switch` — toggle Personal ↔ Work (distinct themes)

**Style:** Dark professional or warm personal themes; gradient accents. Keep text minimal and actionable.

---

## 12) Privacy & Compliance
- Separate DB schemas for `personal` and `work`.
- Work analytics are aggregated, thresholds ≥ 7 users.
- No personal reflections exposed in Work analytics.
- Audit logs for all access; GDPR-compliant exports.

---

## 13) Acceptance Criteria
- Users can create a program from free text in ≤ 60s.
- No more than 3 wizard questions if confidence < 0.8.
- A Loop is always 25 minutes total; sessions complete with points and summary.
- Series (Short/Mid/Long) can be generated and tracked.
- Space separation enforced; analytics anonymized in Work.

---

## 14) Seed Data
- Topics: focus, resilience, confidence, leadership, inclusion, recovery.
- Tones: calm, energizing, instructional, reflective.
- Example programs: “Focus Reset (Short)”, “Resilience Path (Mid)”, “Lead with Empathy (Work, Short)”.

---

## 15) Handoff Notes
- Use LangChain tool wrappers for the four brains: classify, wizard, compose, series_builder.
- Store prompts in versioned files; log model + prompt version per program.
- Feature flags: `wizard_enabled`, `journeys_enabled`, `work_analytics_v1`.

---

**End of Spec**
