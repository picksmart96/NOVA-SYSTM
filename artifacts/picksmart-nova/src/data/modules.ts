export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: number;
  durationMinutes: number;
  category: string;
  isFree: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const MODULES: Module[] = [
  {
    id: "mod-1",
    number: 1,
    title: "Beginner Basics",
    description: "How the job works, equipment overview, voice systems, and what to expect on day one.",
    lessons: 4,
    durationMinutes: 25,
    category: "Foundation",
    isFree: true,
    difficulty: "beginner",
  },
  {
    id: "mod-2",
    number: 2,
    title: "Safety First",
    description: "Proper lifting mechanics, injury prevention, and how to survive physically demanding long shifts.",
    lessons: 5,
    durationMinutes: 35,
    category: "Safety",
    isFree: false,
    difficulty: "beginner",
  },
  {
    id: "mod-3",
    number: 3,
    title: "Pallet Building",
    description: "Stack like Tetris. Heavy on bottom, light on top. Build pallets that stay intact all the way to the store.",
    lessons: 6,
    durationMinutes: 40,
    category: "Skills",
    isFree: false,
    difficulty: "intermediate",
  },
  {
    id: "mod-4",
    number: 4,
    title: "Speed & Efficiency",
    description: "Move faster without rushing. Smart route planning and eliminating wasted steps add up fast.",
    lessons: 5,
    durationMinutes: 38,
    category: "Performance",
    isFree: false,
    difficulty: "intermediate",
  },
  {
    id: "mod-5",
    number: 5,
    title: "Hitting Your Rate",
    description: "Understand the performance system. Go from 70% to 100%+ with proven rate-building strategies.",
    lessons: 7,
    durationMinutes: 52,
    category: "Performance",
    isFree: false,
    difficulty: "advanced",
  },
  {
    id: "mod-6",
    number: 6,
    title: "Real Shift Simulation",
    description: "Full walkthrough of a real shift. Tips to stay focused, manage energy, and crush your first two weeks.",
    lessons: 4,
    durationMinutes: 45,
    category: "Simulation",
    isFree: false,
    difficulty: "advanced",
  },
];
