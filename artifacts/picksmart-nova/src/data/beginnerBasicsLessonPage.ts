export const beginnerBasicsLessonPage = {
  id: "module-1",
  moduleId: "module-1",
  title: "Beginner Basics",
  level: "Beginner",
  duration: "25 min",
  steps: 5,
  voiceEnabled: true,
  badge: "FREE",
  type: "NOVA Voice Guided",

  hero: {
    heading: "Beginner Basics",
    subheading:
      "Your first foundation class for warehouse order selecting. Learn the 5 beginner rules that protect your time, pace, confidence, and money from day one.",
  },

  introCard: {
    title: "Lesson Focus",
    text: "This lesson teaches the 5 beginner rules that protect time, pace, confidence, and money from the start.",
    novaIntroVoice:
      "Welcome to Beginner Basics. In this lesson, you will learn the rules that protect your time, your energy, and your money on every shift.",
  },

  sections: [
    {
      id: "rule-1",
      title: "Rule 1 — Accuracy Before Speed",
      novaLine: "First be clean, then be fast.",
      whyItMatters:
        "Wrong slot confirmation stops your flow, wastes time, and breaks your money pace.",
      badExample:
        "You arrive at the slot, rush the check number, say the wrong number, and the system says invalid.",
      whatHappens: [
        "System rejects the number",
        "You stop moving",
        "You repeat yourself",
        "Your rhythm breaks",
        "You lose time and energy",
      ],
      howToPrevent: [
        "Look at the slot first",
        "Read the number clearly",
        "Confirm it in your mind",
        "Say it once, correctly",
      ],
      novaVoiceScript: `Listen carefully. This is one of the biggest mistakes new selectors make.

You are moving fast. You feel good. You want to keep that speed.

You arrive at the slot.

The system is waiting for your check number.

You hear:
Aisle 17… slot 66… pick 10.

But instead of slowing down for one second to confirm…

You rush.

You do not fully look.
You do not fully read.

You just say a number.

Wrong.

The system responds… invalid.

Now everything stops.

You cannot move forward.
You cannot grab the case.
You are waiting on the system.

You try again… wrong again.

Now your pace is completely broken.

And now something important is happening.

The time you are losing…
is your time.

And your time is your money.

Every wrong check number costs you time.

Every correct confirmation keeps you moving.

Stay clean first.

Then build speed on top of that.`,
      whatThisMeans: [
        "Wrong confirmation breaks your rhythm",
        "Repeating the wrong slot wastes energy",
        "Clean confirmation keeps you in motion",
        "Motion protects your pace",
        "Pace protects your money",
      ],
      coachingClose: "Time is money. Clean work keeps both.",
    },

    {
      id: "rule-2",
      title: "Rule 2 — Build From the Bottom Up",
      novaLine: "Your first layer decides your pallet strength.",
      whyItMatters:
        "A weak base creates problems later, slows your stacking, and steals your time.",
      badExample:
        "You start the pallet too fast with small weak cases, leave gaps, and do not build flat.",
      whatHappens: [
        "Heavy cases crush the bottom later",
        "The pallet leans",
        "You stop to restack and adjust",
        "You lose confidence in the build",
        "Your pace slows down",
      ],
      howToPrevent: [
        "Put heavier, stable cases low",
        "Keep the base flat",
        "Remove gaps early",
        "Build support before height",
      ],
      novaVoiceScript: `Let me show you why your first layer matters.

You start your pallet too fast.

You place small, light, uneven cases first.
You leave gaps.
You do not build flat.

It looks fine right now.

But later in the order… heavy product comes.

Now those heavy cases sit on weak support.

The base shifts.
The pallet leans.
The structure breaks.

Now you are forced to slow down.

You adjust every case.
You stop to fix it.
You fight the pallet instead of building it.

And when you fight the pallet…

You lose time.

And your time is your money.

Now watch the right way.

You start again.

This time, you choose strong, heavy cases first.

You build flat.
You build tight.
You remove gaps.

Now your base is solid.

Later, when heavy product comes…

It is supported.

The pallet stays stable.
Your stacking becomes easier.
Your speed increases naturally.

A weak base steals time later.

A strong base saves time all shift.`,
      whatThisMeans: [
        "Weak base means restacking later",
        "Restacking means lost time and energy",
        "Strong base makes later stacking faster",
        "Stable pallet creates smoother movement",
        "Smooth movement protects money pace",
      ],
      coachingClose:
        "Build it right the first time. A strong base saves time later.",
    },

    {
      id: "rule-3",
      title: "Rule 3 — Move With Purpose",
      novaLine: "Do not move rushed. Move with purpose.",
      whyItMatters:
        "Pauses and wasted steps destroy pace, while rushed bad movement creates more corrections.",
      badExample:
        "You finish a pick, stop too long, or rush into bad position and waste steps.",
      whatHappens: [
        "Broken rhythm",
        "Extra steps",
        "Bad positioning",
        "More corrections",
        "Lower overall pace",
      ],
      howToPrevent: [
        "Move immediately after the pick",
        "Position yourself cleanly",
        "Avoid unnecessary pauses",
        "Stay smooth, not wild",
      ],
      novaVoiceScript: `Let's look at how movement affects your performance.

You finish a pick.

Then you stop.

You look around.
You think.
You wait.

Then you move.

That may feel small.

But it happens every pick.

Those seconds turn into minutes.

Now let's look at another mistake.

You try to move faster.

But you rush.

You misposition.
You take extra steps.
You correct yourself again.

That is not speed.

That is wasted movement.

And wasted movement costs time.

Now watch how strong selectors move.

They hear the command.

They move immediately.

Not rushed.
Not slow.

But controlled.

They position correctly.
They grab clean.
They move again.

No pause.
No extra steps.
No wasted motion.

That is real speed.

Every pause costs time.

Every wasted step costs time.

And your time is your money.`,
      whatThisMeans: [
        "Pauses kill pace",
        "Rushing badly also kills pace",
        "Smooth movement is faster than messy movement",
        "Good positioning saves steps",
        "Saved steps equal saved time",
      ],
      coachingClose: "No wasted pauses. No wasted steps. Move with purpose.",
    },

    {
      id: "rule-4",
      title: "Rule 4 — Think One Step Ahead",
      novaLine:
        "Finish this pick with your hands. Start the next pick with your mind.",
      whyItMatters:
        "Late thinking creates hesitation. Early thinking keeps transitions fast and smooth.",
      badExample:
        "You finish a pick, stop, wait, and only then try to think about what comes next.",
      whatHappens: [
        "Hesitation",
        "Slow transitions",
        "Broken flow",
        "Mental reset every pick",
        "Lost time",
      ],
      howToPrevent: [
        "Think ahead during the current pick",
        "Know your next movement early",
        "Use placement time to prepare mentally",
        "Keep your mind ahead of your hands",
      ],
      novaVoiceScript: `This is where strong selectors separate themselves.

You finish a pick…

Then you stop thinking.

You wait.
Then you react.

That creates delay every time.

Now watch the difference.

You are placing your current case…

But your mind is already ahead.

You are thinking:

Where is the next slot?
Where am I going next?
What is coming next?

So when the next instruction comes…

You are ready.

You move immediately.

No delay.
No hesitation.

Your hands finish the current pick.

Your mind starts the next one.

That is how you protect your time.

Thinking late equals moving late.

Thinking early equals moving early.

And early movement protects your money.`,
      whatThisMeans: [
        "Late thinking creates hesitation",
        "Thinking ahead removes delay",
        "Better transitions increase speed",
        "Better transitions reduce mental fatigue",
        "Less hesitation protects money pace",
      ],
      coachingClose: "Stay ahead. Think early, move early.",
    },

    {
      id: "rule-5",
      title: "Rule 5 — Safety Is Part of Performance",
      novaLine: "Safe work is strong work.",
      whyItMatters:
        "Unsafe movement causes fatigue, instability, and slower performance later in the shift.",
      badExample:
        "You twist while lifting, rush corners, and move the jack too hard.",
      whatHappens: [
        "Unstable pallet",
        "Faster fatigue",
        "Loss of control",
        "Slower pace later",
        "More stress on the body",
      ],
      howToPrevent: [
        "Lift with your legs",
        "Control your movement",
        "Slow before turns",
        "Protect the load while moving",
      ],
      novaVoiceScript: `Let me show you why unsafe work costs you time.

You rush your movement.

You twist while lifting.
You pull too hard.
You take turns too fast.

At first, it feels faster.

But then…

Your pallet becomes unstable.
Your body gets tired faster.
Your control drops.

Now your speed drops anyway.

Now you are working harder…

But producing less.

Now watch the right way.

You move with control.

You lift correctly.
You slow before turns.
You protect the load.

Now everything stays stable.

Your body lasts longer.
Your pace stays strong.

When you lose control…

You lose time.

And your time is your money.`,
      whatThisMeans: [
        "Unsafe movement causes faster fatigue",
        "Fatigue slows production later",
        "Stable movement protects long-shift pace",
        "Control reduces mistakes and restacking",
        "Safe work helps you hold money pace longer",
      ],
      coachingClose: "Control your body. Control your load. Protect your time.",
    },
  ],

  lessonClose: {
    title: "Lesson Close",
    novaVoice:
      "Those are your 5 beginner rules. Be clean before fast. Build your base strong. Move with purpose. Think ahead. And work with control. If you protect your time… you protect your pace. And if you protect your pace… you protect your money.",
  },

  quiz: {
    passingScore: 80,
    questions: [
      {
        id: "q1",
        question: "What should a beginner focus on first?",
        options: [
          "Speed only",
          "Accuracy and safety",
          "Competing with others",
          "Moving fast",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Why is the base of a pallet important?",
        options: [
          "It does not matter",
          "Only for looks",
          "It supports the entire pallet",
          "Only for light items",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "What does move with purpose mean?",
        options: [
          "Run all shift",
          "Stop often",
          "Stay active without wasting time",
          "Rush everything",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "What should your mind do during a pick?",
        options: [
          "Stop thinking",
          "Prepare the next move",
          "Focus only on speed",
          "Wait for help",
        ],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "What is success in week one?",
        options: [
          "Be the fastest",
          "Make no mistakes ever",
          "Learn and improve",
          "Skip the basics",
        ],
        correctIndex: 2,
      },
    ],
  },

  completion: {
    title: "Beginner Basics Completed",
    message:
      "Lesson complete. You now understand the beginner foundation for selecting and how the 5 rules protect your time, pace, and money.",
    novaVoice:
      "Lesson complete. Strong start. You now understand the beginner foundation. Keep building.",
  },
};
