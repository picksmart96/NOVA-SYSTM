export interface MistakeQuestion {
  id: string;
  question: string;
  correctAnswer: "yes" | "no";
}

export interface MistakeData {
  id: string;
  title: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  category: string;
  novaIntro: string;
  whyItHappens: string;
  whatGoesWrong: string;
  fixSteps: string[];
  coachingScript: string;
  questions: MistakeQuestion[];
}

export const MISTAKES: MistakeData[] = [
  {
    id: "mispick",
    title: "Mispick — Wrong Item",
    riskLevel: "critical",
    category: "Accuracy",
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
    coachingScript:
      "The selector who never mispicks is not fast — they are disciplined. Confirm before you grab. Read before you reach. One second of confirmation prevents five minutes of error correction. Your check code is your accuracy guarantee. Use it.",
    questions: [
      {
        id: "q1",
        question: "Should you confirm the check code before picking any case?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it safe to pick by memory if you've been in the same aisle many times?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you stop and re-read if the product looks different from what you expect?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Can you skip the check code step if you are running behind on pace?",
        correctAnswer: "no",
      },
    ],
  },
  {
    id: "short-pick",
    title: "Short Pick — Missing Quantity",
    riskLevel: "high",
    category: "Accuracy",
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
    coachingScript:
      "Short picks are quiet mistakes. NOVA moves on, the session continues — but the store gets shorted and you get flagged. Count every case. If you're not sure of the number, repeat before you pick. One missing case per stop across ten assignments adds up to a real accuracy problem.",
    questions: [
      {
        id: "q1",
        question: "Should you count each case aloud as you place it on the pallet?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it acceptable to estimate quantity if the slot looks like it has enough?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you ask NOVA to repeat the quantity if you did not hear it clearly?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "over-pick",
    title: "Over Pick — Extra Quantity",
    riskLevel: "high",
    category: "Accuracy",
    novaIntro:
      "Welcome to Over Pick coaching. Picking too many cases is just as wrong as picking too few. Both are flagged as accuracy errors. When you are ready, click Ready.",
    whyItHappens:
      "Over picks happen when a selector assumes they should grab more, doesn't stop counting at the right number, or tries to be helpful by emptying a nearly-empty slot.",
    whatGoesWrong:
      "The store receives more than ordered. Inventory counts go off. Receiving gets confused. Extra cases have to be returned or reshipped. The selector's accuracy record shows an over-pick error.",
    fixSteps: [
      "Stop exactly at the quantity NOVA gave you — not one more.",
      "Do not empty a slot just because it's almost empty. Pick exactly what was ordered.",
      "Re-count after placing — if you have too many, put one back before saying ready.",
      "Never round up to save a future trip. Pick precisely.",
      "If the quantity NOVA gives seems wrong, say 'repeat' to confirm — do not add your own judgment.",
    ],
    coachingScript:
      "An over-pick seems harmless — you gave them more. But it throws off inventory, receipts, and store ordering for every item that store tracks. Be exact. NOVA gives you the right number for a reason. Your job is precision, not generosity.",
    questions: [
      {
        id: "q1",
        question: "Is it acceptable to grab an extra case if the slot is almost empty?",
        correctAnswer: "no",
      },
      {
        id: "q2",
        question: "Should you re-count after placing to confirm you didn't over-pick?",
        correctAnswer: "yes",
      },
      {
        id: "q3",
        question: "Does over-picking cause inventory and receiving problems for the store?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "bad-stacking",
    title: "Bad Stacking — Crush Damage",
    riskLevel: "critical",
    category: "Pallet Quality",
    novaIntro:
      "Welcome to Bad Stacking coaching. Placing heavy items on fragile ones causes crush damage in transit. This is one of the most expensive selector errors. When you are ready, click Ready.",
    whyItHappens:
      "Bad stacking happens when a selector loads too fast without thinking about case weight, or puts the next case wherever it fits rather than where it belongs.",
    whatGoesWrong:
      "Fragile product is destroyed in the truck or at the store. The store receives damaged goods that can't be sold. Claims are filed. The selector's damage record is noted. Repeated events lead to coaching and write-ups.",
    fixSteps: [
      "Heavy goes on the bottom — water, canned goods, jars, bottles.",
      "Medium weight goes in the middle — dry groceries, cereals, containers.",
      "Fragile and light goes on top — bread, chips, eggs, paper goods.",
      "Never place anything heavy on top of a soft, crushable case.",
      "When in doubt about weight order, feel the case before placing it.",
    ],
    coachingScript:
      "A damaged product costs the company money. It costs the store shelf availability. It costs the selector their damage record. Think weight, not speed. The right place for every case takes one extra second of thought. That second prevents a claim worth hundreds of dollars.",
    questions: [
      {
        id: "q1",
        question: "Should heavy cases always go on the bottom of the pallet?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it acceptable to place a case of water on top of a case of bread?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you think about case weight before placing each one?",
        correctAnswer: "yes",
      },
      {
        id: "q4",
        question: "Is crush damage considered a minor accuracy issue with no consequences?",
        correctAnswer: "no",
      },
    ],
  },
  {
    id: "poor-stacking",
    title: "Stacking Poorly — Unstable Build",
    riskLevel: "high",
    category: "Pallet Quality",
    novaIntro:
      "Welcome to Unstable Build coaching. A pallet that leans, tips, or collapses is dangerous and expensive. This session teaches you how to build solid, locked pallets. When you are ready, click Ready.",
    whyItHappens:
      "Unstable pallets happen when a selector stacks in straight vertical columns, leaves gaps in layers, or builds too tall and narrow instead of wide and interlocked.",
    whatGoesWrong:
      "A leaning pallet falls in transit, on the dock, or in the store. Product is damaged or destroyed. Someone could be injured. The selector's quality record is flagged. Delivery is delayed.",
    fixSteps: [
      "Interlock your layers like bricks — each case overlaps two cases below it.",
      "Never stack in straight columns — columns collapse. Bricks don't.",
      "Fill each layer as completely as possible before starting the next.",
      "Keep the build wide and even — do not let one side get taller than the other.",
      "Stay under 60 inches total height. A tall, narrow pallet is a falling pallet.",
    ],
    coachingScript:
      "A falling pallet is a liability. It hurts people, destroys product, and holds up the dock. Build your pallet the way a bricklayer builds a wall — interlocked, even, and solid. Slow down for five seconds to place each layer correctly. That five seconds saves everyone an hour of cleanup.",
    questions: [
      {
        id: "q1",
        question: "Should you interlock cases like bricks rather than stacking in straight columns?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it safe to let one side of the pallet get significantly taller than the other?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you fill each layer completely before starting the next?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "slow-transitions",
    title: "Moving Too Slow Between Picks",
    riskLevel: "medium",
    category: "Performance",
    novaIntro:
      "Welcome to Transition Speed coaching. Most selectors lose time between stops — not at the shelf. This session shows you where the seconds go and how to get them back. When you are ready, click Ready.",
    whyItHappens:
      "Slow transitions happen when a selector takes too long to reposition their pallet jack, walks slowly between slots, or pauses between NOVA confirmation and movement.",
    whatGoesWrong:
      "Rate falls. The selector falls behind pace. What should be a 90-minute assignment takes 110 minutes. Rate reports show a gap that the selector can't explain because it isn't one big pause — it's 50 small ones.",
    fixSteps: [
      "The moment NOVA confirms 'grab', you should already be moving.",
      "Keep your pallet jack in the center of the aisle — reposition it every 5–8 stops.",
      "Pre-stage yourself at the next slot while NOVA is still talking.",
      "Move at a consistent pace — not sprinting, not strolling. Constant forward motion.",
      "Check your pace indicator every 10 stops. If you're behind, tighten your transitions.",
    ],
    coachingScript:
      "The fastest selectors are not picking faster — they are stopping less. Every pause between stops adds up. At 50 stops, ten extra seconds per transition is over eight minutes lost. Speed is not about rushing the pick. It's about never stopping between picks.",
    questions: [
      {
        id: "q1",
        question: "Should you start moving toward the next slot before NOVA finishes speaking?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is losing 10 seconds per stop negligible over a full assignment?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should your pallet jack be repositioned regularly throughout the aisle?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "overthinking",
    title: "Overthinking Picks",
    riskLevel: "medium",
    category: "Performance",
    novaIntro:
      "Welcome to Overthinking coaching. Second-guessing yourself on every pick slows you down without improving accuracy. This session teaches you to trust your training. When you are ready, click Ready.",
    whyItHappens:
      "Overthinking happens with newer selectors who double-check unnecessarily, re-confirm things already confirmed, or freeze briefly between picking and placing each case.",
    whatGoesWrong:
      "Unnecessary hesitation adds seconds per stop. A selector gets into their own head, falls behind on pace, becomes anxious about rate, then hesitates more. The cycle feeds itself.",
    fixSteps: [
      "Trust your check code confirmation — once confirmed, grab without second-guessing.",
      "Build your pick routine and execute it the same way every time.",
      "If something looks genuinely wrong, say 'repeat' — but don't call repeat out of anxiety.",
      "Accept that occasional errors happen. Focus on the process, not the outcome, each stop.",
      "Set a mental rule: code confirmed = grab. No extra pause. No re-read.",
    ],
    coachingScript:
      "Confidence and accuracy are not opposites. Experienced selectors move fast because they trust their training. You confirmed the code. You know the quantity. Trust your process and move. Hesitation is not caution — it's wasted time dressed up as caution.",
    questions: [
      {
        id: "q1",
        question: "After confirming the check code, should you grab immediately without second-guessing?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is 'repeat' a good response to anxiety rather than genuine uncertainty?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Does building a consistent pick routine help reduce overthinking?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "not-preparing",
    title: "Not Preparing the Next Move",
    riskLevel: "medium",
    category: "Performance",
    novaIntro:
      "Welcome to Pre-Staging coaching. Top selectors are always one step ahead of NOVA. This session teaches you to prepare your next move before you finish the current one. When you are ready, click Ready.",
    whyItHappens:
      "Selectors wait for NOVA to finish speaking before moving, stand flat-footed while listening, and treat each stop as a separate task instead of a flowing sequence.",
    whatGoesWrong:
      "The selector is always reacting instead of anticipating. NOVA finishes speaking and the selector is still in the wrong position. Pace suffers because there's always a gap between instruction and movement.",
    fixSteps: [
      "While NOVA speaks, position your body toward the next expected slot.",
      "Know your aisle direction — if you're moving up the aisle, pre-stage your weight toward the next slot.",
      "Finish placing the last case from the current stop as NOVA begins the next prompt.",
      "Keep your eyes scanning forward while your hands finish the current task.",
      "Think of picking as a rhythm, not a sequence of stops.",
    ],
    coachingScript:
      "The best selectors are never surprised by NOVA. They know what direction they are going. They know roughly where the next slot is. By the time NOVA says the aisle number, they are already moving. Pre-staging is the habit that separates 85% selectors from 100% selectors.",
    questions: [
      {
        id: "q1",
        question: "Should you begin moving toward the next slot while NOVA is still speaking?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is waiting for NOVA to finish before moving acceptable for top performance?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should picking feel like a continuous rhythm rather than isolated stops?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "ergonomics",
    title: "Ignoring Ergonomics",
    riskLevel: "high",
    category: "Safety & Health",
    novaIntro:
      "Welcome to Ergonomics coaching. Poor body mechanics lead to injuries that end careers early. This session covers the physical habits that protect your body long-term. When you are ready, click Ready.",
    whyItHappens:
      "Selectors ignore ergonomics because they prioritize speed over body position, or because they were never taught proper mechanics and have developed bad habits.",
    whatGoesWrong:
      "Back injuries, knee strain, shoulder pain, and repetitive stress injuries. Many selectors leave the job in their first two years due to physical breakdown caused by poor mechanics. An injured selector cannot work.",
    fixSteps: [
      "Bend your knees on every lift — even small cases on low shelves.",
      "Keep your back straight and your core engaged when picking from floor-level slots.",
      "For high slots, use your legs to elevate — do not reach with your back.",
      "Rotate your tasks — do not pick from floor level for ten stops in a row without a posture reset.",
      "Stretch your lower back, knees, and shoulders before and after every shift.",
    ],
    coachingScript:
      "Your body is your tool. Every selector who ignored ergonomics and thought they were too young or too tough to get hurt eventually learned otherwise — usually on shift three or four of a rough week. Protect your back. Bend your knees. This job can last a decade or it can last a year. Ergonomics is the difference.",
    questions: [
      {
        id: "q1",
        question: "Should you bend your knees on every lift, including small cases?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it acceptable to reach and twist your back for a high slot to save time?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you stretch before and after every shift?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "skipping-breaks",
    title: "Skipping Breaks and Hydration",
    riskLevel: "high",
    category: "Safety & Health",
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
    coachingScript:
      "Breaks are not lost time. They are investment in the rest of your shift. The selector who eats at break, drinks water, and walks for five minutes is picking at 95% at hour seven. The selector who skips breaks is picking at 72% and getting worse. Protect your second half. Take your break.",
    questions: [
      {
        id: "q1",
        question: "Should you take every scheduled break even if you feel fine?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Does skipping a break significantly improve overall shift performance?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you drink water before you feel thirsty during a shift?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "pallet-jack",
    title: "Poor Pallet Jack Handling",
    riskLevel: "high",
    category: "Safety & Skills",
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
    coachingScript:
      "The pallet jack weighs hundreds of pounds loaded. It does not stop on its own. It does not care that you were in a hurry. Every selector who has had a jack-related incident was doing something they knew they should not do. Control your jack. Slow at intersections. Center in the aisle. Always.",
    questions: [
      {
        id: "q1",
        question: "Should you always maintain control of the pallet jack handle while moving?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is it safe to stand on the pallet jack forks while moving to save time?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you slow down at aisle intersections every time, not just sometimes?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "speed-only",
    title: "Focusing Only on Speed",
    riskLevel: "medium",
    category: "Performance",
    novaIntro:
      "Welcome to Balanced Performance coaching. Chasing speed at the cost of accuracy, safety, and pallet quality is a mistake that top selectors never make. When you are ready, click Ready.",
    whyItHappens:
      "New selectors hear 'hit your rate' and interpret it as 'go fast'. Speed becomes the only goal. Accuracy, safety, and pallet quality are treated as secondary.",
    whatGoesWrong:
      "Mispicks spike. Pallets are built badly. Safety steps are skipped. The selector's rate looks good on paper but their error rate and quality scores cancel the gains. Correction takes longer than the speed savings produced.",
    fixSteps: [
      "Think rate as a combination score — speed + accuracy + quality.",
      "A selector at 95% rate with 99% accuracy is more valuable than a selector at 105% with 94% accuracy.",
      "Every mispick or quality error costs time to correct — often more time than was saved by rushing.",
      "Your goal is to be reliably fast, not occasionally fast.",
      "Build the right habits first. Speed follows habits.",
    ],
    coachingScript:
      "The best selectors in this facility are not the reckless ones. They are the disciplined ones. They know their route. They confirm their codes. They build their pallets right. And they do all of it at a fast pace because the habits are locked in. Speed without discipline has a ceiling. Discipline without speed is a starting point. Build both.",
    questions: [
      {
        id: "q1",
        question: "Is a high rate with poor accuracy considered strong overall performance?",
        correctAnswer: "no",
      },
      {
        id: "q2",
        question: "Does a mispick or quality error often cost more time to correct than was saved by rushing?",
        correctAnswer: "yes",
      },
      {
        id: "q3",
        question: "Should you build correct habits first and let speed develop naturally?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "layout",
    title: "Not Learning the Layout",
    riskLevel: "medium",
    category: "Performance",
    novaIntro:
      "Welcome to Layout Knowledge coaching. Selectors who know their facility move faster — not because they are faster, but because they waste zero time on confusion. When you are ready, click Ready.",
    whyItHappens:
      "New selectors rely entirely on NOVA for direction and never invest time in learning where aisles, zones, and frequently-picked slots are. After weeks, they still move like a first-day selector.",
    whatGoesWrong:
      "Every moment of hesitation navigating the facility adds up. Selectors who don't know their layout take longer to position themselves, make more wrong turns, and can't pre-stage because they don't know where they are going.",
    fixSteps: [
      "In your first week, walk the facility before and after shifts to learn the layout.",
      "Memorize the aisle numbering direction — which end is aisle 1, which is aisle 40.",
      "Learn where the freezer zones, dock doors, and printers are without looking.",
      "Identify which aisles have dead ends and plan your path accordingly.",
      "After 30 days, you should be able to navigate any aisle without confusion.",
    ],
    coachingScript:
      "NOVA gives you the address. You have to know the city. Selectors who learn their facility move through it with confidence. They don't slow down at aisle transitions. They don't look for the printer. They don't pause at zone changes. Learn your floor. It pays every pick.",
    questions: [
      {
        id: "q1",
        question: "Should you walk the facility to learn the layout during your first week?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Is relying entirely on NOVA for navigation sufficient after the first month?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Does knowing the facility layout help you pre-stage your movements?",
        correctAnswer: "yes",
      },
    ],
  },
  {
    id: "giving-up",
    title: "Giving Up Too Early",
    riskLevel: "medium",
    category: "Mindset",
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
    coachingScript:
      "Every top selector in this facility had a week two. Every one of them thought about quitting. The ones you see hitting 110% consistently are not naturally gifted — they are the ones who stayed. Week three is when the body adapts. Week four is when the route locks in. Week six is when the job stops feeling hard. Give it that.",
    questions: [
      {
        id: "q1",
        question: "Should you compare your progress to your own week one, not to a veteran?",
        correctAnswer: "yes",
      },
      {
        id: "q2",
        question: "Does rate improvement happen in a smooth, steady line every week?",
        correctAnswer: "no",
      },
      {
        id: "q3",
        question: "Should you commit to at least 30 days before making a decision about the job?",
        correctAnswer: "yes",
      },
    ],
  },
];

export function getMistakeById(id: string): MistakeData | undefined {
  return MISTAKES.find(m => m.id === id);
}
