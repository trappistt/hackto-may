import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COACH_TONES } from "../toneCopy.js";
import { ToneIllustration } from "../illustrations.jsx";
import OnboardingNav from "../OnboardingNav.jsx";

export { COACH_TONES };

export default function ToneScreen({
  tone,
  onSelectTone,
  onBack,
  onContinue,
  loading,
  error
}) {
  return (
    <div className="flex flex-1 flex-col px-1 pb-2 pt-2 sm:px-2">
      <div className="mb-6 space-y-2">
        <p className="text-sm text-muted-foreground">Do you want me to be your…</p>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          Choose your tone
        </h1>
      </div>

      <div className="space-y-3">
        {COACH_TONES.map((t) => {
          const selected = tone === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelectTone(t.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-mist-300"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-charcoal">{t.label}</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <ToneIllustration tone={tone} />
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <OnboardingNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!tone}
        loading={loading}
      />
    </div>
  );
}
