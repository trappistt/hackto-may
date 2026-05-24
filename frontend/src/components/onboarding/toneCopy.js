export const COACH_TONES = [
  {
    value: "friend",
    label: "A friend",
    description: "Casual and encouraging — talks like a peer who has your back."
  },
  {
    value: "mom",
    label: "A Mom",
    description: "Warm but firm — cares about you and won't let you dodge the numbers."
  },
  {
    value: "dad",
    label: "A Dad",
    description: "Straightforward and practical — focuses on the plan, not the drama."
  }
];

const TONE_LABELS = Object.fromEntries(COACH_TONES.map((t) => [t.value, t.label]));

export function toneLabel(tone) {
  return TONE_LABELS[tone] ?? tone;
}

export function profileHeading(tone) {
  const map = {
    friend: "Let's get to know you",
    mom: "Let's talk brass tacks",
    dad: "Let's talk brass tacks",
    coach: "Tell us a bit about yourself",
    companion: "Tell us a bit about yourself",
    chief_of_staff: "Tell us a bit about yourself"
  };
  return map[tone] ?? "About you";
}

export function profileLifestyleLabel(tone) {
  const map = {
    friend: "Give me a quick picture of your day-to-day",
    mom: "Tell me about your lifestyle — who depends on you?",
    dad: "Brief lifestyle facts — housing, dependents, major bills"
  };
  return map[tone] ?? "Give me a brief idea about your lifestyle";
}

export function profileSubheading(tone) {
  const map = {
    friend: "A few details so we can personalize your snapshot.",
    mom: "About you — so I know who I'm looking out for.",
    dad: "About you — facts first, then we build the plan.",
    coach: "We use this to personalize your experience.",
    companion: "We use this to personalize your experience.",
    chief_of_staff: "We use this to personalize your experience."
  };
  return map[tone] ?? "A few details so we can personalize your snapshot.";
}

export function lifeStoryHeading(tone) {
  const map = {
    friend: "What's going on in life?",
    mom: "Tell me what's happening",
    dad: "What's the situation right now?"
  };
  return map[tone] ?? "What's going on in life?";
}

export function lifeStorySubheading(tone) {
  const map = {
    friend:
      "Share whatever feels relevant — job, rent, stress. Your coach uses this for context, not judgment.",
    mom:
      "The more I understand your life right now, the better I can help with the money side. Saved with your profile.",
    dad:
      "Job changes, housing, debts — give me the facts. Your coach reads this when you ask for help. Saved with your profile."
  };
  return (
    map[tone] ??
    "Tell me about your life and finances. Your coach uses this for context — saved with your profile."
  );
}

export function fetchingHeading(tone) {
  const map = {
    friend: "Fetching your bank and credit info…",
    mom: "Pulling up your accounts now…",
    dad: "Connecting to your accounts…"
  };
  return map[tone] ?? "Fetching your bank and credit info…";
}

export function fetchingSubheading(tone) {
  const map = {
    friend:
      "While you wait, think about one money stress you'd fix first if you could. Your snapshot's almost ready.",
    mom:
      "Take a breath. While we load your numbers, think about what you want to change first — we'll show your interest black holes in a moment.",
    dad:
      "This takes a few seconds. Consider which debt you'd tackle first — we'll surface your worst interest bleeds next."
  };
  return (
    map[tone] ??
    "While you wait, think about why you're here. We'll surface your interest black holes in a moment."
  );
}

export function coachStarters(tone) {
  const map = {
    friend: [
      "Which debt is hurting me most each month?",
      "What should I tackle first?",
      "Give me the quick version of my picture."
    ],
    mom: [
      "Which debt should I worry about most?",
      "What do you want me to pay extra this month?",
      "Walk me through my situation."
    ],
    dad: [
      "Which debt costs me the most per month?",
      "What's the payoff plan this month?",
      "Summarize my debt picture."
    ],
    coach: [
      "Which debt hurts me most per month?",
      "What should I pay extra this month?",
      "Summarize my financial picture."
    ],
    companion: [
      "Which debt hurts me most per month?",
      "What should I pay extra this month?",
      "Summarize my financial picture."
    ],
    chief_of_staff: [
      "Which liability bleeds the most interest?",
      "Recommended extra payment this month?",
      "Executive summary of my debt position."
    ]
  };
  return map[tone] ?? map.friend;
}

export function coachChatTitle(tone) {
  const map = {
    friend: "Ask your coach",
    mom: "Talk to me about your numbers",
    dad: "Ask about the plan"
  };
  return map[tone] ?? "Ask about your numbers";
}

export function coachChatDescription(tone) {
  const map = {
    friend: "Casual answers from real balances and interest — no made-up figures.",
    mom: "I'll use your real numbers and what you shared about your life — not guesses.",
    dad: "Straight answers from your accounts and interest math — actionable, not vague."
  };
  return (
    map[tone] ??
    "Backboard calls our tools for balances and interest — it does not invent figures."
  );
}
