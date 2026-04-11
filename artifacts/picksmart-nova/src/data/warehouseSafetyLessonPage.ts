export const warehouseSafetyLessonPage = {
  id: "module-2-lesson-1",
  moduleId: "module-2",
  title: "Warehouse Safety Fundamentals",
  level: "Beginner",
  duration: "35 min",
  steps: 5,
  voiceEnabled: true,

  hero: {
    heading: "Warehouse Safety Fundamentals",
    subheading:
      "Learn the safety habits that protect your body, your equipment, and your performance every shift.",
  },

  introVoice:
    "Welcome to Warehouse Safety Fundamentals. In this lesson, you will learn how strong selectors protect themselves, move safely, and build habits that prevent injuries and costly mistakes.",

  sections: [
    {
      id: "safety-matters",
      title: "1. Why Safety Matters Every Shift",
      body: [
        "Safety is not separate from performance. It is part of performance.",
        "A selector who lifts badly, turns too hard, rushes corners, or ignores safe movement will eventually lose rate, confidence, and control.",
        "Strong safety habits protect your body and help you stay consistent over time.",
      ],
      novaVoice:
        "Safety is not extra. Safety is part of strong performance. Safe selectors work longer, build better, and move with more control.",
    },
    {
      id: "body-mechanics",
      title: "2. Safe Body Mechanics",
      body: [
        "Your body is one of your most important tools in the warehouse.",
        "Use your legs when lifting. Keep loads close to your body. Avoid twisting while carrying weight.",
        "Reset your feet before heavy movement instead of turning your back under pressure.",
      ],
      novaVoice:
        "Lift with control. Keep weight close. Do not twist under load. Reset your feet and stay balanced.",
      bullets: [
        "Bend with your legs, not your back.",
        "Keep heavy cases close to your center.",
        "Avoid rushed twisting and reaching.",
        "Stay balanced before lifting and placing.",
      ],
    },
    {
      id: "jack-awareness",
      title: "3. Equipment and Pallet Jack Awareness",
      body: [
        "Pallet jack control is a major safety skill. Poor handling can injure you, damage product, and slow down the shift.",
        "Before movement, know your direction, your space, your speed, and the stability of your load.",
        "Always slow down before turns, avoid hard stops, and protect the pallet from sudden force.",
      ],
      novaVoice:
        "Control the jack before the jack controls you. Slow down before turns. Avoid sudden stops. Keep the load stable.",
      bullets: [
        "Check your path before moving.",
        "Slow down before turning.",
        "Do not jerk the pallet.",
        "Keep movement smooth and controlled.",
      ],
    },
    {
      id: "hazard-awareness",
      title: "4. Hazard Awareness and Safe Decisions",
      body: [
        "Selectors must constantly notice hazards around them.",
        "Look for unstable pallets, damaged cases, floor debris, blocked aisles, poor visibility, and rushed traffic.",
        "If something creates risk, deal with it early instead of hoping it fixes itself.",
      ],
      novaVoice:
        "See the problem early. Unsafe pallets, blocked paths, damaged product, and floor hazards must be handled before they become bigger problems.",
      bullets: [
        "Watch for blocked walkways.",
        "Do not ignore damaged cases.",
        "Check unstable loads early.",
        "Protect your path and your workspace.",
      ],
    },
    {
      id: "safe-performance",
      title: "5. Safe Work Creates Strong Work",
      body: [
        "New selectors sometimes think safety slows them down. In reality, unsafe habits create more wasted motion, more hesitation, more mistakes, and more fatigue.",
        "When your movement is controlled, your lifting is clean, and your pallet is stable, your pace improves naturally.",
        "The goal is not careless speed. The goal is safe rhythm and repeatable performance.",
      ],
      novaVoice:
        "Safe work creates strong work. Controlled movement leads to better pace, better quality, and more confidence.",
    },
  ],

  quiz: {
    passingScore: 80,
    questions: [
      {
        id: "q1",
        question: "Why is safety important for selectors?",
        options: [
          "It only matters at the end of the shift",
          "It is separate from performance",
          "It protects the body and supports consistent performance",
          "It only matters for supervisors",
        ],
        correctIndex: 2,
      },
      {
        id: "q2",
        question: "What is the safest lifting habit?",
        options: [
          "Twist quickly with the load",
          "Lift with your legs and keep weight close",
          "Reach as far as possible",
          "Use your back to save time",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "What should you do before turning with a pallet jack?",
        options: [
          "Speed up",
          "Stop caring about balance",
          "Slow down and control the load",
          "Pull harder through the turn",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "What is an example of a warehouse hazard?",
        options: [
          "A clear aisle",
          "A stable pallet",
          "Blocked path or damaged product",
          "A clean floor",
        ],
        correctIndex: 2,
      },
      {
        id: "q5",
        question: "What does safe work lead to over time?",
        options: [
          "More wasted motion",
          "Better rhythm and stronger performance",
          "Less control",
          "More confusion",
        ],
        correctIndex: 1,
      },
    ],
  },

  completion: {
    title: "Warehouse Safety Fundamentals Completed",
    message:
      "Lesson complete. You now understand the safety habits that protect your body, improve control, and support long-term warehouse performance.",
    novaVoice:
      "Lesson complete. Strong work starts with safe work. Keep using these safety habits every shift.",
  },
};
