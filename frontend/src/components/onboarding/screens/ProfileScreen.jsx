import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileHeading, profileSubheading } from "../toneCopy.js";
import OnboardingNav from "../OnboardingNav.jsx";

const WHO_OPTIONS = ["Just me", "Me and my partner", "My household"];

export default function ProfileScreen({
  tone,
  displayName,
  age,
  whoUsesTool,
  lifestyleBrief,
  onChange,
  onBack,
  onContinue,
  loading,
  error
}) {
  const canContinue =
    displayName.trim().length >= 2 && age.trim().length >= 1 && whoUsesTool && lifestyleBrief.trim().length >= 8;

  return (
    <div className="flex flex-1 flex-col px-1 pb-2 pt-2 sm:px-2">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          About you
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          {profileHeading(tone)}
        </h1>
        <p className="text-sm text-muted-foreground">{profileSubheading(tone)}</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">How should I address you?</Label>
          <Input
            id="name"
            type="text"
            autoComplete="given-name"
            placeholder="Alex"
            value={displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={99}
            placeholder="34"
            value={age}
            onChange={(e) => onChange({ age: e.target.value })}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="who">Who will be using this tool?</Label>
          <select
            id="who"
            value={whoUsesTool}
            onChange={(e) => onChange({ whoUsesTool: e.target.value })}
            className="flex h-12 w-full rounded-xl border border-input bg-card px-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select…</option>
            {WHO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lifestyle">Give me a brief idea about your lifestyle</Label>
          <Textarea
            id="lifestyle"
            placeholder="e.g. Renting in Toronto, two kids, trying to pay down cards…"
            value={lifestyleBrief}
            onChange={(e) => onChange({ lifestyleBrief: e.target.value })}
            className="min-h-[100px] resize-none text-base"
          />
        </div>
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
