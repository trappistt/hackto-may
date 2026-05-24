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
