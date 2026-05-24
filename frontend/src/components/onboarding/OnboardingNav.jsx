import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  loading,
  showBack = true
}) {
  return (
    <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/60 pt-6">
      {showBack ? (
        <Button type="button" variant="ghost" className="gap-1.5 px-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        size="lg"
        className="h-11 gap-2 px-6"
        disabled={continueDisabled || loading}
        onClick={onContinue}
      >
        {loading ? "Please wait…" : continueLabel}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
