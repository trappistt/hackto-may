import { Mic } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import OnboardingNav from "../OnboardingNav.jsx";

export default function LifeStoryScreen({
  lifeContext,
  onChange,
  onBack,
  onContinue,
  loading,
  error
}) {
  const canContinue = lifeContext.trim().length >= 20;

  return (
    <div className="flex flex-1 flex-col px-1 pb-2 pt-2 sm:px-2">
      <div className="mb-6 space-y-2">
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          What&apos;s going on in life?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tell me about your life and your current financial standing. This helps your coach
          understand context — demo only, stored on your device profile.
        </p>
      </div>

      <div className="relative space-y-2">
        <Label htmlFor="life-context" className="sr-only">
          Your story
        </Label>
        <Textarea
          id="life-context"
          placeholder="e.g. New job, rent went up, juggling cards and a line of credit…"
          value={lifeContext}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[180px] resize-none pr-12 text-base"
        />
        <Mic
          className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/50"
          aria-hidden
        />
        <p className="text-xs text-muted-foreground">Voice input coming soon — type for now.</p>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <OnboardingNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!canContinue}
        loading={loading}
      />
    </div>
  );
}
