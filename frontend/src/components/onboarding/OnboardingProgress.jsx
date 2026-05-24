import { cn } from "@/lib/utils";

const STEPS = ["auth", "profile", "welcome", "bank", "tone"];

export default function OnboardingProgress({ step }) {
  const index = STEPS.indexOf(step);

  return (
    <div className="flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= index ? "bg-charcoal" : "bg-charcoal/15"
          )}
        />
      ))}
    </div>
  );
}
