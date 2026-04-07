export interface LessonQuestion {
  id: string;
  question: string;
  correctAnswer: "yes" | "no";
}

export interface LessonStep {
  id: string;
  title: string;
  content: string;
}

export interface LessonContent {
  moduleId: string;
  moduleTitle: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  isFree: boolean;
  intro: string;
  steps: LessonStep[];
  summary: string;
  questions: LessonQuestion[];
}

export const LESSON_CONTENT: LessonContent[] = [
  {
    moduleId: "mod-1",
    moduleTitle: "Beginner Basics",
    category: "Foundation",
    difficulty: "beginner",
    durationMinutes: 25,
    isFree: true,
    intro:
      "Welcome to Beginner Basics. This lesson covers everything you need to know before your first shift — how the job works, your equipment, and what to expect from NOVA. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "What is Order Selecting?",
        content:
          "Order selecting means picking grocery products from warehouse shelves and loading them onto pallets for delivery to stores. You work in a large, industrial freezer, dairy, or dry-goods warehouse — moving fast, following NOVA's directions stop by stop.",
      },
      {
        id: "s2",
        title: "Your Equipment",
        content:
          "You will operate a voice-directed picking system (NOVA headset), a stand-up pallet jack, and work with CHEP wood pallets. Wear your safety gear every shift — steel-toed boots, hi-vis vest, and gloves in the freezer zone.",
      },
      {
        id: "s3",
        title: "How NOVA Guides You",
        content:
          "NOVA gives you one instruction at a time through your headset. It says the aisle, the slot, and waits for you to confirm the check code. You respond verbally or via the keypad. If your code is correct, NOVA tells you the quantity to grab.",
      },
      {
        id: "s4",
        title: "The Check Code System",
        content:
          "Every slot has a 3-digit check code on the label. NOVA says the location, you say the check code. This confirms you are at the right slot before picking. If the code is wrong, NOVA says invalid and repeats — it will not move on until you are in the right place.",
      },
      {
        id: "s5",
        title: "What to Expect on Day One",
        content:
          "Day one is about learning the flow, not speed. Your trainer will shadow you. Focus on confirming every check code, building safe pallets, and asking questions. Rate pressure comes later — first, build the right habits.",
      },
    ],
    summary:
      "You now understand what order selecting is, how your equipment works, how NOVA communicates with you, and what check codes do. These are the foundations everything else builds on.",
    questions: [
      {
        id: "q1",
        question: "Should you say the check code before picking from a slot?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Can NOVA continue to the next stop if your check code is wrong?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Is wearing safety gear optional if you feel comfortable without it?",
        correctAnswer: "no",
      },
      {
        id: "q4",
        question: "Is day one about learning the flow rather than hitting top speed?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    moduleId: "mod-2",
    moduleTitle: "Warehouse Safety Fundamentals",
    category: "Safety",
    difficulty: "beginner",
    durationMinutes: 35,
    isFree: false,
    intro:
      "Welcome to Warehouse Safety Fundamentals. This lesson covers proper lifting mechanics, injury prevention, and how to stay physically safe on demanding long shifts. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "Proper Lifting Technique",
        content:
          "Always bend at the knees, not the waist. Keep the load close to your body. Engage your core before lifting. For anything over 50 lbs, ask for help or use equipment. Back injuries are the number one reason selectors leave the job in their first 90 days.",
      },
      {
        id: "s2",
        title: "Heavy vs. Light Cases",
        content:
          "Heavy cases go on the bottom of the pallet — water, canned goods, jars. Light cases go on top — bread, chips, paper goods. Never stack heavy on top of light. A falling pallet in a warehouse can cause serious injury.",
      },
      {
        id: "s3",
        title: "Freezer Zone Safety",
        content:
          "In the freezer, wear all provided cold-weather gear. Take your warm-up breaks as scheduled — skipping them causes cold stress. Watch for ice patches near dock doors. Move slower in the freezer than on the dry floor.",
      },
      {
        id: "s4",
        title: "Forklift Awareness",
        content:
          "Forklifts have right-of-way in all warehouse zones. Always check both ways at aisle intersections. Never walk behind a reversing forklift. Make eye contact with the operator before crossing their path.",
      },
      {
        id: "s5",
        title: "Emergency Procedures",
        content:
          "If you get injured, stop immediately — do not push through. Report the injury to your supervisor right away. In NOVA, say 'emergency stop' to halt the session. Know where the first aid stations and emergency exits are in your facility.",
      },
    ],
    summary:
      "Safety is not optional — it is what keeps you on the job. Proper lifting, correct pallet loading, forklift awareness, and knowing how to stop in an emergency protect you and your coworkers every shift.",
    questions: [
      {
        id: "q1",
        question: "Should heavy cases always go on the bottom of the pallet?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it safe to skip your freezer warm-up breaks to hit a higher rate?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Do forklifts have right-of-way in all warehouse zones?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Should you push through an injury to finish your assignment?",
        correctAnswer: "no",
      },
      {
        id: "q5",
        question: "Should you bend at the knees when lifting heavy cases?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    moduleId: "mod-3",
    moduleTitle: "Pallet Building Standards",
    category: "Skills",
    difficulty: "intermediate",
    durationMinutes: 40,
    isFree: false,
    intro:
      "Welcome to Pallet Building Standards. This lesson teaches the Tetris-style stacking method used by top selectors. A well-built pallet is faster to deliver and safer for the store. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "The Foundation Rule",
        content:
          "Your first layer is your foundation. Use the heaviest, most stable cases — water, canned goods, bottled drinks. Fill the layer completely before stacking anything on top. Gaps in the foundation make the entire pallet unstable.",
      },
      {
        id: "s2",
        title: "The Tetris Method",
        content:
          "Interlock your layers like bricks. Each case should overlap the seam between two cases below it. This cross-stacking pattern locks the pallet together. Straight columns (one case directly on top of another) collapse easily.",
      },
      {
        id: "s3",
        title: "Weight Taper",
        content:
          "Heaviest on bottom, lightest on top. Medium items in the middle. As you go up, the cases should get lighter. The top layer — chips, bread, eggs — should never support weight above it. Build a pyramid shape, not a tower.",
      },
      {
        id: "s4",
        title: "Height Limits",
        content:
          "Standard pallet height is 60 inches (5 feet) maximum from the pallet deck. Exceeding height limits causes falls at dock doors and in trucks. Builds going above your eye level need a supervisor check before delivery.",
      },
      {
        id: "s5",
        title: "Alpha vs. Bravo Pallet",
        content:
          "Most assignments use two pallets — Alpha and Bravo. Alpha gets filled first and typically takes the heavier dry goods. Bravo handles overflow and often gets the lighter, top-layer items. Know which pallet to load before each stop.",
      },
      {
        id: "s6",
        title: "Pallet Delivery",
        content:
          "When your assignment is complete, NOVA gives you printer, label, and door instructions. Print the label, apply it to the correct pallet, and deliver to the assigned door. Never mix up Alpha and Bravo labels — the store needs to receive the right load.",
      },
    ],
    summary:
      "A well-built pallet keeps product safe, makes delivery faster, and protects you and the stores. Master the foundation rule, Tetris stacking, weight taper, and height limits — and your pallets will never fall.",
    questions: [
      {
        id: "q1",
        question: "Should the heaviest cases go on the bottom layer of the pallet?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it acceptable to stack cases in straight vertical columns?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Is 5 feet the maximum standard pallet height?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Should you apply the Alpha label to the Bravo pallet if you run out of Alpha labels?",
        correctAnswer: "no",
      },
    ],
  },
  {
    moduleId: "mod-4",
    moduleTitle: "Pick Path Optimization",
    category: "Performance",
    difficulty: "intermediate",
    durationMinutes: 38,
    isFree: false,
    intro:
      "Welcome to Pick Path Optimization. This lesson teaches you how to move faster without rushing — using route planning and eliminating wasted steps to add serious time to your rate. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "What Wasted Steps Cost You",
        content:
          "Every unnecessary step adds up. Walking 10 extra feet per stop across 50 stops means 500 extra feet per assignment. That adds 5–7 minutes to your time. Those same minutes, saved, push your rate from 92% to 100%+.",
      },
      {
        id: "s2",
        title: "Scan Your Route Before You Start",
        content:
          "Before your first pick, review your assignment aisles. Understand where you start and end. Mentally map the heaviest stops so you load them first. This 60-second investment at the start saves minutes over the full shift.",
      },
      {
        id: "s3",
        title: "Pick the Dead-End Side First",
        content:
          "If an aisle has a dead end, always go to the dead end first, then pick your way back out. Going to the dead end last means an empty trip in and a loaded trip back — the wrong order. Go in loaded and come out toward the next aisle.",
      },
      {
        id: "s4",
        title: "Positioning Your Pallet Jack",
        content:
          "Keep your pallet jack in the center of the aisle, not parked at the end. Reposition it as you move through — you should never walk more than 15 feet from your pallet to a pick. Far parking kills time and your back.",
      },
      {
        id: "s5",
        title: "Pre-Stage Your Grab",
        content:
          "While NOVA is speaking, position yourself. Before NOVA confirms your check code, be standing at the slot, hand on the product. The moment NOVA says 'grab', you're already moving. Don't wait — pre-stage.",
      },
    ],
    summary:
      "Speed in warehouse picking is almost never about moving faster — it's about eliminating wasted motion. Scan your route, work dead ends correctly, keep your jack close, and pre-stage every grab. These habits alone can add 15% to your rate.",
    questions: [
      {
        id: "q1",
        question: "Should you scan your assignment route before your first pick?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Should you walk to the dead end of an aisle after picking your way through?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Is it acceptable to park your pallet jack at the end of the aisle while picking?",
        correctAnswer: "no",
      },
      {
        id: "q4",
        question: "Should you position yourself at the slot while NOVA is still speaking?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    moduleId: "mod-5",
    moduleTitle: "Performance and Pace Tracking",
    category: "Performance",
    difficulty: "advanced",
    durationMinutes: 52,
    isFree: false,
    intro:
      "Welcome to Performance and Pace Tracking. This lesson breaks down the warehouse performance system and teaches proven strategies to go from 70% to 100%+ rate. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "How Your Rate is Calculated",
        content:
          "Your rate compares how many cases you picked to the engineered standard for your assignment. 100% means you matched the expected pace exactly. Above 100% means you beat it. Below 100% means you fell short. The standard is built from thousands of real shifts.",
      },
      {
        id: "s2",
        title: "Your First Two Weeks",
        content:
          "New hires are typically expected to reach 75% by week two and 85% by week four. Do not try to race to 100% in week one — you will build bad habits, skip safety steps, and burn out. Build the correct habits first. Speed follows.",
      },
      {
        id: "s3",
        title: "Reading Your NOVA Performance Display",
        content:
          "NOVA shows your elapsed time, progress percent, and pace status during picking. 'Ahead' means you are beating goal pace. 'On pace' means you match it. 'Behind' means you need to focus. Check your pace display every 10 stops — do not obsess over it every stop.",
      },
      {
        id: "s4",
        title: "Where Selectors Lose Time",
        content:
          "Top time-losers: re-checking wrong check codes, walking too far from the pallet, taking extra trips to rearrange bad pallet builds, and waiting too long to confirm readiness. Fix these four things and most selectors gain 10–15% rate improvement within two weeks.",
      },
      {
        id: "s5",
        title: "How to Move From 85% to 100%",
        content:
          "At 85%, you know the job. Getting to 100% is about eliminating the small hesitations — the pause before confirming, the extra look before grabbing, the slow repositioning. These cost half a second each. At 50 stops per assignment, that's 25 wasted seconds. Own each transition.",
      },
      {
        id: "s6",
        title: "Sustaining 100%+ Long Term",
        content:
          "Hitting 100% once is a milestone. Sustaining it is about physical maintenance — stretching before shifts, eating during breaks, staying hydrated. Selectors who hit 110%+ consistently protect their bodies off the floor as much as they work on it.",
      },
    ],
    summary:
      "Rate improvement is a process, not a sprint. Understand how it's calculated, watch your pace display without obsessing, fix your four biggest time-losers, and build physical habits that support sustained performance. 100%+ is achievable for almost every selector who commits to the process.",
    questions: [
      {
        id: "q1",
        question: "Should new hires try to hit 100% rate in their first week?",
        correctAnswer: "no",
      },
      {
        id: "q2",
        question: "Does 100% rate mean you matched the engineered standard exactly?",
        correctAnswer: "yes",
      },
      {
        id: "q3",
        question: "Is wrong check code entry one of the top four time-losers?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Should you check your pace display after every single stop?",
        correctAnswer: "no",
      },
      {
        id: "q5",
        question: "Does sustaining 100%+ require physical maintenance habits off the floor?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    moduleId: "mod-6",
    moduleTitle: "Real Shift Simulation",
    category: "Simulation",
    difficulty: "advanced",
    durationMinutes: 45,
    isFree: false,
    intro:
      "Welcome to Real Shift Simulation. This lesson walks through a complete real shift from clock-in to clock-out — including how to manage energy, focus, and a full assignment. When you are ready, click Ready.",
    steps: [
      {
        id: "s1",
        title: "Pre-Shift Routine (0:00 – 0:15)",
        content:
          "Clock in 10 minutes early. Get your headset from your supervisor. Check your assignment list — know your assignment numbers before you reach the floor. Do a 5-minute stretch targeting your lower back, knees, and shoulders. Hydrate before you start picking.",
      },
      {
        id: "s2",
        title: "First Assignment Start (0:15 – 0:30)",
        content:
          "Log into NOVA, pull your first assignment. Listen to the full intro — aisle range, case count, pallets, goal time. Set up your Alpha pallet at your start aisle. Set up Bravo if needed. Confirm readiness and begin. Your first 10 stops set your rhythm — do not rush them.",
      },
      {
        id: "s3",
        title: "Mid-Assignment Focus (0:30 – 2:30)",
        content:
          "Stay in a rhythm. Confirm code, grab quantity, reposition, pre-stage. After every 20 stops, glance at your pace display. If you are behind, accelerate your transitions — not your picking speed. Most time is lost between stops, not at the shelf.",
      },
      {
        id: "s4",
        title: "Assignment Completion",
        content:
          "When NOVA says 'last case complete', go straight to the printer. Print your labels — Alpha first, Bravo second. Apply them to the correct pallets. Deliver to the door number NOVA gave you. Confirm with the dock team. Return your jack and pull your next assignment.",
      },
      {
        id: "s5",
        title: "Managing Energy Over a Full Shift",
        content:
          "Eat your break meal — skipping it kills your rate in hours 5–8. Walk during your break instead of sitting — it keeps your legs loose. Drink water every break. Your body is a machine. Fuel it like one.",
      },
      {
        id: "s6",
        title: "End of Shift Debrief",
        content:
          "Before clocking out, review your rate for the shift. Note which assignments went well and which went slow. Ask your trainer what they observed. The selectors who improve fastest are the ones who review their performance and adjust the next day.",
      },
    ],
    summary:
      "A great shift is built from a good pre-shift routine, a strong rhythm on the floor, smart mid-assignment adjustments, complete delivery execution, and energy management all shift long. Practice the full sequence — not just the picking.",
    questions: [
      {
        id: "q1",
        question: "Should you review your assignment numbers before reaching the warehouse floor?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it acceptable to skip your break meal to keep picking?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Is most time lost between stops rather than at the shelf?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Should you review your performance rate after each shift?",
        correctAnswer: "yes",
      },
    ],
  },
];

export function getLessonById(moduleId: string): LessonContent | undefined {
  return LESSON_CONTENT.find(l => l.moduleId === moduleId);
}
