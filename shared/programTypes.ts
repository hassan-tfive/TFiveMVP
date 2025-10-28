// Program Type Framework
// Each 25-minute program has a specific Learn/Act/Earn time allocation

export type ProgramType = 
  | "getting_started"      // 15-5-5: New topics, quick refreshers
  | "deep_learning"        // 18-2-5: Important information to absorb
  | "hands_on_practice"    // 8-12-5: Building real skills through practice
  | "personal_wellbeing"   // 10-10-5: Equal focus on understanding and wellness practice
  | "creative_exploration"; // 7-13-5: Innovation, creativity, discovering possibilities

export interface ProgramTypeConfig {
  label: string;
  description: string;
  durLearn: number; // minutes
  durAct: number;   // minutes
  durEarn: number;  // minutes (always 5)
  bestFor: string;
}

export const PROGRAM_TYPE_CONFIG: Record<ProgramType, ProgramTypeConfig> = {
  getting_started: {
    label: "Getting Started",
    description: "Introduction and quick refreshers",
    durLearn: 15,
    durAct: 5,
    durEarn: 5,
    bestFor: "New topics, quick refreshers",
  },
  deep_learning: {
    label: "Deep Learning",
    description: "Comprehensive information absorption",
    durLearn: 18,
    durAct: 2,
    durEarn: 5,
    bestFor: "Important information you need to know well",
  },
  hands_on_practice: {
    label: "Hands-On Practice",
    description: "Building skills through action",
    durLearn: 8,
    durAct: 12,
    durEarn: 5,
    bestFor: "Building real skills through practice",
  },
  personal_wellbeing: {
    label: "Personal Wellbeing",
    description: "Balanced learning and wellness practice",
    durLearn: 10,
    durAct: 10,
    durEarn: 5,
    bestFor: "Health, wellness, and personal growth",
  },
  creative_exploration: {
    label: "Creative Exploration",
    description: "Innovation and discovery",
    durLearn: 7,
    durAct: 13,
    durEarn: 5,
    bestFor: "Innovation, creativity, discovering possibilities",
  },
};

export function getProgramTypeConfig(type?: string | null): ProgramTypeConfig {
  if (!type || !(type in PROGRAM_TYPE_CONFIG)) {
    return PROGRAM_TYPE_CONFIG.getting_started;
  }
  return PROGRAM_TYPE_CONFIG[type as ProgramType];
}

export function getProgramTypeLabel(type?: string | null): string {
  return getProgramTypeConfig(type).label;
}
