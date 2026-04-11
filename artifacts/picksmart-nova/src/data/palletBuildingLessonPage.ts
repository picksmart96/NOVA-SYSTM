export const palletBuildingLessonPage = {
  id: "module-3-lesson-1",
  moduleId: "module-3",
  title: "Pallet Building Standards",
  level: "Intermediate",
  duration: "40 min",
  steps: 6,
  voiceEnabled: true,

  hero: {
    heading: "Pallet Building Standards",
    subheading:
      "Learn how to build strong, stable pallets that stay safe during movement and support better warehouse performance.",
  },

  introVoice:
    "Welcome to Pallet Building Standards. In this lesson, you will learn how to build a pallet that stays strong while moving, turning, and traveling through the warehouse.",

  sections: [
    {
      id: "base-principle",
      title: "1. The Real Goal of Pallet Building",
      body: [
        "A strong pallet is not just a pallet that looks neat while standing still.",
        "A strong pallet must survive movement, turns, stops, and pressure during the shift.",
        "That means good pallet building is about structure, balance, weight control, and smart stacking decisions.",
      ],
      novaVoice:
        "You are not building a pallet to stand still. You are building a pallet that must survive movement.",
    },
    {
      id: "build-the-base",
      title: "2. Build the Base First",
      body: [
        "The base is the foundation of the entire pallet.",
        "Heavy and solid cases should go lower. The base should stay flat, tight, and balanced.",
        "If the base has gaps, uneven height, or weak support, the whole pallet becomes unstable later.",
      ],
      novaVoice:
        "Build your base first. Heavy items low. Keep it flat, tight, and balanced.",
      bullets: [
        "Use heavier products on the bottom.",
        "Keep the first layer flat.",
        "Fill space carefully and reduce gaps.",
        "Avoid weak corners and uneven surfaces.",
      ],
    },
    {
      id: "structure",
      title: "3. Build Structure, Not a Tower",
      body: [
        "Strong pallets are built with structure, not random stacking.",
        "Layers should support each other. Cases should be placed so weight spreads across the pallet, not on one narrow line.",
        "Avoid tall weak towers, unsupported edges, and heavy cases sitting on weak product.",
      ],
      novaVoice:
        "Build structure, not a tower. Interlock when possible. Support weight across the pallet.",
      bullets: [
        "Think about support under every case.",
        "Do not stack heavy product on weak items.",
        "Avoid narrow vertical towers.",
        "Keep the pallet stable from side to side.",
      ],
    },
    {
      id: "balance",
      title: "4. Balance the Weight",
      body: [
        "A pallet that is too heavy on one side will lean, shift, or collapse during movement.",
        "Weight must be distributed in a way that keeps the pallet centered and controlled.",
        "Watch for leaning early. Fix imbalance before it becomes a bigger problem.",
      ],
      novaVoice:
        "Balance the pallet early. Do not wait for a lean to become a collapse.",
      bullets: [
        "Spread weight across the pallet.",
        "Do not overload one side.",
        "Fix leaning as soon as you see it.",
        "Keep the center strong and supported.",
      ],
    },
    {
      id: "top-layer",
      title: "5. Finish the Top the Right Way",
      body: [
        "The top layer matters because it affects how the pallet moves and how secure it stays.",
        "Lighter and more fragile product should go higher. The top should stay clean, flat, and controlled.",
        "Do not leave hanging edges, loose cases, or a messy top that shifts while driving.",
      ],
      novaVoice:
        "Finish clean. Light items higher. Keep the top flat and controlled.",
      bullets: [
        "Put lighter items on top.",
        "Avoid overhang.",
        "Do not leave loose unstable product at the top.",
        "Keep the final shape controlled and compact.",
      ],
    },
    {
      id: "driving-stability",
      title: "6. Build for Driving Stability",
      body: [
        "The pallet is tested when you move it. Hard turns, sudden stops, and rough driving expose weak builds immediately.",
        "A strong selector builds the pallet and drives in a way that protects it.",
        "Smooth movement, controlled turns, and stable pallet design work together.",
      ],
      novaVoice:
        "Build for movement. Drive smooth. Slow down before turns. Protect the pallet with your decisions.",
      bullets: [
        "Slow down before turning.",
        "Avoid hard stops.",
        "Do not jerk the pallet.",
        "Keep the load controlled during travel.",
      ],
    },
  ],

  quiz: {
    passingScore: 80,
    questions: [
      {
        id: "q1",
        question: "What is the real goal of pallet building?",
        options: [
          "Make it look tall",
          "Make it stand still for a moment",
          "Build it so it survives movement safely",
          "Finish faster than everyone else",
        ],
        correctIndex: 2,
      },
      {
        id: "q2",
        question: "What belongs on the bottom of a pallet?",
        options: [
          "The weakest items",
          "Heavier solid product",
          "Only light boxes",
          "Loose product",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "What is a common bad pallet building habit?",
        options: [
          "Balanced support",
          "Interlocked structure",
          "Tall unsupported towers",
          "Flat base",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "Why is balance important?",
        options: [
          "It only matters for the top layer",
          "It prevents leaning and instability during movement",
          "It makes the pallet taller",
          "It only matters after wrapping",
        ],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "What should you do before turning with a loaded pallet?",
        options: [
          "Speed up",
          "Slow down and stay controlled",
          "Pull harder",
          "Ignore the load shape",
        ],
        correctIndex: 1,
      },
    ],
  },

  completion: {
    title: "Pallet Building Standards Completed",
    message:
      "Lesson complete. You now understand how to build stronger, safer pallets that stay stable during movement and support better performance.",
    novaVoice:
      "Lesson complete. Strong pallets come from strong decisions. Keep building with structure, balance, and control.",
  },
};
