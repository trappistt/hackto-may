import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileScreen({
  displayName,
  dateOfBirth,
  onChange,
  onContinue,
  loading,
  error
}) {
  const canContinue = displayName.trim().length >= 2 && dateOfBirth;

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 sm:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          About you
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Tell us a bit about yourself
        </h1>
        <p className="text-sm text-muted-foreground">
          We use this to personalize your experience. Demo data only — not shared.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className="h-12 text-base"
          />
        </div>
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
          disabled={!canContinue || loading}
          onClick={onContinue}
        >
          {loading ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
