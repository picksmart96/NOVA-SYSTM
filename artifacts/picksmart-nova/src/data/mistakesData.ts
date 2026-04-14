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
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: "mispick",
    title: "Mispick — Wrong Item",
    riskLevel: "critical",
    category: "Accuracy",
    heroLine: "The selector who never mispicks is not fast — they are disciplined.",
    novaLine: "Confirm before you grab. Read before you reach.",
    novaIntro:
      "Welcome to Mispick coaching. A mispick means you picked the wrong product from a slot. It is the number-one selector accuracy error and the most costly mistake in the warehouse. Every mispick triggers a store receiving issue, an accuracy penalty, and potential disciplinary review. When you are ready, click Ready.",
    whyItHappens:
      "Mispicks almost always happen for one of three reasons. First, a selector rushes past visually similar products — two items that look nearly identical sit next to each other, and the hand reaches before the eyes confirm. Second, a selector skips the check code confirmation — they hear the aisle and slot, move to the slot, and grab based on familiarity instead of verification. Third, a selector picks by muscle memory — they have been to that slot a hundred times, they know what's usually there, so they grab without reading. This habit-based picking is the most dangerous type because it feels completely normal and safe right up until the wrong item ships.",
    whatGoesWrong:
      "The wrong item ships to a store. The store's receiving team opens the pallet and finds a product that does not match the order. They flag the discrepancy and file a receiving error report. The store cannot put the product on the shelf — it goes into a holding area. A correction order must be created, and the right product must be re-picked and re-shipped, costing the company double the labor and transport cost. The selector's accuracy score is docked for every single mispick event. Repeated mispicks trigger a coaching conversation, then a formal warning, then disciplinary review. High-accuracy selectors are trusted with harder assignments and considered for advancement. Low-accuracy selectors are the first affected when hours are cut.",
    fixSteps: [
      "Always read the FULL slot label before your hand moves — not the first word, not the first line. Every word on the label, every time.",
      "Say the check code OUT LOUD before you grab. Hearing your own voice confirm the code forces your brain to actually register the information instead of skimming past it.",
      "If the product looks even slightly different from what you expected — different color, different label layout, different size — STOP. Re-read. Do not grab until it makes sense.",
      "Never pick by memory. It does not matter if you have picked that slot 500 times. The slot contents change. The merchandise changes. Treat every stop as if it's the first time you've seen it.",
      "When two products look nearly identical, read the last three digits of the check code — that is usually where they differ. Train your eyes to go straight there.",
      "If NOVA's instruction seems off — wrong aisle, unexpected slot number — say 'repeat' and re-listen. Never assume NOVA made an error and then pick the wrong item anyway.",
      "After your shift, if you made a mispick, go back mentally and identify the exact moment you stopped reading. That moment is the habit you need to fix.",
    ],
    coachingScript: `The selector who never mispicks is not fast — they are disciplined.

Let me show you exactly how a mispick happens so you can recognize it before it costs you.

It is Tuesday. You are on your third assignment of the shift.
You are moving well. Rate is good. You feel confident.

You hear NOVA say: Aisle 14, slot 42.

You have picked slot 42 in aisle 14 dozens of times.
You know what's there. Cranberry juice, 64-ounce.

So you move toward the slot.
You glance at the label.
You see "cranberry" and your brain says: correct.
You grab and move.

But today — there are TWO cranberry products in that aisle.
The one you grabbed is 32-ounce.
NOVA called for 64-ounce.

The check code was different. But you didn't say it out loud.
You just moved.

Now the wrong item ships to the store.
The store receives incorrect inventory.
Receiving flags the order.
The correction process starts.

Your accuracy score drops.
The correction takes 15 minutes of someone else's labor.

And it all started with one moment of trusting memory over confirmation.

Now let me show you the right way.

You hear NOVA say: Aisle 14, slot 42.

You move toward the slot.
You read the FULL label — not just the first word.
You see two cranberry products side by side.
You look at the check code on your headset screen.
You say the code OUT LOUD.

NOVA confirms.

Now you grab the correct one.

That two-second process — full label read, code spoken aloud — is the difference between clean accuracy and a costly correction.

Here is a real example that selectors often miss:

Two products. Same color packaging. Same aisle. Same general label design.
One is 12-count. One is 18-count.
From three feet away, they are nearly identical.

A habit-picker grabs the first one they see.
A disciplined selector reads the full description, speaks the code, and grabs the correct one.

The difference is not intelligence.
It is process.

Build the process. Follow it every stop.

Remember this:

Discipline is what makes a selector great.
Speed comes AFTER discipline.
Never before it.

Your check code is your accuracy guarantee.
Use it. Every single time.`,
    scenario: {
      assignment: "Assignment 251735",
      location: "Aisle 14 · Slot 42",
      issue: "Two cranberry juice SKUs side by side — grabbed 32oz instead of called 64oz by habit",
      wrongFlow: [
        "Recognized 'cranberry juice' visually and grabbed by habit",
        "Did not read the full label — missed the size difference",
        "Did not say check code aloud — skipped confirmation",
        "Wrong SKU shipped to store — 32oz instead of 64oz",
        "Store receiving flags discrepancy — correction order created",
        "Selector accuracy score docked — coaching review triggered",
      ],
      correctFlow: [
        "Moved to slot — read the FULL label including size",
        "Noticed two cranberry products — checked code carefully",
        "Said check code OUT LOUD — NOVA confirmed match",
        "Grabbed the correct 64oz product",
        "Store received correct inventory — no correction needed",
        "Clean accuracy record — no penalty",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "What is the single most effective step to prevent a mispick at the slot?",
        options: [
          "Move faster to reduce time spent at each slot",
          "Say the check code out loud and confirm before grabbing",
          "Pick based on your memory of what's normally in that slot",
          "Count the cases on the pallet instead",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "A slot looks very familiar — you've picked it dozens of times. What should you do?",
        options: [
          "Grab quickly based on memory to save time",
          "Read the full label and confirm the check code every time",
          "Skip the confirmation since you know the slot",
          "Estimate by looking at the product color",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Two products look almost identical side by side. What's the best way to tell them apart?",
        options: [
          "Grab the one on the left — it's usually the correct one",
          "Read the last three digits of the check code — that's where they usually differ",
          "Pick both and sort it out at the pallet",
          "Ask a nearby selector which one NOVA usually calls",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "One mispick event typically results in:",
        options: [
          "No real consequence — the store adjusts inventory",
          "A small internal note that disappears after 30 days",
          "An accuracy score hit, a store receiving flag, and a correction order",
          "A faster pace requirement for the next assignment",
        ],
        correctIndex: 2,
      },
      {
        id: "q5",
        question: "Why is picking by muscle memory dangerous?",
        options: [
          "It is not dangerous — experienced selectors always pick by memory",
          "Because slot contents change, and memory-based picking skips the verification that catches those changes",
          "Because it makes you move too slowly between stops",
          "Because NOVA will mark you down for not speaking the code",
        ],
        correctIndex: 1,
      },
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: "short-pick",
    title: "Short Pick — Missing Quantity",
    riskLevel: "high",
    category: "Accuracy",
    heroLine: "One missing case is an accuracy error — count every case you place.",
    novaLine: "Count aloud. Touch each case. Stop at the number NOVA gave you.",
    novaIntro:
      "Welcome to Short Pick coaching. A short pick means you grabbed fewer cases than NOVA requested. Even being one case short causes a receiving discrepancy at the store. This mistake is especially sneaky because nothing stops you at the time — the system keeps moving and the error shows up later when the store receives the order. When you are ready, click Ready.",
    whyItHappens:
      "Short picks happen in three common situations. First, the selector misheard the quantity — the floor is loud, NOVA said six but the selector heard five, and they never asked for a repeat. Second, the selector counted too fast — they counted visually while stacking instead of counting by touch, and a case blended in with another. Third, a distraction broke the count mid-grab — a coworker passed by, a forklift beeped, or the pallet shifted, and the selector lost track and guessed to finish. Any of these can cause a short pick, and the result is always the same: the store gets shorted and your accuracy score takes the hit.",
    whatGoesWrong:
      "The store receives fewer units than ordered. Shelves run out faster than expected and cannot be restocked on the normal cycle. The receiving team flags the discrepancy and files an incomplete order report. The selector's accuracy score is docked for every short pick event — it carries the same weight as a mispick on your record. If short picks happen across multiple assignments on the same shift, the total accuracy impact can be significant enough to trigger a supervisor coaching conversation. Stores track these patterns over time and warehouse managers receive reports on accuracy by selector.",
    fixSteps: [
      "Count aloud — not in your head, OUT LOUD — as each case lands on the pallet. 'One… two… three…' The sound forces you to stay engaged and prevents skipping.",
      "Count by TOUCH, not by sight. Place each case and let your hand physically land on it as you count. Visual counting from a distance is unreliable.",
      "Before you say 'ready,' look at the pallet and confirm the count is physically there. If NOVA said four, count four cases with your eyes one more time.",
      "If it was loud and you are not 100% certain of the quantity, say 'repeat' immediately. Do not guess. It takes two seconds to confirm — it takes 15 minutes to correct a short pick.",
      "For large quantities (eight or more), break into groups of four. Count four, note it mentally, then count the next four. This prevents losing track mid-count on big stops.",
      "If the slot is running low and there are not enough cases to complete the quantity, do NOT shortfill and move on — contact your supervisor. Partial fills need to be documented.",
      "After every stop, briefly check the cases you just placed before repositioning. A two-second visual confirmation is all it takes.",
    ],
    coachingScript: `Short picks are the quietest mistakes in the warehouse.

NOVA keeps moving.
You keep moving.
Nobody stops you.
Nothing beeps.
Nothing alerts you.

But the store gets shorted — and you get flagged.

Let me show you exactly how it happens.

You are in aisle 11. Good pace. You feel locked in.

NOVA says: pick six.

But the floor is loud right now.
A forklift is beeping on the other side of the warehouse.
You think you heard five.
You're pretty sure it was five.

You place five cases.

"Ready."

NOVA confirms and moves on.

Nothing happens.
You finish the assignment.
Everything feels fine.

But three days later…

The store receives five cases when the order called for six.
The shelf runs short two days early.
The receiving team files a discrepancy.
Your name is attached to that assignment.

Your accuracy score takes a hit.

And you did not even know you shorted them.

That is what makes short picks dangerous.
The feedback is delayed.
The consequence feels disconnected from the action.

Now let me show you the right way.

NOVA says: pick six.

It was loud. You are not 100% sure.

You say: repeat.

NOVA says: pick six.

Now you know. Six.

You count ALOUD as each case lands.

"One… two… three… four… five… six."

Your hand touches each case as you count.

Six cases are physically on the pallet.

You look at them once more.

"Ready."

That is it. That is all it takes.

Here is a real example to make this stick:

A selector on a Tuesday night shift worked 60 stops.
On three of those stops, they shorted by one case each.
Three cases. Barely noticeable in the moment.

But the store received three incomplete items.
Three receiving flags.
Three accuracy hits.

That selector's weekly accuracy rate dropped by 4.2%.

Not from big mistakes.
From three quiet one-case shorts across 60 stops.

Small mistakes multiply across hundreds of stops.

Remember this:

Count every case.
Count aloud.
Count by touch.
If you are not sure of the number — repeat before you pick.

One missing case per stop across ten assignments is a real accuracy problem.
It just does not feel that way in the moment.`,
    scenario: {
      assignment: "Assignment 251736",
      location: "Aisle 11 · Slot 77",
      issue: "Floor noise caused selector to hear 'five' instead of 'six' — never requested repeat",
      wrongFlow: [
        "NOVA said pick 6 — floor noise created confusion",
        "Selector did not say repeat — guessed 'five'",
        "Counted visually from a distance, not by touch",
        "Placed 5 cases and said ready",
        "Store received one case short on the order",
        "Receiving flag filed — accuracy score docked",
      ],
      correctFlow: [
        "Uncertain of quantity in noise — said 'repeat' immediately",
        "NOVA confirmed: pick six",
        "Counted aloud touching each case: one, two, three, four, five, six",
        "Confirmed six cases on pallet before saying ready",
        "Store received complete order — no discrepancy",
        "Clean accuracy record maintained",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "What is the most reliable way to count cases during picking?",
        options: [
          "Count visually by looking at them from the slot",
          "Count aloud while touching each case as it lands on the pallet",
          "Estimate based on how full the slot looks",
          "Count once at the end after all cases are placed",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "NOVA says pick 4 but the floor was loud and you are not certain. You should:",
        options: [
          "Guess and grab what sounds right",
          "Say repeat and confirm the quantity before picking",
          "Pick 5 to be safe — extra is better than short",
          "Skip the stop and come back after",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "A short pick carries the same accuracy consequence as:",
        options: [
          "A perfect pick — no difference on your record",
          "A mispick — both are logged accuracy errors",
          "A verbal warning only",
          "A speed bonus stop for efficiency",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "For a large quantity like 10 cases, the best counting strategy is:",
        options: [
          "Count all ten in one fast sweep",
          "Break into groups of four — count four, pause, count the next four",
          "Estimate by weight — you can feel if ten cases are there",
          "Ask a coworker to double-check behind you",
        ],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "The slot does not have enough cases to fill the full quantity ordered. You should:",
        options: [
          "Shortfill with what's available and move on",
          "Take cases from an adjacent slot to complete the count",
          "Do not shortfill — contact your supervisor to document the partial slot",
          "Place what you have, say ready, and add a note later",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: "over-pick",
    title: "Over Pick — Extra Quantity",
    riskLevel: "high",
    category: "Accuracy",
    heroLine: "An over-pick feels helpful — but it breaks inventory and costs everyone.",
    novaLine: "Be exact. NOVA gives the number for a reason. Your job is precision, not generosity.",
    novaIntro:
      "Welcome to Over Pick coaching. Picking too many cases is just as wrong as picking too few. Both are flagged as accuracy errors and both create real problems for stores, receivers, and the warehouse operation. This session explains why 'more is better' is one of the most expensive assumptions a selector can make. When you are ready, click Ready.",
    whyItHappens:
      "Over picks happen when a selector assumes that giving the store more product is a kind gesture. They think: 'the slot is almost empty, I'll just clean it out.' Or they lose count mid-pick and round up to avoid a short pick. Sometimes a selector has good intentions — they see the slot is nearly empty and think they are helping by taking the rest. But warehouse inventory is a precision system, and every deviation from the ordered quantity, whether short or over, creates a chain of problems that costs time and money.",
    whatGoesWrong:
      "The store receives more product than it ordered. Their inventory counts go off — they now show more product on hand than their system expects. The receiving team has to stop their workflow, figure out the discrepancy, and decide what to do with the extra product. In many cases, the extra product must be sent back, creating a return order. In other cases it sits in a backroom, taking up space and creating confusion for the next restocking cycle. The selector loses accuracy points — the same penalty as a short pick or mispick. The inventory discrepancy can ripple through the store's ordering system for weeks.",
    fixSteps: [
      "Stop EXACTLY at the number NOVA gave you. Not one more. Precision is the entire job.",
      "Never empty a slot just because it looks almost empty. The remaining product belongs to a different order or a future delivery. Leave it.",
      "If you are mid-count and unsure if you already placed too many, remove the last case before saying ready. It is always safer to re-add than to over-deliver.",
      "Say the count aloud as you place: 'One… two… three… four… five… six… seven… eight.' When you hit the number, your hands stop.",
      "Never 'round up to be safe.' An over-pick is never safer than an exact pick. It simply shifts the problem from your accuracy to the store's inventory.",
      "If you think NOVA's quantity sounds wrong for the slot size, say repeat and confirm. Do not change the number on your own judgment.",
      "After placing the final case, do a count check before you move. If your hands placed more than the number, remove the extra immediately.",
    ],
    coachingScript: `An over-pick seems harmless — maybe even helpful.

You gave them more. The store has extra product. That's good, right?

Wrong.

Let me show you what actually happens when you over-pick.

You hear NOVA say: pick eight.

The slot looks almost empty.
There are ten cases left.
You think: I'll just take all ten — helps clean up the slot, gives the store extra.

So you grab ten.

Nothing stops you.
NOVA moves on.
You move on.

But here is what happens at the store.

The store's receiving team opens the pallet.
They scan in the product.
The system says: expected 8. Received 10.

Now they have a discrepancy.

Inventory goes off.
Their system shows 2 extra units they did not order.
Their next automated order for that product will under-order to compensate.
The shelf might actually run short next week because of the over-pick this week.

And the receiving team has to spend 20 minutes resolving the discrepancy.
That time costs money.

Your accuracy score takes the same hit as a mispick.

Now let me show you the right way.

You hear NOVA say: pick eight.

The slot has ten cases.
You count to eight.

One… two… three… four… five… six… seven… eight.

You stop.
You leave the remaining two cases in the slot.
Those two cases belong to another order or another delivery.

The store receives exactly what it ordered.
The inventory stays accurate.
No discrepancy.
No correction.
No penalty.

Here is the most important thing to understand about over-picks:

The warehouse is a precision system.
Every number NOVA gives you was calculated for a reason.
The store ordered that exact quantity.
Their system is expecting that exact quantity.

When you change the number — even to give them more — you are breaking the system.

Extra is not helpful.
Exact is professional.

And professional work protects everyone's time.

Remember this:

Your job is precision.
Precision means hitting the number exactly.
Not more. Not less.
Exactly.`,
    scenario: {
      assignment: "Assignment 251737",
      location: "Aisle 22 · Slot 104",
      issue: "NOVA said pick 8 — slot had 10 cases — selector took all 10 to 'clean up the slot'",
      wrongFlow: [
        "Heard 'pick 8' — slot had 10 cases remaining",
        "Decided to take all 10 to 'help the store'",
        "Store received 2 extra cases not on the order",
        "Receiving team flagged inventory discrepancy",
        "Store's automated ordering system under-corrected for next cycle",
        "Accuracy score docked — same as mispick",
      ],
      correctFlow: [
        "Heard 'pick 8' — counted exactly to 8",
        "Left remaining 2 cases in slot for another order",
        "Said ready after confirming 8 cases on pallet",
        "Store received exactly what was ordered",
        "Inventory accurate — no correction, no penalty",
        "Clean record, operation ran smoothly",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Why is over-picking considered a serious accuracy error?",
        options: [
          "It helps the store and is only a minor notation",
          "It breaks inventory accuracy and causes receiving discrepancies at the store",
          "It makes the selector move faster overall",
          "Nothing happens to the order — stores accept extra product",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "A slot has 10 cases and NOVA says pick 8. You should:",
        options: [
          "Take all 10 — it helps clean up the slot",
          "Take 8 exactly and leave the remaining 2 in the slot",
          "Round up to 9 just to be safe",
          "Take 8 and ask a supervisor about the remaining 2",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "What is the correct mindset when picking quantity?",
        options: [
          "More is always better — give stores what they need",
          "Speed over accuracy — hit the number approximately",
          "Precision — stop exactly at the number NOVA gave, no more, no less",
          "Round to the nearest five for efficiency",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "You are mid-count and realize you may have placed one too many. You should:",
        options: [
          "Leave it — the store will appreciate the extra",
          "Remove the last case and recount from zero",
          "Mark it on your assignment sheet and move on",
          "Say ready and let the receiving team sort it out",
        ],
        correctIndex: 1,
      },
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: "bad-stacking",
    title: "Bad Stacking — Crush Damage",
    riskLevel: "critical",
    category: "Pallet Quality",
    heroLine: "One bad placement can cost hundreds of dollars. Think weight before you place.",
    novaLine: "Heavy low. Fragile high. Support every layer.",
    novaIntro:
      "Welcome to Bad Stacking coaching. Placing heavy items on fragile ones causes crush damage during transit — and that damage costs the company real money. This is one of the most expensive selector errors because the damage often is not discovered until the store receives the pallet, meaning the product is completely unsellable. When you are ready, click Ready.",
    whyItHappens:
      "Bad stacking happens almost entirely because of speed. When a selector is focused purely on moving fast, they grab the next case and place it wherever there is open space on the pallet. They are not thinking about what is below. They are thinking about the next slot. A case of water lands on a case of bread because the selector was already mentally at the next stop before their hands finished the current one. The lack of weight awareness in placement is a speed-driven habit that causes significant damage at the store level.",
    whatGoesWrong:
      "The pallet is wrapped and loaded. It moves through the dock, into a trailer, and out on the road. During movement and braking, the load shifts. Heavy product presses down on fragile product beneath it. By the time the store opens the pallet, bags of chips are crushed, bread is flattened, or bottled products are broken. The store cannot sell any of it. They file a damage claim. The loss is tracked back to the pallet's originating selector. The selector's quality record is noted. Repeated damage claims trigger formal review. Beyond the financial cost, damaged product also means the store's shelves cannot be filled — customers leave without what they came for.",
    fixSteps: [
      "Before placing ANY case, ask yourself one question: 'Is this case heavier or lighter than what is already below it?' One second of thought prevents hundreds of dollars of damage.",
      "Heavy cases ALWAYS go to the bottom. Water, beverages, canned goods, cleaning supplies — these are your foundation. They can support weight above them.",
      "Medium-weight cases build the middle layers. Jarred products, boxed items, moderate density goods build the structure.",
      "Fragile, soft, or crushable items go on top. Bread, chips, crackers, bagged items, paper products — anything that deforms under pressure goes as high as possible.",
      "Never place a hard or rigid case directly on top of soft packaging. Even if it fits in the space, it will damage the soft product when the pallet moves.",
      "When you pick up a case and it is unexpectedly heavy, immediately reconsider where you were about to place it. If it was going on top, it needs to go lower.",
      "When picking in a mixed aisle with both heavy and light products, mentally plan your pallet structure before you pick. Know the load before you build it.",
    ],
    coachingScript: `A damaged product costs the company money.
It costs the store shelf availability.
It costs the selector their quality record.

One careless placement in one moment can create all three.

Let me show you exactly how it happens.

You are on assignment 251738. Mixed load — aisles 17 through 22.

You are moving well. Good pace.

You grab a case of water. 40 pounds.
The pallet has open space toward the top.
You are already thinking about the next stop.

You place the water wherever there is room.

It lands on top of a case of hamburger buns.

Nothing stops you.
NOVA keeps moving.
You keep moving.

Now the pallet gets wrapped.
It goes on a trailer.
The truck pulls out of the dock.

On the highway, the driver hits the brakes.

The 40-pound water shifts forward.
The pressure is transferred directly through the buns below it.

The buns collapse.
The packaging splits.
By the time the store opens that pallet…

The buns are unsellable.
A claim is filed.
$180 in product goes to waste.

Your quality record is noted.

Now let me show you the right way.

You grab the water case. 40 pounds.
You are building the current layer.

Before you place it, you ask yourself:
'What is below this space?'

You look. Bread. Soft, crushable.

That water does NOT go there.

You move the water to the base — where it belongs.
Heavy goes to the bottom.

The bread goes toward the top of the next layer.

Now when that pallet moves, the weight flows down through dense, solid product.
Nothing crushes.
Nothing collapses.
The store opens the pallet and everything is sellable.

Here is what this mistake really looks like at scale:

A selector who does not think about weight placement
causes an average of 2–3 damage claims per month.
Each claim averages $150–$300 in product loss.

That is $300–$900 per month in damage.
From one selector.
From one habit.

The fix takes one second per case.

Think weight.
Place with intention.

Remember this:

Heavy low. Fragile high.
Support every layer.

That is the entire rule.
Follow it on every case, every stop, every shift.`,
    scenario: {
      assignment: "Assignment 251738",
      location: "Aisle 19 · Mixed Load Build",
      issue: "40-lb water case placed on top of hamburger buns — pallet not wrapped yet",
      wrongFlow: [
        "Grabbed water case (40 lbs) while focused on speed",
        "Placed it on top of bread — open space was there",
        "Did not check what was below before placing",
        "Pallet wrapped and loaded — damage not visible",
        "In transit, water shifted and crushed the buns below",
        "Store received unsellable bread — $180 damage claim filed",
        "Selector quality record noted — second occurrence triggers review",
      ],
      correctFlow: [
        "Grabbed water case — recognized it was heavy",
        "Checked the current pallet build before placing",
        "Saw bread below the open space — redirected water to the base",
        "Placed water at bottom layer where it supports structure",
        "Bread placed near the top of the build — protected",
        "Pallet survived transit intact — all product sellable at store",
        "No damage claim — clean quality record",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Where should heavy cases like water or canned goods always be placed on the pallet?",
        options: [
          "On top — easier for store receivers to unload first",
          "At the bottom of the pallet — they form the foundation",
          "In the middle for balance on both sides",
          "Wherever they fit first to save time",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "You are building a pallet and you have water and chips to place. The correct order is:",
        options: [
          "Chips on bottom because they take up more space",
          "Water on bottom, chips on top — heavy supports, fragile is protected",
          "Stack them randomly — the wrap holds everything together",
          "Ask a coworker which way looks more balanced",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "You pick up a case and it is much heavier than you expected. You should:",
        options: [
          "Stack it wherever there is open space to keep pace",
          "Immediately reconsider its placement — it likely needs to go lower on the build",
          "Put it on top to make it easy to grab first at the store",
          "Set it aside and pick a different case instead",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "Crush damage caused by bad stacking results in:",
        options: [
          "Nothing — product can usually be repackaged at the store",
          "A minor note that disappears after 60 days",
          "Product loss, damage claims, store shelf gaps, and a quality flag on the selector record",
          "A small deduction from the next paycheck only",
        ],
        correctIndex: 2,
      },
      {
        id: "q5",
        question: "What is the one question to ask before placing any case on the pallet?",
        options: [
          "How many more stops do I have left?",
          "Is this case heavier or lighter than what is below it?",
          "Will this case fit without going over the pallet edge?",
          "Can I place two cases at once to save time?",
        ],
        correctIndex: 1,
      },
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: "poor-stacking",
    title: "Unstable Pallet — Collapse Risk",
    riskLevel: "critical",
    category: "Pallet Quality",
    heroLine: "Build like a brick wall — interlocked, even, and solid.",
    novaLine: "Interlock every layer. No columns. No gaps. Keep it wide and stable.",
    novaIntro:
      "Welcome to Unstable Pallet coaching. A pallet that leans, tips, or collapses during transit or in the warehouse is dangerous and expensive. People can get hurt. Product gets destroyed. Deliveries are delayed. This session teaches you the build habits that create solid, locked pallets every time. When you are ready, click Ready.",
    whyItHappens:
      "Unstable pallets almost always come from one of three structural mistakes. First, a selector stacks in straight vertical columns — each case directly on top of the one below it — instead of interlocking. Columns have no lateral support and collapse easily when the pallet moves. Second, gaps are left between cases in a layer — instead of filling each layer completely before starting the next, the selector builds upward too quickly, leaving open spaces that create weak points. Third, the build grows too tall on one side — one end of the pallet is higher than the other, creating an uneven load that shifts and tips during transport.",
    whatGoesWrong:
      "A leaning pallet falls on the dock, in the trailer, or at the store. When it falls, hundreds of cases hit the floor. Product is damaged or destroyed. In the worst cases, a person nearby is struck by falling product or the pallet itself — this is a recordable safety incident. The dock stops. The delivery is delayed. A safety investigation is opened. The selector's quality record is flagged. Pallets that travel without collapsing but arrive leaning are rejected at the store and sent back, creating a complete re-pick requirement.",
    fixSteps: [
      "Interlock your layers like bricks — each case must overlap at least two cases below it, not sit directly on top of one. This creates a locked structure that resists movement.",
      "Never stack in straight vertical columns. Columns have no lateral support and will slide apart when force is applied during transport.",
      "Fill each layer COMPLETELY before starting the next layer. Do not build upward in one spot while another area of the pallet has empty space.",
      "Keep your build even and wide. Every side of the pallet should grow at roughly the same rate. If one side is getting tall, add to the others before continuing upward.",
      "Stay at or under the safe height limit — approximately 60 inches (five feet) for most facilities. Tall and narrow pallets have a very high center of gravity and fall easily.",
      "Wrap the pallet before moving it if it must be moved before completion. Never move an unwrapped, incomplete build.",
      "When you finish a pallet, give it a firm push from the side before wrapping. If it wobbles or shifts, rebuild the unstable section before moving on.",
    ],
    coachingScript: `A falling pallet is a liability.
It hurts people.
It destroys product.
It holds up the dock.
And the selector who built it owns that incident.

Let me show you exactly how an unstable pallet gets built.

You are picking a mixed load. Moving fast.

You put the first layer down in straight columns.
Every case directly on top of the one below.
Nice and neat, right?

You start the second layer.
You build tall on the right side before filling the left.
There are gaps in the middle layer, but you keep going.

You finish the assignment.
The pallet is tall.
It looks okay from the front.

NOVA moves you to the next assignment.

The dock team comes to wrap the pallet.
As they go to stretch-wrap it…

It shifts.

One side tips.

Cases start sliding.

Fifteen cases hit the floor.

Three are destroyed.
The dock has to stop.
Someone nearly gets hit.

A safety report is filed.
A quality flag goes on your record.
The dock supervisor pulls the video.

That is a serious incident.

Now let me show you the right way to build.

You think like a bricklayer.

The first case goes down.
The second case overlaps half of the first.
The third case overlaps the second and part of the first.

Every case is connected to at least two below it.

You fill the full layer before starting the next.
No gaps.
No columns.
No tall sides.

The load is wide, even, and locked together.

Now when the dock team comes to wrap it…
It stands solid.
When the trailer hits the highway, it stays locked.
When the store opens the trailer, everything is intact.

Let me give you a simple test to remember this:

Push the pallet from the side with your hand.
If it doesn't flex at all — good structure.
If you feel cases shifting — you have columns or gaps — fix it before wrapping.

One extra minute of rebuilding a weak section
saves an hour of cleanup and a safety report.

Remember this:

Build like a brick wall.
Interlocked. Filled. Even. Wide.
Five seconds of correct placement saves an hour of cleanup.`,
    scenario: {
      assignment: "Assignment 251740",
      location: "Aisle 23 · Mixed Load",
      issue: "Straight vertical column stacking with unfilled gaps — pallet tipped before wrapping",
      wrongFlow: [
        "Stacked in straight vertical columns — no interlocking",
        "Did not fill layers before building upward",
        "Left gaps between cases in the lower layers",
        "Right side built taller than left — uneven load",
        "Pallet shifted when dock team approached to wrap",
        "15 cases fell — 3 destroyed — dock stopped",
        "Safety incident report filed — quality flag added to selector record",
      ],
      correctFlow: [
        "Interlocked every case — each overlapping two below it",
        "Filled each layer completely before starting the next",
        "Built wide and even on all sides",
        "Stayed under 60-inch height limit",
        "Tested with a firm side push — no movement",
        "Dock team wrapped without incident",
        "Arrived at store intact — all product sellable",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Why should cases be interlocked like bricks instead of stacked in straight columns?",
        options: [
          "It looks neater and takes the same time to build",
          "Interlocking connects each case to two below it, creating a locked structure that resists movement and collapse",
          "Straight columns are faster and equally stable",
          "Interlocking reduces the total case count on the pallet",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Which build approach creates the highest collapse risk?",
        options: [
          "Wide interlocked layers filled completely before going up",
          "Straight vertical columns with unfilled gaps between layers",
          "Alternating brick-pattern layers built evenly on all sides",
          "Low, wide builds that stay under 48 inches",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "You have finished one side of the pallet layer but not the other. You should:",
        options: [
          "Continue building upward on the finished side — come back to fill the other later",
          "Fill the rest of the current layer completely before starting the next layer",
          "Wrap the pallet now and start a new one for the remaining product",
          "Let the dock team fill the gaps when they wrap it",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "A quick field test for pallet stability before wrapping is:",
        options: [
          "Count the number of cases and verify against the manifest",
          "Give the pallet a firm push from the side — if cases shift, there are columns or gaps to fix",
          "Look at the pallet from across the aisle to check if it looks straight",
          "Lift one corner slightly to see if the pallet deck flexes",
        ],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "A falling pallet in a warehouse can result in:",
        options: [
          "Faster delivery because product is already on the floor",
          "A minor slowdown that corrects itself quickly",
          "Personal injury risk, product destruction, dock delays, safety investigation, and quality flags",
          "A performance bonus for the dock team who handled it",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: "slow-transitions",
    title: "Moving Too Slow Between Picks",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Speed is not picking faster — it is stopping less.",
    novaLine: "The moment NOVA confirms, you should already be moving.",
    novaIntro:
      "Welcome to Transition Speed coaching. Most selectors lose the majority of their time between stops — not at the shelf itself. The pick takes one or two seconds. The transition takes ten. This session shows you exactly where the seconds go and how to get them back without rushing. When you are ready, click Ready.",
    whyItHappens:
      "Slow transitions are a habit formed in the first few weeks of the job. A new selector finishes a pick, pauses to mentally process what just happened, repositions themselves, and then starts moving toward the next slot. That pause feels natural — almost like a breath between actions. But it is dead time. The pause becomes habitual. By week three, the selector is pausing after every single pick without realizing it. At 50 stops, a 10-second pause after each stop is over 8 minutes of dead time per assignment. That dead time directly drives the rate number down.",
    whatGoesWrong:
      "Rate falls consistently over the course of each assignment. The selector finishes every assignment later than the target time, not because any individual pick was slow, but because of accumulated dead time between picks. The supervisor looks at the data and sees a consistent rate below target. The selector cannot explain it — they feel like they are working hard. They are. But hard work without efficient transitions does not produce strong rate numbers. Over time, consistent below-target rate triggers coaching conversations and performance reviews.",
    fixSteps: [
      "The moment NOVA says 'grab' or confirms your pick, your body should already be moving to the next position. Start moving before the confirmation is fully finished.",
      "Keep your pallet jack centered in the aisle and reposition it every 5–8 stops. A misaligned pallet jack forces extra movement at every stop.",
      "While your hands are finishing the current case placement, your eyes should already be scanning forward toward the next slot. Body and eyes stay ahead of the action.",
      "Develop a rhythm — not a sprint. Steady, continuous motion between stops is more efficient than sprinting and stopping. Think of it as a pace, not a race.",
      "Check your position every 10 stops. If your pallet jack is off-center, if you are reaching too far, or if you are taking extra steps — correct it now before it compounds.",
      "Never fully stop moving unless you need to physically stop for safety. Even repositioning and turning should be done while moving toward the next point.",
      "At the end of each assignment, note whether your pace felt consistent or choppy. Choppy pace is a sign of too many micro-pauses that are adding up.",
    ],
    coachingScript: `The fastest selectors are not picking faster.

They are stopping less.

Every pause between stops adds up.
Not dramatically. Quietly.

Let me show you the math.

You finish a pick.
You pause — just two seconds.
You look around.
You turn slowly.
You start moving.

Two seconds. No big deal.

But you do that 50 times on one assignment.

50 stops × 2 seconds each = 100 seconds = almost 2 minutes.

Now add a 5-second pause instead.

50 stops × 5 seconds each = 250 seconds = over 4 minutes.

And a 10-second pause?

50 stops × 10 seconds = 500 seconds = over 8 minutes.

EIGHT MINUTES of dead time.
From pausing.
Not from picking slowly.
From the moments BETWEEN picking.

That is where your rate lives.

Now let me show you what a tight transition looks like.

You finish placing the case.
Before your hands even let go…
Your body is already turning.
Your eyes are already on the next slot.
Your pallet jack is already moving.

No pause.
No dead moment.
No looking around.

Just continuous motion.

NOVA gives the next slot.
You are already halfway there.

Now your 50-stop assignment takes 8 minutes less time.

Your rate reflects that.
Your supervisor sees it.
You feel it.

Here is a real comparison from the floor:

Selector A: 10-second pause between every pick.
Assignment time: 112 minutes.
Rate: 81%.

Selector B: Zero pause — constant motion between picks.
Same assignment, same stops, same cases.
Assignment time: 95 minutes.
Rate: 102%.

Same physical picking speed.
The difference is entirely in the transitions.

Control your transitions.
That is where your rate lives.

Remember this:

Speed is not rushing the pick.
It is never stopping between picks.

Keep your body moving.
Keep your eyes forward.
Keep your jack centered.

And your rate will follow.`,
    scenario: {
      assignment: "Assignment 251741",
      location: "Aisle 08 · 50-stop run",
      issue: "Consistent 8–10 second pause after every pick — not rushing, but not moving",
      wrongFlow: [
        "Finished each pick → full stop → looked around → then started moving",
        "Pallet jack off-center — needed extra steps to reposition each time",
        "Eyes not scanning forward — processing each stop as isolated",
        "50 stops × 10 sec pause = 8+ minutes of dead time",
        "Assignment took 112 minutes instead of 95-minute target",
        "Rate: 81% — no bad picks, no damage — just lost transitions",
      ],
      correctFlow: [
        "Body turning before hands finished placing the case",
        "Eyes scanning forward while current pick completed",
        "Pallet jack repositioned every 5 stops — always centered",
        "Zero pause between pick completion and next movement",
        "50 stops in 95 minutes — on target pace",
        "Rate: 102% — same picking skill, better transitions",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "Where do most selectors lose the majority of their time during an assignment?",
        options: [
          "During the actual physical pick from the slot",
          "Between stops — in the transition from one pick to the next",
          "At the beginning while getting the assignment from the printer",
          "During break time that runs slightly long",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "10 extra seconds of pause after each pick, across 50 stops, equals:",
        options: [
          "About 1 minute — barely noticeable in the rate",
          "About 2 minutes — minor impact",
          "Over 8 minutes of dead time — significant rate impact",
          "About 30 seconds — negligible",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "What should your eyes be doing while your hands are finishing a case placement?",
        options: [
          "Looking at the case you just placed to confirm it is stable",
          "Already scanning forward toward the next slot",
          "Watching the pallet jack position",
          "Looking at the ground while you transition",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "How often should you reposition your pallet jack to minimize wasted steps?",
        options: [
          "Every single stop — always start perfectly centered",
          "Only at the beginning and end of the aisle",
          "Every 5–8 stops to keep it centered without over-correcting",
          "Once per assignment — after that, adapt to wherever it ends up",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: "overthinking",
    title: "Overthinking Picks",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Hesitation is not caution — it is wasted time dressed up as caution.",
    novaLine: "Code confirmed = grab. No second-guessing.",
    novaIntro:
      "Welcome to Overthinking coaching. Second-guessing yourself after a confirmed check code is one of the most common performance killers for selectors in their first 60 days. It feels like being careful — it is actually slowing you down without improving your accuracy at all. This session teaches you to trust your process. When you are ready, click Ready.",
    whyItHappens:
      "Overthinking is a natural response to new situations. In the first weeks of the job, everything feels uncertain. The selector worries about mispicking, so they re-check after every confirmation. Over time, the habit becomes automatic — even when the selector's skill has long since improved, they still pause after every code confirmation because it became their routine. The irony is that the additional re-check after a correct confirmation adds zero accuracy benefit but costs seconds on every stop.",
    whatGoesWrong:
      "The selector falls behind pace without being able to explain why. Their pick counts look fine. Their accuracy is fine. But their rate is consistently below target. When a supervisor reviews their footage, the culprit is visible: a 3–5 second pause after every check code confirmation. The selector confirms the code, then re-reads the label, then pauses, then grabs. That post-confirmation hesitation adds 3–5 seconds per stop. At 50 stops, that is 2.5–4 minutes lost every assignment — purely to hesitation that did not improve a single pick.",
    fixSteps: [
      "Create a hard rule for yourself: 'Code confirmed = grab.' The moment NOVA confirms your check code, your hand reaches for the case. No additional pause.",
      "Trust your training. You were taught the confirmation process for a reason. If the process was followed and NOVA confirmed, the pick is correct.",
      "Use 'repeat' ONLY when something is genuinely unclear — not as a comfort habit. Asking for a repeat every few stops adds time without adding accuracy.",
      "If you notice you are re-reading the label after confirming the code, recognize that as your signal: you are overthinking. Stop the re-read and grab.",
      "Build a physical routine: hear code → speak code → hear NOVA confirm → hand moves. Practice this sequence until it becomes automatic.",
      "Accept that small mistakes happen. Trying to achieve zero uncertainty on every pick causes delays that hurt your rate more than the mistakes you are trying to prevent.",
      "After a shift where you felt slow despite working hard, ask yourself: 'Was I pausing after confirmations?' That is usually the answer.",
    ],
    coachingScript: `Confidence and accuracy are not opposites.

The best selectors move with confidence because they trust their process.

Let me show you what overthinking looks like on the floor.

You hear: Aisle 17, slot 66, pick 4.

You move to the slot.
You read the label. Correct.
You say the check code.
NOVA confirms.

Then you pause.
You look at the label again.
You re-read the check code on the display.
You look at the product once more.

You already know it's right.
NOVA already told you it's right.

But you don't fully trust it yet.

Three… four… five seconds pass.

Then you grab.

That re-check added five seconds to a stop that was already finished.

Now multiply that across 50 stops.

5 seconds × 50 stops = 250 seconds = over 4 minutes lost.

Four minutes.
No mispicks prevented.
No accuracy gained.

Just four minutes of time lost because you did not trust a confirmation that was already correct.

Now let me show you what a confident selector looks like.

You hear: Aisle 17, slot 66, pick 4.

You move to the slot.
You read the label. Correct.
You say the check code.
NOVA confirms.

Your hand is already moving.

You grab.
You place.
You are already moving to the next slot.

No pause.
No re-read.
No second thought.

Code confirmed means grab.

Here is a real comparison:

Overthinking selector on a 50-stop assignment:
Confirms → pauses 5 seconds → re-reads → grabs.
Total lost time: 4+ minutes.
Rate impact: dropped from 96% to 83%.

Confident selector on the same assignment:
Confirms → grabs immediately.
Total lost time: zero.
Rate: 96%.

Same accuracy. Same number of correct picks.
The difference is four minutes of trust.

Here is the most important thing to understand:

The confirmation process is designed to be final.
When NOVA confirms your code, the pick is verified.
Additional checking after that point is not safety — it is doubt.

And doubt is expensive.

Build the rule:
Code confirmed = grab.

Say it before your shift.
Repeat it when you feel the urge to re-check.

Trust your process.
Your process is what makes you accurate.
Your process is also what makes you fast.`,
    scenario: {
      assignment: "Assignment 251742",
      location: "Aisle 17 · Slot 66",
      issue: "5-second pause after every check code confirmation — re-reading label after NOVA already confirmed",
      wrongFlow: [
        "Confirmed check code correctly — NOVA confirmed the pick",
        "Paused anyway — re-read the label a second time",
        "Looked at product once more before grabbing",
        "5 extra seconds added to every stop",
        "50 stops × 5 sec = 4+ minutes lost to hesitation",
        "Rate fell from expected 96% to 83% — no mispicks, only hesitation",
      ],
      correctFlow: [
        "Confirmed check code — heard NOVA confirm",
        "Hand reached for case immediately at confirmation",
        "No re-read — trusted the confirmation process",
        "Zero delay between confirmation and grab",
        "50 stops completed on pace",
        "Rate: 96% — same accuracy, four minutes faster",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "After NOVA confirms your check code, you should:",
        options: [
          "Re-read the full label one more time to be completely certain",
          "Grab the case immediately — the confirmation is final",
          "Pause and visually examine the product before reaching",
          "Count to three mentally then grab",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "A 5-second hesitation after every confirmed pick, across 50 stops, costs:",
        options: [
          "About 30 seconds — negligible on your rate",
          "About 1 minute — minor but manageable",
          "Over 4 minutes — a significant rate reduction",
          "It varies too much to calculate",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "When should you say 'repeat' to NOVA?",
        options: [
          "Every 10 stops as a routine accuracy check",
          "Only when something is genuinely unclear — you didn't hear it or it sounded wrong",
          "Never — always proceed even if unsure",
          "Every time you feel less than 100% confident",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "The feeling of re-checking a confirmed pick is best described as:",
        options: [
          "Necessary caution — you can never be too careful",
          "A valid safety habit that all professional selectors use",
          "Doubt — and doubt after a correct confirmation costs time without improving accuracy",
          "A sign of high skill and attention to detail",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: "not-preparing",
    title: "Not Preparing the Next Move",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Top selectors are already moving before NOVA finishes speaking.",
    novaLine: "While NOVA talks, you move. Anticipate — don't react.",
    novaIntro:
      "Welcome to Pre-Staging coaching. Top selectors are always one step ahead of NOVA. They are not reacting to instructions — they are anticipating them. This session teaches you how to prepare your next move while you finish your current one, which is the habit that separates 85% selectors from 100%+ selectors. When you are ready, click Ready.",
    whyItHappens:
      "Most selectors are taught to listen to NOVA and then move. This reactive model — hear the instruction, process it, then act — creates a built-in delay at every stop. The selector finishes placing a case, stands still while they listen to NOVA, then starts moving. This feel like the correct and careful approach. But it means there is always a gap between the instruction and the movement — every single stop, all shift long. Pre-staging means closing that gap by learning to anticipate and move while the instruction is still being given.",
    whatGoesWrong:
      "There is always a delay between instruction and action. The selector is always one beat behind NOVA instead of with NOVA. This creates a consistent 2–4 second gap at every stop. Across 50 stops, that is 1.5–3 minutes of lag time every assignment — purely from reaction delay, with no accuracy benefit. The selector works the full shift, works hard, and still finishes assignments behind pace because they are always reacting instead of anticipating.",
    fixSteps: [
      "While your hands are finishing placing the current case, your eyes should already be moving forward — not looking at the case you just placed.",
      "As NOVA begins speaking the AISLE number, start turning your body in that direction. You do not need the full slot address to begin moving.",
      "Keep your weight forward and your body position oriented toward the typical next direction — not flat-footed or turned sideways after each pick.",
      "Learn the layout of your aisles well enough that hearing an aisle number tells you almost everything — direction, product type, distance. This knowledge enables pre-staging.",
      "Think of picking as a rhythm, not a series of individual stops. Continuous motion with no dead moments between stops is the goal.",
      "Finish the current pick while already mentally committed to the next one. The moment you place, you are already in motion.",
      "Practice the habit deliberately for one full shift. Every time you finish a pick, ask yourself: 'Am I already moving?' The answer should always be yes.",
    ],
    coachingScript: `The best selectors are never surprised by NOVA.

They know their aisles.
They know their product zones.
They know the direction before NOVA finishes speaking.

By the time NOVA says the slot number, they are already at the aisle.

Let me show you what the difference looks like.

Selector A — Reactive:

NOVA says: "Aisle 18… slot 112… pick three."

Selector A is standing still.
They wait for the full address.
Then they process it.
Then they start moving.

That is a 3–5 second delay.

50 stops × 4 seconds = 200 seconds = 3.3 minutes lost.

Not from slow picking.
Not from errors.
From reaction time.

Now Selector B — Anticipating:

NOVA says: "Aisle 18…"

Selector B's body is already turning.
They know aisle 18 — it is straight ahead and slightly left.
By the time NOVA says "slot 112…" they are already moving.
By the time NOVA says "pick three…" they are at the slot.

Zero delay.
Just flow.

Now the math:

Selector A on 50 stops: 3+ minutes behind pace.
Selector B on 50 stops: on pace, maybe ahead.

Same physical picking ability.
Same accuracy.
The difference is entirely in anticipation.

Here is what makes this possible:

Knowing your facility.
Knowing your product.
Knowing your aisle numbering so well that an aisle number is a direction, not a mystery.

When aisle 18 means 'straight ahead, turn left at the freezer' without thinking —
that is when you can pre-stage.
That is when you stop reacting and start flowing.

Here is the critical technique:

While your hands are placing the current case…
Your eyes are already forward.
Your body weight is already shifting.
Your feet are already positioned to step in the next direction.

You are completing the current pick AND setting up the next one simultaneously.

That is the rhythm.

Pick. Place. Move. Pick. Place. Move.

No pause.
No flat-footed reset.
No standing still while you wait for NOVA to finish.

Just continuous forward motion.

Remember this:

Picking is a rhythm — not a series of stops.
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
      issue: "Full stop after each pick — waited for complete NOVA instruction before moving",
      wrongFlow: [
        "Finished each pick and came to a complete stop",
        "Stood still while listening to NOVA's full instruction",
        "Processed the aisle, slot, and quantity before starting to move",
        "3–5 second reaction lag at every stop",
        "45 stops × 4 sec = 3 minutes of reaction time lost",
        "Rate dropped 12% — not from picking speed, from reaction delay",
      ],
      correctFlow: [
        "Finished case placement — body already turning as hands released",
        "Heard 'Aisle 12' — already moving toward aisle 12",
        "Heard 'slot 77' — already in the aisle, scanning for slot",
        "Zero flat-footed pause between stops",
        "Rhythm maintained entire assignment",
        "Rate 12% higher on same stops with same picking speed",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When should you start moving toward the next slot?",
        options: [
          "Only after NOVA finishes the full instruction including the pick quantity",
          "As soon as NOVA says the aisle number — begin turning that direction",
          "After placing the current case fully and verifying its position",
          "When you can physically see the next slot from your current position",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "A 4-second reaction delay after each pick, across 50 stops, results in:",
        options: [
          "About 30 seconds lost — negligible impact",
          "About 1 minute lost — minor but manageable",
          "Over 3 minutes lost — a meaningful rate reduction",
          "It depends entirely on the weight of the cases",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "While your hands are finishing placing the current case, your eyes should be:",
        options: [
          "Watching your hands to confirm the case is placed safely",
          "Closed briefly to mentally prepare for the next pick",
          "Already scanning forward toward the next slot",
          "Checking the pallet to evaluate your build quality",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "What makes pre-staging possible in an unfamiliar area?",
        options: [
          "It isn't possible in unfamiliar areas — you must always wait for the full instruction",
          "Learning the facility layout so that aisle numbers immediately tell you direction and product type",
          "Using a paper map of the warehouse at each stop",
          "Always working with a partner who can start moving first",
        ],
        correctIndex: 1,
      },
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: "ergonomics",
    title: "Ignoring Ergonomics",
    riskLevel: "high",
    category: "Safety & Health",
    heroLine: "Your body is your tool — protect it or lose the job.",
    novaLine: "Bend your knees. Protect your back. This job is long-term, not one shift.",
    novaIntro:
      "Welcome to Ergonomics coaching. Poor body mechanics during picking lead to injuries that end careers early. This is not dramatic — it is documented. Selectors who ignore ergonomics are not lazy or weak. They are simply using their bodies incorrectly, and the damage accumulates invisibly until it becomes impossible to ignore. This session covers the physical habits that protect you long-term. When you are ready, click Ready.",
    whyItHappens:
      "Ergonomics are ignored for two reasons. First, selectors are never trained explicitly on body mechanics — they are shown the picking process but not the physical technique. They develop whatever movement patterns feel natural, and natural usually means lazy mechanics when the body is tired. Second, the consequences of bad mechanics are delayed. On day one, bending with your back instead of your knees feels fine. On day ten, it still feels fine. On day 30, there's some tightness. By month three, the tightness becomes regular pain. By month six, the pain is affecting performance. The delay between cause and effect makes it easy to ignore the cause.",
    whatGoesWrong:
      "Back injuries are the most common result — specifically lower back strain and disc problems from repetitive forward bending without knee flexion. Knee problems develop from improper squat mechanics on low slots. Shoulder injuries develop from overreaching on high slots without repositioning. These injuries do not appear suddenly. They develop gradually over weeks and months. When they become serious, the selector's performance drops because movement becomes painful. In the worst cases, selectors cannot return to picking at all. Workers' compensation claims, time off, and replacement training costs the operation significantly.",
    fixSteps: [
      "For LOW slots (below waist height): Squat down by bending your knees and keeping your back straight and tall. Your legs do the work. Your back stays neutral.",
      "For HIGH slots (above shoulder height): Step close to the slot and use your whole body to elevate — not just your arms and back. Avoid overreaching with an extended spine.",
      "Never twist your spine while lifting. If you need to turn, move your feet. Pivot the whole body, not just the torso.",
      "Between stops, reset your posture. Roll your shoulders back, stand tall for two seconds. This prevents the gradual forward collapse that happens over long shifts.",
      "Stretch your lower back, hamstrings, and shoulders before every shift — minimum 5 minutes. This is not optional. This is maintenance for your most important tool.",
      "If you feel sharp pain — stop immediately. Sharp pain during a movement is a warning, not something to push through. Notify your supervisor.",
      "Alternate heavy and light picks when possible to give muscle groups time to recover between demanding movements.",
    ],
    coachingScript: `Your body is your tool.

Every selector in this facility depends on their body to do this job.

And every selector who ignored ergonomics and thought they were too young or too tough eventually learned the same lesson.

Usually not the first day.
Not the second.
Not even the first week.

It hits on day twenty.
Or day forty.
Or at the end of the fourth heavy week of the month.

Let me show you how it happens.

You are new. You are eager. You are moving fast.

Every low slot — you bend at the waist.
Quick dip, grab the case, back up.

It is faster that way. And it feels fine.

So you do it 80 times on your first assignment.
And 80 times on the second.
And 80 times on the third.

At the end of week one — you feel fine.

By the end of week three — there is tightness in your lower back.
Just tightness. You ignore it.

By week six — the tightness is regular.
You take ibuprofen before your shift.

By month three — you are favoring one side.
Your pace has slowed because moving at full speed hurts.

By month five — you have missed three shifts.
The doctor says disc irritation.
Physical therapy twice a week.

It started with a bad habit on day one.

Now let me show you the right way.

Every low slot:
You bend your knees.
Your back stays straight.
Your legs push you up.

It takes one extra second.
But your spine is protected.

Every high slot:
You step close to the slot.
You reach with a neutral spine.
You do not lean far back or overreach.

Every transition:
You stand tall.
Shoulders back.
Core slightly engaged.

At the end of your shift:
You stretch your lower back.
You stretch your hamstrings.
You stretch your shoulders.

Five minutes of stretching after a shift
protects your next five years in this job.

Here is the real cost of ignoring this:

A selector with good ergonomics can do this job for 10 years.
A selector with bad ergonomics typically starts having serious issues in months 6–12.

The difference is not fitness.
The difference is not age.
The difference is technique.

Protect your body.

Because once your back breaks down…
your rate, your performance, your job security —
all of it becomes secondary to just getting through the shift.

And that is no way to work.`,
    scenario: {
      assignment: "Assignment 251744",
      location: "Aisle 05 · Heavy low slot assignment",
      issue: "Bending at the waist on every low pick — 80+ repetitions, no knee flexion",
      wrongFlow: [
        "80+ low slot picks — bent at waist each time, not knees",
        "High slot picks — overreached with extended spine",
        "Twisted torso multiple times instead of pivoting whole body",
        "No stretching before or after shift",
        "Felt fine for first 2 weeks — ignored warning tightness in week 3",
        "By month 3: regular pain slowing pace — performance declining",
        "Month 5: missed shifts — disc irritation diagnosis",
      ],
      correctFlow: [
        "Low slots — bent knees, back straight, legs did the lifting",
        "High slots — stepped close, neutral spine, no overreach",
        "Pivoted whole body when turning — never twisted spine",
        "Reset posture between stops — shoulders back, stand tall",
        "Stretched lower back and shoulders before and after every shift",
        "Month 6: no injuries — pace maintained — performing consistently",
        "Year 2: still picking strong — body adapted and protected",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When picking a case from a low slot below waist height, the correct technique is:",
        options: [
          "Bend at the waist quickly for maximum speed",
          "Bend your knees, keep your back straight, and use your legs to lift",
          "Lean sideways to reach the case from a distance",
          "Extend one arm and drag the case toward you",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "You need to pick from a slot to your right side. The safe way to turn is:",
        options: [
          "Twist your torso to the right while keeping your feet planted",
          "Lean to the right with your upper body extended",
          "Pivot your whole body — move your feet — then pick",
          "Reach across your body from the left",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "Why does ergonomic damage feel invisible in the early weeks?",
        options: [
          "Young selectors have natural protection that older selectors lack",
          "The damage is not happening — it only becomes an issue after years",
          "The consequences are delayed — the body absorbs impact for weeks before pain signals appear",
          "Ergonomic injuries only happen from accidents, not repetitive movement",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "When should you stretch related to your picking shifts?",
        options: [
          "Never — stretching wastes shift time and is not required",
          "Once a week after a particularly heavy assignment",
          "Before and after every shift — this is body maintenance, not optional",
          "Only when you start feeling pain or tightness",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: "skipping-breaks",
    title: "Skipping Breaks and Hydration",
    riskLevel: "high",
    category: "Safety & Health",
    heroLine: "Breaks are not lost time — they are an investment in your second half.",
    novaLine: "Eat. Drink. Reset. Your second half depends on your break.",
    novaIntro:
      "Welcome to Break and Hydration coaching. Skipping breaks to boost your rate is one of the most counterproductive decisions a selector can make. The data on this is consistent: selectors who skip breaks lose more time in hours 5 through 8 than they ever saved by staying on the floor. This session explains why — and what to do instead. When you are ready, click Ready.",
    whyItHappens:
      "Selectors skip breaks because they are behind on their rate and believe pushing through will help them catch up. This is short-term thinking driven by a real concern — their rate is below target and every minute on the floor feels like it matters. The problem is that the human body has genuine energy limits, and ignoring those limits does not eliminate them. It defers them. The energy crash that would have been prevented by a break still happens — it just arrives at hour five or six instead of being avoided entirely. The selector ends up behind pace AND exhausted instead of just behind pace and recoverable.",
    whatGoesWrong:
      "Energy drops sharply in the second half of long shifts for selectors who skip breaks. Reaction time slows. Accuracy decreases — mispick risk goes up significantly when the brain is fatigued. Movement slows involuntarily. The body limits effort to protect itself. The rate that was gained by skipping the break is eliminated within two hours, and then the rate continues to fall below what it would have been with a proper break. Dehydration compounds all of this — even mild dehydration impairs cognitive function, which directly affects check code confirmation accuracy.",
    fixSteps: [
      "Take every scheduled break, every shift. Not sometimes. Every time. This is not optional for high performance.",
      "Eat during your break meal. A selector who skips their break meal will feel it in hour six. The body needs fuel for sustained physical and mental performance.",
      "Drink water at every break — at minimum 16 ounces. Do not wait until you feel thirsty. Thirst is a lagging indicator; you are already mildly dehydrated when you feel it.",
      "Use your break to walk lightly and slowly. This keeps your legs loose, prevents blood pooling, and helps muscles recover better than sitting still.",
      "Do not check your rate numbers on break. Use the time to mentally detach. You return sharper if you fully stepped away, even for 15 minutes.",
      "If you are behind on pace, acknowledge it at break, accept it, and re-commit to clean consistent habits in the second half. Panic and skipping breaks makes it worse.",
      "Drink water consistently throughout the shift — not just at breaks. A water bottle kept on the jack sip at stops is more effective than large amounts at break only.",
    ],
    coachingScript: `Breaks are not lost time.

They are investment in the rest of your shift.

Let me show you exactly what skipping a break costs.

You are one hour in. Good pace.
But you are 8% behind your rate target.

You reach break time.

You decide: I'll skip it. I need those 15 minutes.

You stay on the floor.

Hour 3: You feel good. This was the right call.
Hour 4: You feel okay. Getting a little tired.
Hour 5: Your legs are heavy.
Hour 6: Your focus is slipping. Two mispicks in the last 30 stops.
Hour 7: You are barely moving. Every pick feels like work.
Hour 8: You finished the shift. Rate was 74%.

You skipped break to catch up. You ended at 74%.

Now the selector who took their break.

Hour 3: Took break. Ate. Drank two cups of water. Walked slowly.
Hour 4: Back at 91%. Body reset.
Hour 5: 89%. Consistent.
Hour 6: 88%. Still consistent.
Hour 7: 85%. Tired but functional.
Hour 8: Finished at 87%. Strong second half.

The break selector was 13 percentage points higher in the second half.

The gain from skipping break?
Maybe 2–3% for the first two hours.

The cost of skipping break?
15–20% rate loss for the final three hours.

You cannot skip your way to a good shift.
You can only fuel your way there.

Here is what the research consistently shows about warehouse selectors:

A selector who is mildly dehydrated — even slightly — has measurably slower reaction time and reduced cognitive accuracy. That means slower code confirmations, slower decision-making, more mispicks.

Water is not optional for performance in physical work.
It is part of the job.

And food is not optional either.
The body doing 8 hours of warehouse picking burns significant energy.
Without fuel, you slow down.
Not because you want to — because you have to.

Remember this:

The selector who eats at break and drinks water
is picking at 87% at hour seven.

The selector who skipped break
is picking at 74% and getting worse.

Protect your second half.
Take your break.
Eat.
Drink.
Reset.

That is how you finish strong.`,
    scenario: {
      assignment: "Assignment 251745",
      location: "Full 8-hour shift",
      issue: "Skipped break to make up lost pace — energy crashed in hours 5–8",
      wrongFlow: [
        "Was 8% below target at break time — decided to skip break",
        "Stayed on floor: gained approximately 2–3% rate improvement in hours 3–4",
        "Hour 5: legs heavy, two mispicks from fatigue",
        "Hour 6: focus deteriorating — pace slowing involuntarily",
        "Hour 7: operating at 74% — below pre-break deficit",
        "Hour 8: finished weak — overall shift rate: 76%",
        "Net result: skipping break made the shift WORSE, not better",
      ],
      correctFlow: [
        "Was 8% below target at break — took full break anyway",
        "Ate, drank water, walked lightly for 15 minutes",
        "Returned to floor: body reset — hour 4 at 91%",
        "Hour 5: 89% — energy stable, focus sharp",
        "Hour 6: 88% — two mispicks avoided by maintained cognitive function",
        "Hour 7: 85% — consistent and controlled",
        "Hour 8: finished at 87% — strong second half",
        "Net result: break produced significantly higher second-half rate",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "If you are behind on your rate target at break time, you should:",
        options: [
          "Skip the break — every minute on the floor counts toward catching up",
          "Take the full break — your second-half performance depends on it",
          "Take a partial 5-minute break as a compromise",
          "Ask your supervisor if you can skip this once",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What does skipping a break typically result in for a long shift?",
        options: [
          "A consistent rate improvement that carries through the full shift",
          "Better accuracy because you are more focused from staying on the floor",
          "A fatigue crash in hours 5–8 that cancels the gained time and more",
          "No measurable difference in rate or accuracy",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "When should you drink water during a shift?",
        options: [
          "Only when you feel thirsty — the body signals when it needs water",
          "At breaks only — drinking mid-assignment wastes time",
          "Consistently throughout the shift and at breaks — thirst is a lagging indicator of dehydration",
          "Only after heavy lifting sections of the assignment",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "What should you do on break to help your body recover best?",
        options: [
          "Check your rate numbers and plan strategy for the second half",
          "Sit completely still to conserve all remaining energy",
          "Eat, drink water, and walk lightly to keep muscles loose",
          "Stretch aggressively for the full break period",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: "pallet-jack",
    title: "Poor Pallet Jack Handling",
    riskLevel: "high",
    category: "Safety & Skills",
    heroLine: "Your pallet jack weighs hundreds of pounds loaded — control it or it controls you.",
    novaLine: "Control the handle. Slow at intersections. Center in the aisle. Always.",
    novaIntro:
      "Welcome to Pallet Jack coaching. The pallet jack is the selector's primary tool — and it is also the most dangerous piece of equipment you will operate every day. Handling it poorly causes collisions, injuries, damaged shelving, and safety incidents. This session covers the habits that keep you and everyone around you safe. When you are ready, click Ready.",
    whyItHappens:
      "Poor pallet jack habits develop from two sources. First, insufficient initial training — selectors are shown how to operate the jack but not given enough time to develop precise control habits before being sent to the floor. Second, familiarity breeds carelessness — after a few weeks, the jack feels like a natural extension of movement, and the selector starts taking shortcuts. They release the handle at corners. They skip the slow-down at intersections because they've made that corner a hundred times. They coast into position instead of guiding. These small shortcuts accumulate until an incident happens.",
    whatGoesWrong:
      "A loaded pallet jack carries 1,000–2,000 pounds of product. When it loses control — at an intersection, on a slope, when released — the consequences are serious. It can clip shelving and send cases falling. It can collide with a forklift driver crossing an aisle. It can pin a selector against a rack. It can clip another worker in a crossway. Any of these incidents triggers a safety investigation, a report, a potentially serious injury, and a significant impact on the selector's employment record. Safety incidents are taken more seriously than any accuracy or performance metric in most facilities.",
    fixSteps: [
      "NEVER release the handle when the jack is in motion. Keep your hand on the handle from the moment you start moving to the moment you stop completely.",
      "At every aisle intersection — every single one, every time — slow down deliberately. You cannot see what is coming from the crossing aisle. Treat every intersection as if a forklift might be there.",
      "Keep the jack centered in the aisle at all times. A jack that drifts to one side is harder to control and more likely to clip shelving or create a collision path.",
      "When stopping on any incline or near a dock edge, engage the handle fully and ensure the jack is locked before stepping away from it.",
      "Never stand on the forks, the pallet, or the platform while the jack is moving. This is an absolute rule with no exceptions.",
      "When repositioning your jack in a tight space — like turning in an aisle — slow all the way down and use short, controlled movements. Do not muscle it through quickly.",
      "Always yield to forklifts. The forklift operator has limited visibility. Do not assume they see you. Stop, make eye contact, and let them pass.",
    ],
    coachingScript: `The pallet jack weighs hundreds of pounds when loaded.

It does not stop on its own.
It does not care that you were in a hurry.
It does not care that you've made that corner a hundred times.

Let me show you what poor control looks like.

You are moving through the warehouse.
Good pace.
You are approaching the intersection of aisles 14 and 20.

You have been through this intersection dozens of times.
No problem ever.

So you don't slow down this time.

The jack drifts slightly to the right as you turn.
You correct with the handle — a little late.

The right side clips the bottom shelf.

Four cases fall.
One of them breaks open.
Product is on the floor.

A dock worker around the corner narrowly misses being hit.

The dock stops.
A safety supervisor comes.
A report is filed.
Video is reviewed.

Everything you built with two weeks of good picking
is now secondary to a safety incident.

And you did not think that intersection was dangerous.
You had been through it a hundred times.
That is exactly why it happened.

Now watch the right way.

You approach the intersection of aisles 14 and 20.

You slow down. Deliberately.
Every time. No exceptions.

You keep the handle in your hand.
You look left, you look right.
The aisle is clear.

You guide the jack through the corner — controlled, centered.

No drift.
No clip.
No incident.

Clean pass.

You keep moving.

Here is what selectors sometimes forget:

A forklift operator has very limited side visibility.
When they come through an intersection, they may not see you.
They are operating a machine that weighs several tons.
If you are moving fast through an intersection…
and a forklift is crossing…
the forklift always wins.

That is not a scenario you want to test.

Slow at every intersection.
Every single one.
Every single time.

That rule protects you.
It protects your coworkers.
It protects the dock.

Remember this:

Control the handle.
Slow at intersections.
Center in the aisle.
Never stand on the forks.

Always.

Not when you remember.
Not when it feels necessary.

Always.`,
    scenario: {
      assignment: "Assignment 251746",
      location: "Intersection of Aisles 14 and 20",
      issue: "Took a familiar intersection at full speed — jack drifted and clipped shelving",
      wrongFlow: [
        "Approached familiar intersection at full pace — no slowdown",
        "Handle released briefly while steering through turn",
        "Jack drifted right — clipped lower shelf bracket",
        "Four cases fell — one broke open on the dock floor",
        "Dock worker nearby narrowly avoided being hit",
        "Dock stopped — safety supervisor responded",
        "Safety incident report filed — video reviewed",
      ],
      correctFlow: [
        "Approached intersection — deliberately slowed before the corner",
        "Kept hand on handle throughout the turn",
        "Checked left and right before proceeding",
        "Guided jack through centered — no drift",
        "Full control maintained — clean pass",
        "No incident, no report, dock continued without interruption",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When should you slow down at aisle intersections?",
        options: [
          "Only when forklift activity is high during busy periods",
          "Every single time — no exceptions, regardless of how familiar the intersection is",
          "When you can see another person coming toward you",
          "Only in cooler and freezer zones where visibility is reduced",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "The most dangerous pallet jack error is:",
        options: [
          "Moving too slowly in open aisles",
          "Releasing the handle while the jack is still in motion",
          "Keeping it centered in the aisle at all times",
          "Stopping to reposition frequently during an assignment",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "A forklift is approaching an intersection at the same time as you. You should:",
        options: [
          "Speed up to clear the intersection before the forklift arrives",
          "Stop, make eye contact with the operator, and let the forklift pass",
          "Honk or shout to warn the forklift operator",
          "Continue through — forklift operators are trained to yield to selectors",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "Should you ever stand on the forks or pallet while the jack is moving?",
        options: [
          "Yes — for short distances where walking alongside takes more time",
          "Yes — if you need elevated visibility over tall product",
          "Only with a spotter walking alongside you",
          "No — never, for any reason, under any circumstances",
        ],
        correctIndex: 3,
      },
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: "speed-only",
    title: "Focusing Only on Speed",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "Rate is not just speed — it is speed plus accuracy plus quality.",
    novaLine: "Build right habits first. Speed follows habits.",
    novaIntro:
      "Welcome to Balanced Performance coaching. Chasing speed at the cost of accuracy, safety, and pallet quality is a mistake that top selectors never make. The best performers in any facility are not the fastest — they are the most consistently correct at a fast pace. This session explains the real math behind performance scoring. When you are ready, click Ready.",
    whyItHappens:
      "When new selectors hear 'hit your rate,' they hear 'go fast.' Rate becomes the single number they focus on, and everything else — accuracy, pallet quality, safety compliance — becomes secondary to moving faster. The problem is that rate is never the only metric being tracked. Accuracy is logged per assignment. Quality is reviewed per pallet. Safety compliance is monitored on camera. A selector who hits 110% rate with six mispicks on the same shift has not outperformed their target — they have created significant cost that exceeds the value of the extra speed.",
    whatGoesWrong:
      "Mispicks spike when speed is the only focus because confirmations get skipped or rushed. Pallets get built poorly because there is no time taken for weight consideration or interlocking. Safety steps get skipped because they feel like delays. The selector's overall performance score — which includes accuracy, quality, and safety alongside rate — often suffers despite the high rate number. Each mispick triggers a correction that takes 5–15 minutes of someone else's time. Each quality flag requires pallet inspection. Each safety deviation creates risk. The net result is almost always more time lost to corrections than was saved by moving faster.",
    fixSteps: [
      "Think of your performance score as three numbers, not one: rate + accuracy + quality. All three need to be strong, every shift.",
      "A selector at 95% rate with 99% accuracy and clean pallets is more valuable and more promotable than one at 105% with four mispicks and two quality flags.",
      "Every mispick costs 5–15 minutes of correction time — usually more than was saved by rushing. The math consistently works against speed-only selectors.",
      "Build your habits correctly first. When the right habits are automatic — correct confirmation, proper stacking, controlled transitions — speed develops naturally within those habits.",
      "Set a personal standard: zero mispicks per shift. Not 'low mispicks' — zero. That standard forces the discipline that eventually produces elite performance.",
      "When you feel rushed and sense that you are about to skip a step — stop. Take the one second the step requires. That second prevents the 10-minute correction.",
      "After every shift, check your accuracy report, not just your rate. A high rate with accuracy events is not a good shift — it is an expensive one.",
    ],
    coachingScript: `The best selectors in this facility are not the reckless ones.

They are the disciplined ones.

Let me show you the real math behind speed-only picking.

A selector hits 105% rate on a shift.
Impressive number. Supervisor notices.

But here is the rest of the scorecard:

6 mispicks.
2 pallet quality flags.

Now the math.

Each mispick triggers a correction.
Someone has to identify the error, pull the order, re-pick the correct item, update the inventory, and contact the store.

That process takes, on average, 8–12 minutes per event.

6 mispicks × 10 minutes = 60 minutes of correction time.

The rate gain from 105% vs 97% on a full shift?
About 8 minutes.

So this selector ran hard, hit 105%, and created 60 minutes of correction work to gain 8 minutes.

They cost the operation 52 minutes net.

That is not performance.
That is expensive speed.

Now the disciplined selector.

97% rate.
Zero mispicks.
All pallets passed quality.

No corrections.
No cleanup.
No reports.

Net time advantage to the operation: significantly better than the 105% selector.

And here is what happens long-term:

The 97%-with-zero-errors selector gets trusted with better assignments.
Gets considered for trainer positions.
Gets recommended for advancement.

The 105%-with-errors selector gets extra coaching sessions.
Gets flagged for accuracy review.
And eventually — if the errors continue — gets a formal performance plan.

The number on the rate screen is not the whole story.

Here is the most important thing to understand:

You cannot build speed on a foundation of bad habits.

The fastest selectors in any facility built their speed on top of disciplined habits.
They confirmed every code.
They counted every case.
They placed every item with intention.

And then they got faster within those habits.

Speed without discipline has a ceiling.
Speed with discipline has no ceiling.

Remember this:

Build the habits first.
Accuracy.
Quality.
Safety.

Speed follows habits.
Always.`,
    scenario: {
      assignment: "Assignment 251747",
      location: "Full 8-hour shift",
      issue: "105% rate — same shift produced 6 mispicks and 2 pallet quality flags",
      wrongFlow: [
        "Focused exclusively on rate number — skipped careful confirmations for speed",
        "6 mispicks — skipped or rushed check code steps",
        "2 pallet quality flags — no time taken for weight-aware stacking",
        "Each mispick triggered 10-minute correction: 60 minutes of correction labor created",
        "Rate gain vs 97% pace: approximately 8 minutes saved",
        "Net result: cost operation 52 minutes — despite impressive rate number",
        "Accuracy review triggered — formal coaching added to record",
      ],
      correctFlow: [
        "Targeted 97% rate with disciplined habits — confirmation every stop",
        "Zero mispicks — no correction labor generated",
        "All pallets passed quality check — no flags",
        "No correction time lost — operation ran cleanly",
        "Overall performance score: strong across all three metrics",
        "Trusted for better assignments — advancement track considered",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "A selector at 105% rate with 6 mispicks is best described as:",
        options: [
          "A top performer — rate is the primary metric",
          "A liability — the errors created more lost time than the speed gained",
          "Average performance that needs rate improvement",
          "A model for new selectors to follow",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "What is the correct definition of strong picking performance?",
        options: [
          "The highest rate number possible, regardless of accuracy",
          "Speed combined with accuracy and pallet quality — all three categories together",
          "Rate alone — the other metrics are secondary when you are fast",
          "The most cases per shift, regardless of order accuracy",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "Each mispick correction typically costs:",
        options: [
          "About 30 seconds — barely noticeable",
          "About 2 minutes — minor if it happens rarely",
          "8–12 minutes of someone's labor — often more than was saved by the speed that caused it",
          "Nothing — stores handle their own receiving adjustments",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "Why do the best selectors not lead with speed as their primary goal?",
        options: [
          "They are naturally cautious and not aggressive enough to chase rate",
          "Their facility does not track rate as a primary metric",
          "Speed built on bad habits has a ceiling — speed built on disciplined habits grows without limit",
          "They prioritize job security over performance",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: "layout",
    title: "Not Learning the Layout",
    riskLevel: "medium",
    category: "Performance",
    heroLine: "NOVA gives the address — you must know the city.",
    novaLine: "Know your aisles. Know your product. Move with confidence.",
    novaIntro:
      "Welcome to Layout Knowledge coaching. Selectors who know their facility do not move faster individually — they eliminate hesitation at every transition. Hesitation is time. And in warehouse picking, time is rate. This session covers how facility knowledge becomes a direct performance multiplier and what to do to develop it. When you are ready, click Ready.",
    whyItHappens:
      "Most selectors receive very limited facility orientation. They are shown the main aisles, the dock area, the printer stations, and then they are put on an assignment. They rely entirely on NOVA for navigation — aisle, slot, quantity. They never develop an independent mental map of the facility. The result is that every aisle change, every zone transition, every new area involves a moment of orientation — a pause to figure out where they are going. That pause is small. But it happens at every transition throughout the entire shift.",
    whatGoesWrong:
      "Selectors who do not know the facility hesitate at aisle transitions, slow down when entering unfamiliar zones, and cannot pre-stage movements because they do not know what aisle 18 looks like before they get there. They also cannot anticipate product type — if you know that aisles 17–22 are the beverage zone, you know those pallets need heavy-bottom builds. Without that knowledge, every stop is a surprise that requires extra decision-making time. Across a full shift, this uncertainty costs 3–5 minutes of rate that could be entirely eliminated.",
    fixSteps: [
      "Spend 20–30 minutes walking the facility before or after your first 5 shifts with your assignment in hand. Learn which aisles contain which products. Map it in your head.",
      "Memorize the aisle numbering direction — does aisle number increase left to right or right to left? Does it wrap around the facility? Knowing this helps you navigate without thinking.",
      "Learn the zone structure — beverages, dry goods, dairy, frozen, paper products. Knowing the zones helps you predict pallet build requirements before you arrive at the slot.",
      "Learn the locations of key reference points: printer stations, dock doors, supervisor desk, restrooms, break room. These give you mental anchors for the facility map.",
      "After your first 30 days, you should be able to close your eyes and describe the route from any aisle to any other aisle. That is the standard to aim for.",
      "When you get a new assignment in an area you don't know well, spend 30 seconds before starting to orient yourself. Walk through the assigned aisles once. This investment pays off over the full assignment.",
      "Ask experienced selectors about the facility. Most veterans know details — where the tricky slots are, which aisles have low overheads, where the floor is uneven. This knowledge is valuable.",
    ],
    coachingScript: `NOVA gives you the address.
But you have to know the city.

Let me show you what that means in real picking terms.

You are two weeks in. On assignment.

NOVA says: Aisle 18, slot 112.

You hear: Aisle 18.

Where is aisle 18?

You look around.
You are in aisle 23 right now.
Aisle 18 is… that way? Or is it the other way?

You walk to the main aisle to look for the number signs.
You find aisle 18. You head down.
Slot 112. You look left and right.

You find slot 112.

That whole process took 8 seconds longer than it needed to.

Now imagine that happening at every aisle transition.
Every zone change.
Every time you cross to a new section.

50 stops. 8 extra seconds each.

400 seconds. Over 6 minutes.

Lost to not knowing your city.

Now watch the experienced selector.

NOVA says: Aisle 18, slot 112.

They hear: Aisle 18.

They already know aisle 18.
It is in the beverage zone — six aisles to their left.
They are already moving left before NOVA finishes speaking.

Slot 112 — they know the slot numbering in that aisle increases toward the back.
They know the product — beverages, so heavy-bottom build.

They arrive at the slot already knowing everything they need.
No orientation.
No searching.
No hesitation.

Zero extra seconds.

That difference — accumulated across 50 stops — is 6 minutes of rate.

Six minutes.
Just from knowing where things are.

Here is how to build this knowledge fast.

After each of your first 10 shifts, spend 10 minutes walking the warehouse.
Not picking. Just walking.
Reading aisle numbers.
Looking at product types.
Building your mental map.

Within 30 days, the facility will stop feeling like a maze and start feeling like a known environment.

When aisle 18 instantly means 'beverages, left side, heavy product' —
you are in a completely different performance position than the selector who still needs to locate it.

Remember this:

If you don't know the floor, you will always feel slow.
If you learn the floor, you move with confidence.

Learn your aisles.
Learn your zones.
Learn your product.

That knowledge pays on every single pick.`,
    scenario: {
      assignment: "Assignment 251748",
      location: "Aisle 18 · Slot 112",
      issue: "Consistently hesitated 6–8 seconds at every aisle transition — did not know facility layout",
      wrongFlow: [
        "NOVA said aisle 18 — did not immediately know where aisle 18 was",
        "Had to return to main aisle to find numbering sign each time",
        "Did not know product type — could not pre-plan pallet build approach",
        "8 extra seconds of orientation at every aisle transition",
        "50 stops × 8 sec = 6+ minutes lost to orientation hesitation",
        "Rate 12% below target — pace felt fine but transitions cost the time",
      ],
      correctFlow: [
        "NOVA said aisle 18 — immediately knew it was the beverage zone, six aisles left",
        "Already moving before NOVA finished speaking the slot number",
        "Knew product type in advance — prepared pallet build approach en route",
        "Zero orientation time — moved directly and confidently",
        "50 stops with no navigation hesitation",
        "Rate on target — 6+ minutes of dead time eliminated",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "NOVA gives you an aisle number. What should happen as NOVA speaks it?",
        options: [
          "Write it down before moving to ensure accuracy",
          "Stand still until NOVA finishes the complete instruction",
          "Already begin moving in the direction of that aisle if you know the layout",
          "Ask a nearby selector to confirm the aisle location",
        ],
        correctIndex: 2,
      },
      {
        id: "q2",
        question: "Knowing your warehouse zone structure helps you:",
        options: [
          "Pick more cases at each individual slot",
          "Predict product type and pallet build approach before you arrive at the slot",
          "Change your assigned picking route",
          "Complete your break faster",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "How long should deliberate facility learning take before you feel truly comfortable?",
        options: [
          "A full year — facilities are very complex and take time",
          "About 30 days of walking aisles and paying deliberate attention",
          "NOVA handles all navigation — facility knowledge is not needed",
          "You learn it automatically with no deliberate effort needed",
        ],
        correctIndex: 1,
      },
      {
        id: "q4",
        question: "Not knowing the facility layout costs a selector approximately how much time per shift?",
        options: [
          "About 30 seconds — negligible in a full shift",
          "About 1 minute — minor and manageable",
          "3–6 minutes — from small hesitations that compound across all transitions",
          "It varies too much to estimate meaningfully",
        ],
        correctIndex: 2,
      },
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: "giving-up",
    title: "Giving Up Too Early",
    riskLevel: "medium",
    category: "Mindset",
    heroLine: "The job gets easier — but only if you stay long enough to see it.",
    novaLine: "Week two is hard. Week four is different. Stay through it.",
    novaIntro:
      "Welcome to Resilience coaching. Most selectors who quit do so in the first three weeks — right before the learning curve turns in their favor. This session explains the actual learning curve for warehouse picking, why it feels impossible before it gets easier, and the specific mindset strategies that help you get through the hard weeks and reach the point where this job becomes natural. When you are ready, click Ready.",
    whyItHappens:
      "The job is physically and mentally harder than expected in weeks one and two. The body is not adapted to the physical demands. The mind is actively learning the system, the route, the product, and the habits simultaneously. Rate feels impossibly far from target. Every veteran selector looks like they are operating on a completely different level. The selector's brain — which naturally seeks patterns and confirmation — finds evidence that the job is too hard and signals that quitting is rational. What it cannot show them is what week four looks like. And week four looks completely different from week two.",
    whatGoesWrong:
      "The selector quits in week two — right at the hardest point on the learning curve, right before the inflection point where habits start to lock in and the body starts to adapt. The physical soreness peaks in week two. The mental load peaks in week two. Rate is at its lowest relative to target in week two. Every indicator points to 'this is not working.' But the data on selectors who stay through week three is consistent: week three starts to feel different. Week four is noticeably easier. Week six, most selectors report that the job no longer feels hard. The ones who quit at day eleven never discover this.",
    fixSteps: [
      "Commit to 30 days before making any evaluation of whether this job is right for you. One month. That is the minimum period to give the learning curve time to work.",
      "Stop comparing yourself to veteran selectors. They have 6–18 months of body adaptation and route knowledge. You have two weeks. The comparison is not valid.",
      "Track your own progress against your own week-one performance only. Are you faster than day one? Yes. That is what growth looks like in this phase.",
      "Rate improvement is not linear — it jumps. There will be flat periods where you feel stuck. Those flat periods are when the learning is consolidating before the next jump.",
      "Talk to your trainer when you are struggling. You are not the first person to feel this way in week two. Every trainer has helped someone through exactly what you are experiencing.",
      "Pick one small habit to improve every shift — not rate, not overall performance, just one habit. Confirmation discipline. Counting by touch. Transition speed. Small habits compound.",
      "Remember: the selectors hitting 100%+ in this facility all had a week two. Every single one. The difference is they did not leave before week four.",
    ],
    coachingScript: `Every top selector in this facility had a week two.

Every single one of them.

The ones hitting 110% consistently right now —
they are not naturally gifted.
They are not physically exceptional.

They are the ones who stayed.

Let me show you what the learning curve actually looks like.

Week one:
Everything is new. Rate is very low. Body is very sore.
Every slot takes extra time. Every aisle transition requires thought.
The system feels overwhelming.

This is normal. Every selector starts here.

Week two:
The hardest week.
The soreness peaks.
The rate gap feels widest.
Most selectors quit here.

They quit right here.
Right before everything starts to change.

Week three:
Your body starts to adapt.
Movements become slightly more automatic.
The soreness is less severe.
You start remembering aisle locations.

Week four:
The route starts to lock in.
You are pre-staging more.
Rate is moving.
You know your slot zones.

Week six:
The job stops feeling hard.
You have a rhythm.
The habits that felt awkward now feel natural.

Month three:
You are the selector that new hires look at and think:
'I will never be that good.'

And one day you will tell them:
'I almost quit in week two.'

Now here is the critical mindset shift that gets you through the hard weeks.

Stop comparing yourself to veterans.
Start comparing yourself to your own week one.

Are you faster than day one? Yes.
Does the system make more sense than it did? Yes.
Is your body handling the physical load better? Yes.

That is growth.

Real growth.
Even if it does not look like much yet.

Here is a technique that works:

After every shift in weeks two and three —
pick ONE thing that was better than yesterday.

Not rate. Not overall performance. Just one thing.

Maybe you counted aloud more consistently.
Maybe you caught yourself before overthinking a pick.
Maybe one transition felt smoother.

That one thing is real progress.
And it compounds.

Ten small improvements in ten shifts become a significant performance jump.

Here is the number that matters most:

Selectors who reach day 45 have an extremely high rate of becoming long-term performers.
Selectors who quit before day 21 never find out what they were capable of.

The difference between those two groups is almost never talent.
It is the decision to stay through the hard week.

Remember this:

The job gets easier.
But only if you stay long enough to see it.

Stay through week two.
Get to week four.

That is when everything changes.`,
    scenario: {
      assignment: "30-Day Journey",
      location: "Week 2 · Day 11 — the hardest point on the learning curve",
      issue: "Rate at 68%, body still sore, comparing to veterans, considering quitting",
      wrongFlow: [
        "Week 2, Day 11: rate at 68% — feels impossible to close the gap",
        "Body soreness at its peak — every shift feels harder than the last",
        "Compared self to veterans — they look unreachably skilled",
        "Decided the job is not right for them — resigned on day 12",
        "Never experienced week 3 adaptation or week 4 rhythm lock-in",
        "Never reached the inflection point that all staying selectors describe",
        "Never found out they were capable of 95%+ performance",
      ],
      correctFlow: [
        "Week 2, Day 11: committed to 30-day minimum evaluation",
        "Stopped comparing to veterans — tracked own progress vs day one only",
        "Talked to trainer: learned that week 2 is everyone's hardest week",
        "Week 3: body adapted — soreness dropped significantly",
        "Week 4: route starting to lock in — rate jumped to 82%",
        "Week 6: rhythm established — job no longer feels hard",
        "Day 45: consistently hitting 96% — trainer considers them for mentor role",
      ],
    },
    questions: [
      {
        id: "q1",
        question: "When do most selectors who quit do so, relative to the learning curve?",
        options: [
          "After they have confirmed they hit a permanent performance ceiling",
          "Right before the curve improves — in weeks one through three",
          "After months of consistently strong performance",
          "On their very first shift after assessing the job",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        question: "Rate improvement during the first 30 days typically follows which pattern?",
        options: [
          "Steady and linear — a predictable small improvement each shift",
          "Jumpy — flat or difficult periods followed by sudden noticeable jumps",
          "Declining first, then recovering after the first month",
          "Random with no recognizable pattern",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        question: "The most productive mindset during a difficult week two is:",
        options: [
          "Compare yourself to veteran selectors daily for motivation and benchmarks",
          "Evaluate each shift's rate number and decide based on the trend",
          "Track one small specific habit improvement per shift — not rate",
          "Focus intensely on the rate number until it reaches target",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "Selectors who stay through week two and into week four most commonly report:",
        options: [
          "That the job was always this hard and they just learned to tolerate it",
          "That week four felt noticeably different — easier, more rhythmic, and manageable",
          "That rate never actually improved — they just got used to being below target",
          "That they regret not quitting sooner",
        ],
        correctIndex: 1,
      },
      {
        id: "q5",
        question: "What is the minimum commitment period recommended before evaluating whether to continue?",
        options: [
          "3 days — enough to know if the job suits you physically",
          "1 week — the soreness peak tells you everything about long-term viability",
          "30 days — the minimum for the learning curve to show its full shape",
          "3 months — meaningful assessment requires a full quarter of data",
        ],
        correctIndex: 2,
      },
    ],
  },
];

export function getMistakeById(id: string): MistakeData | undefined {
  return MISTAKES.find(m => m.id === id);
}
