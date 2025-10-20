import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Types for AI workflow outputs
export interface IntentParseOutput {
  topic: string;
  emotion: string;
  scope_hint: "short_term" | "mid_term" | "long_term";
  space: "personal" | "work";
  confidence: number;
}

export interface WizardQuestion {
  id: string;
  type: "choice" | "text";
  prompt: string;
  options?: string[];
}

export interface WizardOutput {
  questions: WizardQuestion[];
}

export interface LoopOutput {
  title: string;
  durations: {
    learn: number;
    act: number;
    earn: number;
  };
  learn: string;
  act: string;
  earn: string;
}

export interface ProgramOutput {
  program: {
    space: string;
    type: string;
    title: string;
    topic: string;
    tone?: string;
    duration_weeks?: number;
    metadata?: any;
  };
  next_loop: LoopOutput;
}

/**
 * Intent Parser: Classifies user text into topic, emotion, scope_hint
 */
export async function parseIntent(text: string, space: "personal" | "work"): Promise<IntentParseOutput> {
  const systemPrompt = `You are an intent classifier for a personal development platform. Classify user text into:
- topic: one of [focus, confidence, recovery, leadership, inclusion, creativity, motivation]
- emotion: one of [anxious, stressed, calm, excited, frustrated, motivated, tired, neutral]
- scope_hint: one of [short_term, mid_term, long_term]
- confidence: float 0.0-1.0 indicating classification confidence

Respond ONLY with valid JSON matching this exact structure:
{
  "topic": "...",
  "emotion": "...",
  "scope_hint": "...",
  "space": "personal",
  "confidence": 0.85
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      space,
    };
  } catch (error) {
    console.error("Failed to parse intent response:", content);
    throw new Error("AI returned malformed response");
  }
}

/**
 * Wizard Brain: Asks clarifying questions based on context and confidence
 */
export async function getWizardQuestions(
  context: IntentParseOutput,
  previousAnswers?: Record<string, any>
): Promise<WizardQuestion[] | null> {
  // If confidence is high enough, skip wizard
  if (context.confidence >= 0.8 && !previousAnswers) {
    return null;
  }

  const systemPrompt = `You are a wizard that asks clarifying questions to build personalized growth programs.
Given the current context and confidence level, ask up to 3 concise questions to clarify:
- Program scope/duration (one_off, short_series, mid_series, long_series)
- Tone preference (calm, energizing, instructional, reflective)
- Cadence (how often per week)

Stop asking when you have enough information (confidence >= 0.8).

Respond ONLY with valid JSON:
{
  "questions": [
    {"id": "scope", "type": "choice", "prompt": "Quick reset or longer journey?", "options": ["one_off", "short_series", "mid_series", "long_series"]},
    {"id": "tone", "type": "choice", "prompt": "What tone fits best?", "options": ["calm", "energizing", "instructional", "reflective"]}
  ]
}

If no questions needed, respond: {"questions": []}`;

  const contextStr = JSON.stringify({ context, previousAnswers });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextStr },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{"questions": []}';
  
  try {
    const parsed: WizardOutput = JSON.parse(content);
    return parsed.questions.length > 0 ? parsed.questions : null;
  } catch (error) {
    console.error("Failed to parse wizard response:", content);
    throw new Error("AI returned malformed response");
  }
}

/**
 * Loop Composer: Creates a 25-minute Loop with Learn, Act, Earn phases
 */
export async function composeLoop(
  topic: string,
  tone: string,
  loopIndex: number = 1,
  seriesContext?: string
): Promise<LoopOutput> {
  // Duration allocation by topic (must sum to 25)
  const durationMap: Record<string, { learn: number; act: number; earn: number }> = {
    focus: { learn: 6, act: 15, earn: 4 },
    leadership: { learn: 12, act: 9, earn: 4 },
    recovery: { learn: 14, act: 7, earn: 4 },
    stress: { learn: 8, act: 13, earn: 4 },
    inclusion: { learn: 9, act: 12, earn: 4 },
    confidence: { learn: 8, act: 13, earn: 4 },
    creativity: { learn: 7, act: 14, earn: 4 },
    motivation: { learn: 8, act: 13, earn: 4 },
  };

  const durations = durationMap[topic] || { learn: 8, act: 13, earn: 4 };

  const systemPrompt = `You are a loop composer creating 25-minute growth sessions.
Create a Loop with these phases:
- Learn (${durations.learn} min): Brief insight, fact, or principle
- Act (${durations.act} min): Specific, actionable task
- Earn (${durations.earn} min): Reflection prompt and encouragement

The content should match the topic "${topic}" and tone "${tone}".
Loop index: ${loopIndex}${seriesContext ? `. Series context: ${seriesContext}` : ""}

Respond ONLY with valid JSON:
{
  "title": "Concise loop title",
  "durations": {"learn": ${durations.learn}, "act": ${durations.act}, "earn": ${durations.earn}},
  "learn": "Brief learning content (2-3 sentences)",
  "act": "Specific action to take (1-2 sentences)",
  "earn": "Reflection prompt and encouragement (1-2 sentences)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create loop #${loopIndex} for ${topic} with ${tone} tone` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse loop response:", content);
    throw new Error("AI returned malformed response");
  }
}

/**
 * Series Builder: Creates a program plan with arcs/journeys
 */
export async function buildSeries(inputs: {
  topic: string;
  tone: string;
  series_type: "one_off" | "short_series" | "mid_series" | "long_series";
  cadence_per_week?: number;
  duration_weeks?: number;
  space: "personal" | "work";
}): Promise<ProgramOutput> {
  // Determine default duration by series type
  const durationDefaults: Record<string, number> = {
    one_off: 0,
    short_series: 3,
    mid_series: 8,
    long_series: 24,
  };

  const duration_weeks = inputs.duration_weeks || durationDefaults[inputs.series_type];
  const cadence = inputs.cadence_per_week || 3;
  
  const total_loops = inputs.series_type === "one_off" ? 1 : duration_weeks * cadence;

  const systemPrompt = `You are a program builder creating personalized growth journeys.
Create a program with:
- Type: ${inputs.series_type}
- Total loops: ${total_loops}
- Topic: ${inputs.topic}
- Tone: ${inputs.tone}
- Duration: ${duration_weeks} weeks

For long_series (16+ loops), create arcs (groups of loops with themes).
For mid_series, you may optionally create 2-3 arcs.

Respond ONLY with valid JSON:
{
  "program": {
    "space": "${inputs.space}",
    "type": "${inputs.series_type}",
    "title": "Compelling program title",
    "topic": "${inputs.topic}",
    "tone": "${inputs.tone}",
    "duration_weeks": ${duration_weeks},
    "metadata": {
      "journey": {
        "arcs": [
          {"title": "Arc 1 Theme", "loops": 5},
          {"title": "Arc 2 Theme", "loops": 5}
        ]
      }
    }
  },
  "next_loop": {
    "title": "First loop title",
    "durations": {"learn": 8, "act": 13, "earn": 4},
    "learn": "Learning content",
    "act": "Action to take",
    "earn": "Reflection and encouragement"
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(inputs) },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse series response:", content);
    throw new Error("AI returned malformed response");
  }
}

/**
 * Generate audio narration using OpenAI Text-to-Speech
 */
export async function generateAudioNarration(
  text: string,
  phase: "learn" | "act" | "earn",
  tone: string = "calm"
): Promise<string | null> {
  try {
    // Select voice based on tone
    const voiceMap: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
      calm: "nova",
      energizing: "echo",
      instructional: "alloy",
      reflective: "shimmer",
    };
    const voice = voiceMap[tone] || "nova";

    console.log(`[TTS] Generating audio for ${phase} phase with ${voice} voice`);

    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      speed: 1.0,
    });

    // Create audio directory if it doesn't exist
    const audioDir = path.join(process.cwd(), "attached_assets", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${phase}_${voice}_${timestamp}_${randomId}.mp3`;
    const filepath = path.join(audioDir, filename);

    // Convert response to buffer and save
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    console.log(`[TTS] Audio saved to ${filepath}`);

    // Return relative URL path
    return `/attached_assets/audio/${filename}`;
  } catch (error: any) {
    console.error(`[TTS] Failed to generate audio:`, error?.message || error);
    return null;
  }
}

/**
 * Get curated video URL based on topic
 */
export function getCuratedVideoUrl(topic: string): string | null {
  // Curated YouTube/Vimeo videos for each topic (embedded, royalty-free content)
  const videoMap: Record<string, string> = {
    focus: "https://www.youtube.com/watch?v=5qap5aO4i9A", // Calm focus music/nature
    leadership: "https://www.youtube.com/watch?v=8CrOL-ydFMI", // Leadership principles
    recovery: "https://www.youtube.com/watch?v=inpok4MKVLM", // Peaceful recovery/meditation
    stress: "https://www.youtube.com/watch?v=inpok4MKVLM", // Stress relief meditation
    inclusion: "https://www.youtube.com/watch?v=kBdfcR-8hEY", // Inclusion and diversity
    confidence: "https://www.youtube.com/watch?v=w-HYZv6HzAs", // Confidence building
    creativity: "https://www.youtube.com/watch?v=arj7oStGLkU", // Creative inspiration
    motivation: "https://www.youtube.com/watch?v=ZXsQAXx_ao0", // Motivational content
  };

  return videoMap[topic.toLowerCase()] || videoMap["focus"];
}
