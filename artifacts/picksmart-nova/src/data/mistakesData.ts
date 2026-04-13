export interface MistakeScenario {
  assignment: string;
  location: string;
  issue: string;
  wrongFlow: string[];
  correctFlow: string[];
}

export interface MistakeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface MistakeData {
  id: string;
  title: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  category: string;
  heroLine: string;
  novaLine: string;
  novaIntro: string;
  whyItHappens: string;
  whatGoesWrong: string;
  fixSteps: string[];
  coachingScript: string;
  scenario: MistakeScenario;
  questions: MistakeQuestion[];
}

export const MISTAKES: MistakeData[] = [
  {
    id: "mispick",
    title: "Mispick — Wrong Item",
    riskLevel: "critical",
    category: "Accuracy",
    heroLine: "The selector who never mispicks is not fast — they are disciplined.",
    novaLine: "Confirm before you grab. Read before you reach.",
    novaIntro:
      "Welcome to Mispick coaching. A mispick is picking the wrong product from a slot. It is the number one selector accuracy error. When you are ready, click Ready.",
    whyItHappens:
      "Mispicks happen when a selector rushes through visually similar products, skips the check code confirmation, or grabs by habit instead of reading the slot label.",
    whatGoesWrong:
      "The wrong item ships to a store. The store receives incorrect inventory. Receivers flag the order. The selector's accuracy score drops. If repeated, it triggers disciplinary review.",
    fixSteps: [
      "Always read the full slot label before grabbing — not just the first word.",
      "Confirm the check code before you grab a single case.",
      "If the product looks different from what you expect, stop and re-read before picking.",
      "Do not pick by memory. Every slot gets a fresh confirmation.",
      "When in doubt, say 'repeat' and listen to NOVA again.",
    ],
    coachingScript: `The selector who never mispicks is not fast — they are disciplined.

Let me show you how a mispick happens.

You hear: Aisle 14, slot 42.

You've been in that aisle dozens of times.
You think you know exactly what's there.
So you reach without fully reading.

Two products look almost identical.
You grab the one on the left.

The check code doesn't match — but you didn't say it out loud.
You just moved.

Now the wrong item ships to the store.
The store receives incorrect inventory.
Receiving flags the order.
Your accuracy score drops.

And it all started with one second of skipping the confirmation.

Now watch the right way.

You hear: Aisle 14, slot 42.

You move toward the slot.
You read the full label — not just the first word.
You say the check code out loud.

NOVA confirms.

Now you grab.

One second of confirmation prevents five minutes of error correction.
Your check code is your accuracy guarantee.

Use it every time.

Remember this:

Discipline is what makes a selector great.
Speed comes after discipline.
Never before it.`,
    scenario: {
      assignment: "Assignment 251735",
      location: "Aisle 14 · Slot 42",
      issue: "Grabbed by visual similarity — skipped check code",
      wrongFlow: [
        "Grabbed by habit — not by code confirmation",
        "Wrong SKU ships to store",
        "Receiver flags the order",
        "Selector accuracy score drops",
      ],
      correctFlow: [
        "Read full slot label completely",
        "Confirmed check code aloud",
        "Product matched — case placed",
        "Accurate order, clean record",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "What is the most effective step to prevent a mispick?",
        options: [
          "Move faster to the next slot",
          "Confirm the check code before grabbing",
          "Pick from memory in familiar aisles",
          "Count the cases twice instead",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "A slot looks very familiar. What should you do?",
        options: [
          "Grab quickly based on memory",
          "Read the full label and confirm the code",
          "Skip confirmation to save time",
          "Guess and move on",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "The product looks slightly different than expected. You should:",
        options: [
          "Grab it anyway — it is close enough",
          "Stop and re-read before picking",
          "Take a photo and continue",
          "Skip the stop and move on",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "One mispick event usually results in:",
        options: [
          "No consequence",
          "A small bonus note",
          "An accuracy score hit and a store receiving issue",
          "Faster pace next shift",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "short-pick",
    title: "Short Pick — Missing Quantity",
    riskLevel: "high",
    category: "Accuracy",
    heroLine: "One missing case is an accuracy error — count every case you place.",
    novaLine: "Count aloud. Touch each case. Stop at the number NOVA gave you.",
    novaIntro:
      "Welcome to Short Pick coaching. A short pick means you grabbed fewer cases than NOVA requested. Even one case short causes a receiving discrepancy. When you are ready, click Ready.",
    whyItHappens:
      "Short picks happen when a selector misheard the quantity, counted too fast, or stopped counting mid-grab because of a distraction.",
    whatGoesWrong:
      "The store receives fewer units than ordered. Shelves run out faster. The order is flagged as incomplete. The selector's accuracy score is docked per short pick event.",
    fixSteps: [
      "Count aloud as you place each case on the pallet — one, two, three.",
      "Do not count by looking at the slot — count by touching each case as it lands.",
      "If NOVA said four, make sure four cases are physically on the pallet before saying ready.",
      "When noise on the floor is high, ask NOVA to repeat the quantity before picking.",
      "For large quantities (8+), split your count into groups of four.",
    ],
    coachingScript: `Short picks are quiet mistakes.

NOVA moves on. The session continues. But the store gets shorted — and you get flagged.

Let me show you how it happens.

You hear: pick six.

But it's loud on the floor.
You think you heard five.
You place five cases and say ready.

NOVA keeps going.

Nobody stops you.
Nothing alerts you.

But the store receives five when it needed six.
That shelf runs out faster.
Receiving flags the discrepancy.
Your accuracy score goes down.

Now the right way.

You hear: pick six.

If it was unclear — you say repeat.

Then you count aloud.

One. Two. Three. Four. Five. Six.

You touch each case as it lands on the pallet.

Six cases physically on the pallet before you say ready.

That is how you protect your accuracy.

Remember this:

Count every case.
If you are not sure of the number, repeat before you pick.
One missing case per stop across ten assignments is a real accuracy problem.`,
    scenario: {
      assignment: "Assignment 251736",
      location: "Aisle 11 · Slot 77",
      issue: "Counted too fast and placed 5 instead of 6",
      wrongFlow: [
        "Counted visually — not by touch",
        "Placed 5 cases instead of 6",
        "Store receives incomplete order",
        "Accuracy score docked",
      ],
      correctFlow: [
        "Counted aloud: one, two, three, four, five, six",
        "Touched each case as it landed",
        "Confirmed quantity before saying ready",
        "Complete order, clean accuracy record",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "What is the safest way to count cases during picking?",
        options: [
          "Count visually by looking at them",
          "Count aloud while touching each case as it lands",
          "Estimate based on the slot appearance",
          "Count once at the end of the stop",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "NOVA says pick 4 but it was noisy. You should:",
        options: [
          "Guess and grab 4",
          "Say repeat and confirm the quantity before picking",
          "Pick 5 to be safe",
          "Skip the stop entirely",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "A short pick has the same consequence as:",
        options: [
          "A perfect pick — no difference",
          "A mispick — both are logged accuracy errors",
          "Nothing — the store will adjust",
          "A speed bonus stop",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "over-pick",
    title: "Over Pick — Extra Quantity",
    riskLevel: "high",
    category: "Accuracy",
    heroLine: "An over-pick feels helpful — but it breaks the order.",
    novaLine: "Be exact. NOVA gives the number for a reason. Your job is precision, not generosity.",
    novaIntro:
      "Welcome to Over Pick coaching. Picking too many cases is just as wrong as picking too few. Both are flagged as accuracy errors. When you are ready, click Ready.",
    whyItHappens:
      "Over picks happen when a selector assumes more is better, does not stop counting at the correct number, or tries to empty a nearly empty slot instead of following the system.",
    whatGoesWrong:
      "The store receives more than ordered. Inventory counts become inaccurate. Receiving gets delayed. Extra product must be returned or corrected. The selector loses accuracy points.",
    fixSteps: [
      "Stop exactly at the quantity NOVA gave you — not one more. Your stop point is part of the job.",
      "Do not empty a slot just because it is almost empty. The system controls inventory, not your judgment.",
      "Re-count after placing — if you have too many, remove the extra before moving or saying ready.",
      "Never round up to save time later. That creates more work for the operation.",
      "If the quantity sounds wrong, say 'repeat' and confirm. Do not change the number yourself.",
    ],
    coachingScript: `An over-pick seems harmless — you gave them more.

But it throws off inventory, receipts, and store ordering for every item that store tracks.

Let me show you what really happens.

You hear: pick 8.

The slot looks almost empty.
You think: I'll just take the rest.

So you grab 10.

Nothing stops you.
The system keeps moving.

But now the store receives more than it ordered.

Inventory counts go off.
Receiving has to stop and figure it out.
Extra cases get returned or reshipped.

That is real time lost for the company.

And your accuracy gets hit the same as a mispick.

Now watch the right way.

You hear: pick 8.

You count clean.

One… two… three… four… five… six… seven… eight.

You stop exactly at eight.

Even if the slot has more left.

Now the order is correct.
The store receives exactly what it expects.
The system stays clean.

And you keep moving without correction.

Remember this:

Extra is not helpful.
Exact is professional.

And professional work protects money.`,
    scenario: {
      assignment: "Assignment 251737",
      location: "Aisle 22 · Slot 104",
      issue: "NOVA said pick 8 — selector took 10",
      wrongFlow: [
        "Grabbed 10 instead of 8",
        "Inventory count goes off",
        "Receiving delayed and flagged",
        "Accuracy hit — same consequence as a mispick",
      ],
      correctFlow: [
        "Counted exactly to 8",
        "Left remaining product in slot",
        "Store receives exactly what it ordered",
        "Clean record, no correction needed",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Why is over picking considered an accuracy error?",
        options: [
          "It helps the store get extra product",
          "It breaks inventory and creates receiving problems",
          "It makes you pick faster",
          "Nothing happens to the order",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "The slot has product left after your pick. You should:",
        options: [
          "Take the rest to help the store",
          "Leave it — pick exactly what was ordered",
          "Report it to a supervisor",
          "Guess what extra the store might need",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "What is the correct mindset when picking quantity?",
        options: [
          "More is always better",
          "Speed over everything",
          "Precision — stop exactly at the number NOVA gave",
          "Estimate what looks right",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "bad-stacking",
    title: "Bad Stacking — Crush Damage",
    riskLevel: "critical",
    category: "Pallet Quality",
    heroLine: "One bad placement can cost hundreds. Think weight, not speed.",
    novaLine: "Heavy low. Fragile high. Support every layer.",
    novaIntro:
      "Welcome to Bad Stacking coaching. Placing heavy items on fragile ones causes crush damage in transit. This is one of the most expensive selector errors. When you are ready, click Ready.",
    whyItHappens:
      "Bad stacking happens when selectors move too fast and place cases wherever they fit instead of where they belong structurally.",
    whatGoesWrong:
      "Product gets crushed during movement, stores receive unsellable goods, claims are filed, and selector performance records are impacted.",
    fixSteps: [
      "Heavy cases build the foundation — always start strong at the bottom.",
      "Medium weight creates structure — support every layer evenly.",
      "Fragile items stay protected on top — never under pressure.",
      "Never place heavy on soft — this creates instant failure during travel.",
      "When unsure, pause and feel the case — one second prevents damage.",
    ],
    coachingScript: `A damaged product costs the company money.
It costs the store shelf availability.
It costs the selector their damage record.

One fast decision can turn into a costly problem.

Let me show you how it happens.

You are building fast.
You have a case of water.
You have a case of bread.

You place the water wherever it fits.
It lands on top of the bread.

Nothing stops you.
NOVA keeps moving.

But in transit…

The water shifts.
The bread collapses.

Now the store receives a flattened case.
It goes straight to the dumpster.
A claim is filed.
Your damage record is noted.

That one second of careless placement costs hundreds of dollars.

Now watch the right way.

You think about weight before you place.

Water — heavy. Goes to the bottom.
Bread — fragile. Goes to the top.

One second of thinking.

The pallet stays intact.
The store receives sellable product.
Your record stays clean.

Remember this:

Think weight, not speed.
One second of thinking prevents hundreds of dollars in damage.`,
    scenario: {
      assignment: "Assignment 251738",
      location: "Aisle 19 · Slot 212",
      issue: "Heavy cases placed on top of fragile product",
      wrongFlow: [
        "Water cases placed on top of bread",
        "Product crushed during transport",
        "Store receives unsellable goods",
        "Damage claim filed — selector record noted",
      ],
      correctFlow: [
        "Heavy (water) placed at the base",
        "Medium weight built in the middle",
        "Fragile (bread) protected on top",
        "Clean delivery — no damage, no claim",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Where should heavy cases always be placed on the pallet?",
        options: [
          "On top for easy unloading at the store",
          "At the bottom of the pallet",
          "In the middle for balance",
          "Wherever they fit first",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "You have water and chips to place. The correct stacking order is:",
        options: [
          "Chips on bottom, water on top",
          "Water on bottom, chips on top",
          "Stack them randomly — it does not matter",
          "Ask a coworker to decide",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "A case feels unexpectedly heavy. You should:",
        options: [
          "Stack it wherever it fits first",
          "Place it low in the build where it belongs",
          "Put it at the top to check the weight later",
          "Skip it and come back",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "Crush damage in transit results in:",
        options: [
          "Nothing — the store fixes it",
          "Product loss, a damage claim, and a notation on the selector record",
          "A bonus for identifying the damage",
          "Faster delivery times",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "poor-stacking",
    title: "Unstable Pallet — Collapse Risk",
    riskLevel: "critical",
    category: "Pallet Quality",
    heroLine: "Build like a brick wall — interlocked, even, and solid.",
    novaLine: "Interlock every layer. No columns. No gaps. Keep it wide and stable.",
    novaIntro:
      "Welcome to Unstable Build coaching. A pallet that leans, tips, or collapses is dangerous and expensive. This session teaches you how to build solid, locked pallets. When you are ready, click Ready.",
    whyItHappens:
      "Unstable pallets happen when selectors stack in straight vertical columns, leave gaps in layers, or build too tall and narrow instead of wide and interlocked.",
    whatGoesWrong:
      "A leaning pallet falls in transit, on the dock, or in the store. Product is damaged or destroyed. Someone could be injured. The selector's quality record is flagged. Delivery is delayed.",
    fixSteps: [
      "Interlock layers like bricks — each case overlaps two below it to lock the structure.",
      "Never stack in straight columns — columns collapse under movement.",
      "Fill each layer completely before starting the next to remove gaps.",
      "Keep the pallet wide and even — do not let one side grow taller.",
      "Stay under safe height (around 60 inches) — tall and narrow pallets fall.",
    ],
    coachingScript: `A falling pallet is a liability.

It hurts people.
It destroys product.
It holds up the dock.

Let me show you how it happens.

You stack fast.
You build straight up in columns.
You leave gaps in the layer.
You let one side grow taller than the other.

It looks fine for a moment.
Nothing stops you.

But during travel…
The weight shifts.
The gaps give way.
The columns have no support.

Now the pallet leans.
Now it falls.

Product is destroyed.
The dock stops.
Someone could get hurt.

That is a serious incident.

Now watch the right way.

You slow down for a few seconds.
You build like a bricklayer.

Each case overlaps two below it.
Each layer is filled before the next starts.
The load stays wide and even.

Now when the pallet moves…
It stays locked together.

No leaning.
No collapse.
No cleanup.

Remember this:

Five seconds of correct placement saves an hour of cleanup.`,
    scenario: {
      assignment: "Assignment 251740",
      location: "Aisle 23 · Mixed Load",
      issue: "Stacked in straight columns with gaps between layers",
      wrongFlow: [
        "Cases stacked in straight vertical columns",
        "Gaps left between layers",
        "Pallet leans during transit",
        "Collapse risk — injury danger, product loss, dock delay",
      ],
      correctFlow: [
        "Each case interlocked over two below it",
        "Every layer filled completely before starting next",
        "Even, wide and stable structure",
        "Pallet arrived intact — no incident, no cleanup",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Why should you stack cases interlocked like bricks?",
        options: [
          "It looks neater on the pallet",
          "It locks the structure together and prevents collapse",
          "It is faster to stack that way",
          "It reduces the case count",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Which build style creates the most collapse risk?",
        options: [
          "Wide interlocked layers",
          "Straight vertical columns with gaps",
          "Filled even layers built low",
          "Alternating brick patterns",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "A falling pallet in transit can result in:",
        options: [
          "Faster delivery — product is already on the floor",
          "No consequence — product is boxed",
          "Injury risk, product damage, dock delays, and quality flags",
          "A performance bonus for the dock team",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "slow-transitions",
    title: "Moving Too Slow Between Picks",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Speed is not picking faster — it is stopping less.",
    novaLine: "The moment NOVA says grab, you should already be moving.",
    novaIntro:
      "Welcome to Transition Speed coaching. Most selectors lose time between stops — not at the shelf. This session shows you where the seconds go and how to get them back. When you are ready, click Ready.",
    whyItHappens:
      "Slow transitions happen when a selector pauses after each pick, walks instead of moving with intent, or takes too long to reposition the pallet jack.",
    whatGoesWrong:
      "Rate falls over time. Small delays add up across many stops, causing large time loss and poor performance results.",
    fixSteps: [
      "The moment NOVA confirms 'grab', you should already be moving to the next position.",
      "Keep your pallet jack centered and reposition every 5–8 stops to reduce wasted movement.",
      "Pre-stage yourself at the next slot while NOVA is still speaking.",
      "Move at a consistent pace — steady forward motion, not sprinting or stopping.",
      "Check your pace every 10 stops and tighten transitions if you fall behind.",
    ],
    coachingScript: `The fastest selectors are not picking faster — they are stopping less.

Every pause between stops adds up.
At 50 stops, just 10 extra seconds each is over 8 minutes lost.

Let me show you how it happens.

You finish a pick…
You pause.
You look around.
You reposition slowly.

Nothing feels slow in the moment.

But those small pauses stack up.

Now your 90-minute assignment becomes 110 minutes.
Now your rate drops — and you cannot explain it.

It is not one big delay.
It is 50 small ones.

Now the right way.

You hear NOVA confirm.
You are already moving.
You are already thinking about the next slot.

Your pallet jack is positioned ahead.
Your body stays in motion.

No wasted steps.
No dead time.

Now your pace stays consistent.

Remember this:

Speed is not rushing the pick.
It is never stopping between picks.

Control your pace between stops.
That is where your rate lives.`,
    scenario: {
      assignment: "Assignment 251741",
      location: "Aisle 08 · 50-stop run",
      issue: "10-second pause between each stop — not rushing, just not moving",
      wrongFlow: [
        "Paused and looked around after every pick",
        "Repositioned pallet jack slowly each time",
        "50 stops × 10 sec = 8+ minutes lost",
        "Rate dropped — no single bad pick caused it",
      ],
      correctFlow: [
        "Moving before NOVA finished speaking",
        "Pallet jack pre-positioned every 5 stops",
        "Zero dead time between picks",
        "Consistent pace — rate stayed on target all shift",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Where do most selectors lose the most time during an assignment?",
        options: [
          "During the actual pick from the slot",
          "Between stops — in the transitions",
          "At the printer at the start",
          "During break",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "10 extra seconds per stop across 50 stops equals:",
        options: [
          "Nothing noticeable in your rate",
          "2 minutes lost",
          "Over 8 minutes lost",
          "30 seconds lost",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "What does pre-staging mean in the context of picking?",
        options: [
          "Stacking pallets before the shift starts",
          "Positioning your body toward the next stop while finishing the current one",
          "Counting your cases early at the slot",
          "Requesting a different assignment area",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "overthinking",
    title: "Overthinking Picks",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Confidence and accuracy work together — hesitation wastes time.",
    novaLine: "Code confirmed = grab. No second-guessing.",
    novaIntro:
      "Welcome to Overthinking coaching. Second-guessing yourself on every pick slows you down without improving accuracy. This session teaches you to trust your training. When you are ready, click Ready.",
    whyItHappens:
      "Overthinking happens when selectors do not trust their confirmation, double-check unnecessarily, or let anxiety slow their decisions.",
    whatGoesWrong:
      "Small hesitation adds seconds per stop, causing major time loss. The selector falls behind pace and becomes more anxious, creating a negative cycle.",
    fixSteps: [
      "Trust your check code — once confirmed, grab immediately.",
      "Build a repeatable routine and follow it every time.",
      "Use 'repeat' only when something is actually unclear, not from doubt.",
      "Accept small mistakes — do not let fear slow every pick.",
      "Set the rule: code confirmed = grab. No extra pause.",
    ],
    coachingScript: `Confidence and accuracy are not opposites.

Experienced selectors move fast because they trust their training.

Let me show you what overthinking looks like.

You hear: Aisle 17, slot 66, pick 4.

You confirm the code correctly.
But then you pause.
You look again.
You re-check the label.

You already know it's right…
but you don't trust it yet.

Now 3–5 seconds are lost.

It feels like you are being careful.
But you are actually slowing yourself down.

Now multiply that across 50 stops.

That is minutes lost.
That is your rate dropping.

Now watch the right way.

You hear the slot.
You confirm the code.

That is your signal.

You grab immediately.

No pause.
No second read.
No hesitation.

Here is a real shift example.

Overthinking selector:
Confirms → pauses → re-checks → grabs.
5 seconds lost × 50 stops = over 4 minutes gone.

Confident selector:
Confirms → grabs immediately.
Zero delay.

That is the difference in performance.

Remember this:

Hesitation is not caution.
It is wasted time dressed up as caution.

Trust your process.
Move with confidence.

Confidence builds speed.
Speed builds performance.`,
    scenario: {
      assignment: "Assignment 251742",
      location: "Aisle 17 · Slot 66",
      issue: "Confirmed code then re-read label — 4 extra seconds per stop",
      wrongFlow: [
        "Confirmed code → paused → re-checked → grabbed",
        "5 seconds lost per stop",
        "50 stops = 4+ minutes of wasted time",
        "Rate fell with zero mispicks — lost to hesitation only",
      ],
      correctFlow: [
        "Confirmed code → grabbed immediately",
        "No re-read after successful confirmation",
        "50 stops × zero delay",
        "Rate stayed clean and consistent throughout",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "After confirming the check code, you should:",
        options: [
          "Re-check the label one more time just to be safe",
          "Grab immediately without second-guessing",
          "Pause and examine the product visually",
          "Count to three then grab",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What is hesitation in picking really costing you?",
        options: [
          "Accuracy — it makes you more precise",
          "Time — seconds that add up across all stops",
          "Safety — slowing down protects you",
          "Strength — it reduces wear on the body",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "When should you say 'repeat' to NOVA?",
        options: [
          "Every stop to be absolutely safe",
          "Only when something is genuinely unclear or wrong",
          "Never — always guess if unsure",
          "After every third pick as a routine",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "not-preparing",
    title: "Not Preparing the Next Move",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Top selectors are already moving before NOVA finishes speaking.",
    novaLine: "While NOVA talks, you move. Anticipate — don't react.",
    novaIntro:
      "Welcome to Pre-Staging coaching. Top selectors are always one step ahead of NOVA. This session teaches you to prepare your next move before you finish the current one. When you are ready, click Ready.",
    whyItHappens:
      "Selectors wait for NOVA to finish speaking, stand flat-footed while listening, and treat each stop as separate instead of a continuous flow.",
    whatGoesWrong:
      "There is always a gap between instruction and movement. The selector is reacting instead of anticipating, losing seconds at every stop and falling behind pace.",
    fixSteps: [
      "While NOVA speaks, turn your body toward the next likely slot.",
      "Know your aisle direction and pre-shift your weight that way.",
      "Finish placing the current case as NOVA begins the next prompt.",
      "Keep your eyes scanning forward while your hands finish the task.",
      "Treat picking as a rhythm — continuous motion, no dead time.",
    ],
    coachingScript: `The best selectors are never surprised by NOVA.

They know the direction. They know roughly where the next slot is.
By the time NOVA says the aisle, they are already moving.

Let me show you the difference.

Reactive selector:
NOVA: "Aisle 18… slot 112…"
Selector: stands still… listens… then starts moving.

That is a 2–4 second delay.
Do that 50 times…
That is 2–3 minutes lost — without a single big mistake.

It feels small. It isn't.
It is constant delay.

Now the right way.

Anticipating selector:
While finishing the current case, eyes are already forward.
Body is already turned toward the next slot.
Pallet jack is already positioned.

NOVA starts speaking… you are already moving.

No gap between instruction and motion.
Just flow.

Real example:

Reactive selector:
Finish case → stop → listen → think → move.
3 sec × 50 stops = 150 seconds = 2.5 minutes lost.

Pre-staged selector:
Finish case while listening → move immediately.
Zero delay.

That is the difference between 85% and 100%.

Remember this:

Picking is a rhythm, not a series of stops.
If you wait, you fall behind.
If you anticipate, you stay ahead.

Pre-stage your body.
Pre-stage your eyes.
Pre-stage your next move.

Flow creates speed.
Speed creates performance.`,
    scenario: {
      assignment: "Assignment 251743",
      location: "Aisle 12 · 45-stop run",
      issue: "Stood still and waited for every full NOVA instruction before moving",
      wrongFlow: [
        "Waited for NOVA to finish → then started moving",
        "2–4 second delay per stop",
        "50 stops × 3 sec = 2.5 minutes lost",
        "Constant reaction mode — never ahead of NOVA",
      ],
      correctFlow: [
        "Body already turning as NOVA spoke the aisle",
        "Eyes forward before current pick was done",
        "Zero gap between instruction and motion",
        "Smooth rhythm — rate stayed on target all shift",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When should you start moving toward the next slot?",
        options: [
          "After NOVA finishes the full instruction completely",
          "While NOVA is still speaking the aisle number",
          "After placing the current case fully on the pallet",
          "Only when you can physically see the next slot",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What separates an 85% selector from a 100% selector most often?",
        options: [
          "Raw picking speed at the shelf",
          "Pre-staging and anticipation habits between stops",
          "Luck with the assignment route",
          "The model of pallet jack assigned",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Picking should feel like:",
        options: [
          "A series of separate stops with rest between each",
          "A continuous rhythm where you are always in motion",
          "A sprint between long rest periods",
          "A random sequence with no pattern",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "ergonomics",
    title: "Ignoring Ergonomics",
    riskLevel: "high",
    category: "Safety & Health",
    heroLine: "Your body is your tool — protect it or lose it.",
    novaLine: "Bend your knees. Protect your back. This job is long-term, not one shift.",
    novaIntro:
      "Welcome to Ergonomics coaching. Poor body mechanics lead to injuries that end careers early. This session covers the physical habits that protect your body long-term. When you are ready, click Ready.",
    whyItHappens:
      "Selectors ignore ergonomics when they rush, prioritize speed over body position, or were never trained on proper lifting mechanics.",
    whatGoesWrong:
      "Back injuries, knee strain, shoulder pain, and long-term physical breakdown. Performance drops and many selectors cannot continue the job.",
    fixSteps: [
      "Bend your knees on every lift — even small cases matter over time.",
      "Keep your back straight and your core engaged when lifting low items.",
      "For high slots, use your legs to elevate — do not overreach with your back.",
      "Reset your posture regularly — do not stay in bad positions for multiple stops.",
      "Stretch your lower back, knees, and shoulders before and after every shift.",
    ],
    coachingScript: `Your body is your tool.

Every selector who ignored ergonomics and thought they were too young or too tough to get hurt eventually learned otherwise.

Usually not the first day.
Not the second.

It hits on day three… or four… of a heavy week.

Let me show you how it happens.

You rush.
You bend with your back instead of your knees.
You reach instead of positioning your body.

Nothing happens right away.

So you keep doing it.

Then your lower back gets tight.
Then your knees feel it.
Then your shoulders start hurting.

Now your movement slows down.
Now your energy drops.

Now the job feels harder than it should.

And if you keep going like that…

You don't just lose pace.

You lose the job.

Many selectors don't leave because they want to.
They leave because their body gives out.

Now watch the right way.

You slow down for one second.

You bend your knees.
You keep your back straight.
You position your body before you lift.

Now your movement is controlled.
Now your body stays strong.

Now you can do this job for years — not months.

Remember this:

This job can last a decade…
or it can last a year.

Ergonomics is the difference.

Protect your body.
Because once it breaks…
no amount of speed matters.`,
    scenario: {
      assignment: "Assignment 251744",
      location: "Aisle 05 · Low slots",
      issue: "Bending with back on every pick — 80+ lifts in one assignment",
      wrongFlow: [
        "Bent back instead of knees — every low slot",
        "Twisted to reach high slots without repositioning",
        "Strain built across 80+ repetitions",
        "Pain → slower movement → injury risk by week 3",
      ],
      correctFlow: [
        "Bent knees on every lift — even small cases",
        "Kept back straight and core engaged",
        "Repositioned body before each high or low lift",
        "No strain — body held up strong through full shift",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When lifting a case from a low slot, you should:",
        options: [
          "Bend your back to reach it quickly",
          "Bend your knees and keep your back straight",
          "Lean sideways to grab it",
          "Reach with one arm extended",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Poor ergonomics over many shifts leads to:",
        options: [
          "Better pace from conditioning",
          "Long-term injury that shortens careers",
          "More strength built over time",
          "No lasting effect if you are young",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "When should you stretch for picking shifts?",
        options: [
          "Never — it wastes shift time",
          "Once a week after a particularly hard shift",
          "Before and after every shift",
          "Only when you feel pain starting",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "skipping-breaks",
    title: "Skipping Breaks and Hydration",
    riskLevel: "high",
    category: "Safety & Health",
    heroLine: "Breaks are not lost time — they are investment in the rest of your shift.",
    novaLine: "Eat. Drink. Reset. Your second half depends on your break.",
    novaIntro:
      "Welcome to Break and Hydration coaching. Skipping breaks to boost your rate is one of the most counterproductive things a selector can do. This session explains why. When you are ready, click Ready.",
    whyItHappens:
      "Selectors skip breaks because they are trying to make up lost time or believe pushing through will help their rate. Short-term thinking leads to long-term performance loss.",
    whatGoesWrong:
      "Energy drops sharply in hours 5–8. Dehydration impairs focus and increases injury risk. Selectors who skip breaks are more likely to mispick, move slower, and get injured. The rate improvement from skipping a break is lost within two hours.",
    fixSteps: [
      "Take every scheduled break — even if you feel good. Especially if you feel good.",
      "Eat your break meal. A selector who doesn't eat crashes at hour 6.",
      "Drink water at every break. Do not wait until you are thirsty.",
      "Use your break to walk slowly — it keeps your legs loose and ready.",
      "Do not check your rate numbers on break. Use the time to reset mentally.",
    ],
    coachingScript: `Breaks are not lost time.

They are investment in the rest of your shift.

Let me show you what skipping a break really costs.

You are behind on pace.
You decide to skip break to catch up.

At hour 3 — you feel fine.
At hour 5 — your legs are heavy.
At hour 6 — your focus is slipping.
At hour 7 — your accuracy drops.
At hour 8 — you are barely moving.

The rate you gained by skipping break?
Gone.
And then some.

Now the selector who took their break:

At hour 3 — they ate, drank water, walked slowly.
At hour 5 — they are at 92%.
At hour 7 — still at 88%.
At hour 8 — they finished consistent.

The break selector picks better in hours 5 through 8.
The skip selector crashes exactly when the shift gets hardest.

Breaks are not lost time.
They are fuel for the second half.

Remember this:

The selector who eats at break and drinks water
is picking at 93% at hour seven.

The selector who skips breaks
is picking at 72% and getting worse.

Protect your second half.
Take your break.`,
    scenario: {
      assignment: "Assignment 251745",
      location: "Hour 5 of shift",
      issue: "Selector skipped break to make up pace — fell harder in hours 6–8",
      wrongFlow: [
        "Skipped break — stayed on floor to catch up",
        "Energy dropped sharply at hour 5",
        "Focus reduced — mispick risk spiked",
        "Rate fell to 72% in hours 6–8 anyway",
      ],
      correctFlow: [
        "Took full break — ate, drank water, walked lightly",
        "Body reset at halftime",
        "Energy and focus stayed consistent",
        "Rate held at 91% through the full shift",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Should you skip your break if you are behind on pace?",
        options: [
          "Yes — every minute on the floor counts",
          "No — breaks protect your performance in the second half",
          "Only if you are more than 10% behind",
          "Ask your supervisor first",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What does skipping a break usually result in?",
        options: [
          "Higher rate for the entire shift",
          "Improved accuracy from staying focused",
          "A fatigue crash in hours 5–8 that cancels the gained time",
          "Better pallet quality",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "During your break you should:",
        options: [
          "Check your rate numbers repeatedly and plan strategy",
          "Eat, drink water, and walk lightly to reset mind and body",
          "Push through and keep working quietly",
          "Sit completely still to conserve energy",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "pallet-jack",
    title: "Poor Pallet Jack Handling",
    riskLevel: "high",
    category: "Safety & Skills",
    heroLine: "Your pallet jack weighs hundreds of pounds — control it or it controls you.",
    novaLine: "Control the handle. Slow at intersections. Center in the aisle. Always.",
    novaIntro:
      "Welcome to Pallet Jack coaching. A pallet jack is the selector's primary tool. Handling it poorly causes accidents, slow transitions, and damaged product. When you are ready, click Ready.",
    whyItHappens:
      "Poor pallet jack habits come from insufficient training, rushing, or assuming that experience alone is enough without proper technique.",
    whatGoesWrong:
      "Runaway pallet jacks cause collisions with shelving, forklifts, and other selectors. Poor placement slows down every stop. Product falls off poorly controlled jacks. Workers get hurt.",
    fixSteps: [
      "Never let the jack roll free — always maintain control of the handle.",
      "Position the jack in the center of the aisle before starting each stop sequence.",
      "When stopping on a slope or dock, engage the handle fully to lock the position.",
      "Never stand on the forks or the pallet while moving.",
      "Slow down at aisle intersections — always. Even if you've been through that intersection a hundred times.",
    ],
    coachingScript: `The pallet jack weighs hundreds of pounds loaded.

It does not stop on its own.
It does not care that you were in a hurry.

Let me show you what poor control looks like.

You are moving fast through the aisle.
You approach an intersection.

You don't slow down — you've done this a hundred times.

The jack drifts wide.
It clips the shelving.

Cases fall.
The dock stops.
A safety report is filed.

Everything you gained in speed
is gone — and then some.

Now the right way.

At every intersection, you slow.
Every time. No exceptions.

You keep the handle in your hand.
You keep the jack centered in the aisle.

When you stop, you engage the handle.
The jack stays where you put it.

No runaway.
No incident.
No report.

Every selector who has had a jack-related incident
was doing something they knew they should not do.

Control your jack.
Slow at intersections.
Center in the aisle.

Always.`,
    scenario: {
      assignment: "Assignment 251746",
      location: "Intersection of Aisles 14 and 20",
      issue: "Jack released at corner — drifted and clipped shelving",
      wrongFlow: [
        "Let jack roll free at the corner",
        "Jack drifted and hit the shelving",
        "Product fell — dock stopped",
        "Safety incident report filed",
      ],
      correctFlow: [
        "Maintained handle control throughout",
        "Slowed deliberately at intersection",
        "Jack stayed centered in the aisle",
        "Clean pass — no incident, no delay",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When should you slow down at aisle intersections?",
        options: [
          "Only on busy days when forklift traffic is high",
          "Every single time — no exceptions",
          "When you see someone coming toward you",
          "Only in the freezer or cooler zones",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What is the most dangerous pallet jack mistake?",
        options: [
          "Moving too slowly in open aisles",
          "Letting the jack roll free without handle control",
          "Keeping it centered in the aisle",
          "Stopping to reposition it often",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Should you ever stand on the forks or pallet while moving?",
        options: [
          "Yes — if you are going a short distance only",
          "No — never for any reason",
          "Yes — if you need to see over tall product",
          "Only with a spotter walking beside you",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "speed-only",
    title: "Focusing Only on Speed",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Rate is not just speed — it is speed plus accuracy plus quality.",
    novaLine: "Build right habits first. Speed follows habits.",
    novaIntro:
      "Welcome to Balanced Performance coaching. Chasing speed at the cost of accuracy, safety, and pallet quality is a mistake that top selectors never make. When you are ready, click Ready.",
    whyItHappens:
      "New selectors hear 'hit your rate' and interpret it as 'go fast'. Speed becomes the only goal. Accuracy, safety, and pallet quality are treated as secondary.",
    whatGoesWrong:
      "Mispicks spike. Pallets are built badly. Safety steps are skipped. The selector's rate looks good on paper but their error rate and quality scores cancel the gains. Correction takes longer than the speed savings produced.",
    fixSteps: [
      "Think rate as a combination score — speed + accuracy + quality.",
      "A selector at 95% rate with 99% accuracy is more valuable than 105% with 94% accuracy.",
      "Every mispick or quality error costs time to correct — often more time than was saved by rushing.",
      "Your goal is to be reliably fast, not occasionally fast.",
      "Build the right habits first. Speed follows habits.",
    ],
    coachingScript: `The best selectors in this facility are not the reckless ones.

They are the disciplined ones.

Let me show you what speed-only looks like.

A selector hits 105% rate.
Impressive.

But they have 6 mispicks.
And 2 pallet quality flags.

Each mispick triggers a correction.
Each correction takes 5–10 minutes.

Now do the math.

6 mispicks × 5 minutes = 30 minutes of correction time.

The rate gain from 105% vs 95%?
About 8 minutes on a full shift.

They went faster — and lost 22 extra minutes correcting mistakes.

That is not performance.
That is expensive speed.

Now the disciplined selector.

97% rate.
Zero mispicks.
All pallets passed quality.

No corrections.
No cleanup.
No reports.

Net time advantage — significantly better.

The best selectors know their route.
They confirm their codes.
They build their pallets right.

And they do all of it at a fast pace
because the habits are locked in.

Speed without discipline has a ceiling.
Discipline without speed is a starting point.

Build both.`,
    scenario: {
      assignment: "Assignment 251747",
      location: "Full 8-hour shift",
      issue: "105% rate — but 6 mispicks and 2 pallet quality flags on the same shift",
      wrongFlow: [
        "Chased rate number above everything",
        "6 mispicks = 6 accuracy hits + correction time",
        "2 pallet quality flags = 2 damage notations",
        "Overall performance score fell below threshold",
      ],
      correctFlow: [
        "Held 97% rate with disciplined habits",
        "Zero mispicks — clean accuracy record",
        "All pallets passed quality check",
        "Performance score: strong across all three categories",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "A selector at 105% rate with 6 mispicks is considered:",
        options: [
          "A top performer — rate is what matters",
          "A liability — errors cost more time than the speed gains",
          "Average performance",
          "A model to follow for motivation",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What is the correct way to define strong picking performance?",
        options: [
          "Hitting rate number at any cost",
          "Speed combined with accuracy and pallet quality",
          "Rate alone — the other metrics are secondary",
          "Pallet case count only",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Errors made at high speed result in:",
        options: [
          "Better overall scores from the rate gain",
          "Corrections that often take longer than the speed saved",
          "No consequence if you catch them yourself",
          "Praise from supervisors for effort",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "layout",
    title: "Not Learning the Layout",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "NOVA gives the address — you must know the city.",
    novaLine: "Know your aisles. Know your product. Move with confidence.",
    novaIntro:
      "Welcome to Layout Knowledge coaching. Selectors who know their facility move faster — not because they are faster, but because they waste zero time on confusion. When you are ready, click Ready.",
    whyItHappens:
      "Selectors rely only on NOVA directions and never take time to learn the warehouse layout or product zones.",
    whatGoesWrong:
      "Selectors hesitate at aisle transitions, take wrong turns, and lose time searching for slots. They cannot pre-stage or build efficiently.",
    fixSteps: [
      "Walk the facility before or after shifts to learn aisle layout.",
      "Memorize aisle direction and numbering system.",
      "Learn what type of product is in each aisle.",
      "Know key locations like doors, printers, and zones without thinking.",
      "After 30 days, aim to move through the warehouse without hesitation.",
    ],
    coachingScript: `NOVA gives you the address.
But you have to know the city.

Let me show you what that means.

You hear: Aisle 18… slot 112.

But you don't really know aisle 18.
You don't know what's in that aisle.
You don't know which direction it runs.

So what happens?

You slow down.
You look around.
You search for the slot.

Now you lose time.

Now imagine that all shift.

Every aisle… every transition… every turn…
You are reacting instead of moving with confidence.

Now your pace drops.
Not because you are slow.
But because you don't know where you are going.

Now watch the right way.

You hear: Aisle 18.

Before NOVA even finishes…
You already know where it is.
You know what direction to go.
You know what type of product is there.

Now you move immediately.

No searching.
No hesitation.
No confusion.

When you know your aisles…
You also know the product.

You know the heavy zones, the small case zones, the fragile zones.

Now you can prepare your pallet BEFORE you get there.

That makes you faster.
That makes you cleaner.
That makes you more accurate.

Remember this:

If you don't know the floor…
You will always feel slow.

If you learn the floor…
You move with confidence.

Learn your aisles.
Learn what is in them.

It pays every pick.`,
    scenario: {
      assignment: "Assignment 251748",
      location: "Aisle 18 · Slot 112",
      issue: "Heard aisle 18 — stopped and looked around for 6 seconds before moving",
      wrongFlow: [
        "Heard aisle 18 → stopped → looked around",
        "3–6 seconds lost locating the direction",
        "50 stops × 4 sec = 3+ minutes lost navigating",
        "Rate dropped — not from slow picking, from slow navigation",
      ],
      correctFlow: [
        "Heard aisle 18 → already moving that direction",
        "Knew the aisle, knew the product zone",
        "Pre-staged at next slot before NOVA finished speaking",
        "Zero hesitation — rate held all shift",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "NOVA gives you an aisle number. What should happen before NOVA finishes speaking?",
        options: [
          "Write the aisle number down first",
          "Stand still and wait for the full slot address",
          "Already be moving in that direction",
          "Ask a coworker where the aisle is",
        ],
        correctIndex: 2,
      },
      {
        id: "q2",
        question: "Knowing your warehouse layout helps you:",
        options: [
          "Pick more cases per individual slot",
          "Pre-stage movements and eliminate hesitation at every transition",
          "Change your assignment route",
          "Work a shorter shift",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "How long should deliberate practice take to learn your facility well?",
        options: [
          "6 months minimum before it clicks",
          "About 30 days of walking the floor and paying attention",
          "You never need to — NOVA handles all navigation",
          "At least a full year on the same route",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "giving-up",
    title: "Giving Up Too Early",
    riskLevel: "medium",
    category: "Mindset",
    heroLine: "The job gets easier — but only if you stay long enough to see it.",
    novaLine: "Week two is hard. Week four is different. Stay through it.",
    novaIntro:
      "Welcome to Resilience coaching. Most selectors who quit do so in the first three weeks — right before the skill curve breaks in their favor. When you are ready, click Ready.",
    whyItHappens:
      "The job is physically and mentally harder than expected in weeks one and two. Rate feels impossible. The body is not adapted yet. Selectors compare themselves to veterans and feel like they can never catch up.",
    whatGoesWrong:
      "The selector quits right before the learning curve turns in their favor. Selectors who make it to week four almost universally report that it got dramatically easier. Those who quit in week two never find that out.",
    fixSteps: [
      "Measure your progress by comparing yourself to your own week one, not to a veteran.",
      "Rate improvement is not linear — it jumps. Commit through the flat periods.",
      "Talk to your trainer when you are struggling. You are not the first person to feel this way.",
      "Set a 30-day commitment. Reserve judgment until day 30.",
      "Track one small improvement per shift. Not rate — one habit that got better.",
    ],
    coachingScript: `Every top selector in this facility had a week two.

Every one of them thought about quitting.

The ones you see hitting 110% consistently
are not naturally gifted.

They are the ones who stayed.

Let me show you what the curve looks like.

Week one: Everything is new. Rate is low. Body is sore.
Week two: The hardest week. Most people quit here.
Week three: Your body starts to adapt.
Week four: The route starts to lock in.
Week six: The job stops feeling hard.

The selector who quits at day 11
never sees day 30.

And day 30 is when everything changes.

Now here is the mindset shift.

Stop comparing yourself to veterans.
Start comparing yourself to your own week one.

Are you faster? Yes.
Are you more confident? Yes.
Is your body handling it better? Yes.

That is growth.

Small wins.
Every shift.

If you hit 70% today, tell yourself:
Tomorrow I hit 75%.
Then 80%.

Small gains. Every shift.

That is how the job becomes natural.

Control your mindset.
Control your pace.
And your performance will follow.

Remember this:

The job gets easier.
But only if you stay long enough to see it.`,
    scenario: {
      assignment: "30-Day Journey",
      location: "Week 2 · Day 11",
      issue: "Selector considering quitting — rate at 72%, body sore, comparing to veterans",
      wrongFlow: [
        "Quit at day 11",
        "Never experienced the week 4 breakthrough",
        "Body was just starting to adapt when they left",
        "Missed the inflection point that changes everything",
      ],
      correctFlow: [
        "Stayed through the hard week 2",
        "Body adapted in week 3",
        "Rate jumped noticeably in week 4",
        "By day 45 — consistently hitting 95%+",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When do most selectors quit relative to the learning curve?",
        options: [
          "After they hit a permanent performance ceiling",
          "Right before it gets easier — in weeks 1 through 3",
          "After months of consistent 100% performance",
          "On their very first day",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Rate improvement during the first 30 days is best described as:",
        options: [
          "Steady and linear — a little better each day",
          "Jumpy — flat periods followed by sudden noticeable gains",
          "Consistent decline before it gets better",
          "Random with no predictable pattern",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "What is the most productive mindset during a hard week?",
        options: [
          "Compare yourself to veteran selectors for motivation",
          "Track one small habit improvement per shift — not just rate",
          "Focus only on the rate number each day",
          "Decide whether you want to continue or not",
        ],
        correctIndex: 1,
      },
    ],
  },
];

export function getMistakeById(id: string): MistakeData | undefined {
  return MISTAKES.find(m => m.id === id);
}
