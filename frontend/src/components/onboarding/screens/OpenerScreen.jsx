import OnboardingNav from "../OnboardingNav.jsx";

export default function OpenerScreen({ onContinue, loading, error }) {
  return (
    <div className="flex flex-1 flex-col px-1 pb-2 pt-2 sm:px-2">
      <div className="space-y-6">
        <p className="text-base leading-relaxed text-muted-foreground">
          Hey there! First and foremost I want you to know that{" "}
          <strong className="font-medium text-charcoal">we are in this together</strong>.
          Money stress is real — and you don&apos;t have to figure it out alone.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Moneytor finds the debts that quietly bleed interest every month, then helps you
          decide what to pay down first — using your real numbers, not guesses.
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Let&apos;s get started
        </h1>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <OnboardingNav
        showBack={false}
        onContinue={onContinue}
        loading={loading}
        continueLabel="Continue"
      />
    </div>
  );
}
