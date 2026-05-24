import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const COACH_TONES = [
  {
    value: "friend",
    label: "Friend",
    description: "Casual, encouraging, talks like a peer who has your back."
  },
  {
    value: "mom",
    label: "Mom",
    description: "Warm but firm — cares about you and won't let you dodge the numbers."
  },
  {
    value: "dad",
    label: "Dad",
    description: "Straightforward and practical — focuses on the plan, not the drama."
  }
];

export default function ToneScreen({ tone, onSelectTone, onFinish, loading, error }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 sm:px-8">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Your coach
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Choose your tone
        </h1>
        <p className="text-sm text-muted-foreground">
          How should your AI coach talk to you? You can change this later.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {COACH_TONES.map((t) => {
          const selected = tone === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelectTone(t.value)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-charcoal bg-charcoal text-snow shadow-md"
                  : "border-charcoal/10 bg-white text-charcoal hover:border-charcoal/25"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{t.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-snug",
                      selected ? "text-snow/80" : "text-muted-foreground"
                    )}
                  >
                    {t.description}
                  </p>
                </div>
                {selected && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-snow/20">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto pt-8">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          disabled={!tone || loading}
          onClick={onFinish}
        >
          {loading ? "Finishing…" : "Enter dashboard"}
        </Button>
      </div>
    </div>
  );
}
