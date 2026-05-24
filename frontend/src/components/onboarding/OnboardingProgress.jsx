import { cn } from "@/lib/utils";

const STEPS = ["opener", "tone", "profile", "life", "fetching"];

export default function OnboardingProgress({ step }) {
  const index = Math.max(0, STEPS.indexOf(step));

  return (
    <div
      className="mb-6 flex gap-1.5"
      aria-label={`Step ${index + 1} of ${STEPS.length}`}
    >
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= index ? "bg-primary" : "bg-mist-200"
          )}
        />
      ))}
    </div>
  );
}
