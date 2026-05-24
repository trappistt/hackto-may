import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo.jsx";

export default function WelcomeScreen({ firstName, onContinue }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-6 sm:px-8">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <h1 className="font-display text-3xl font-semibold leading-tight text-charcoal">
        Welcome, {firstName}
      </h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="font-medium text-charcoal">Moneytor</strong> is your
          proactive financial copilot for Canadians. We find{" "}
          <strong className="font-medium text-charcoal">interest black holes</strong> —
          debts that quietly bleed money every month.
        </p>
        <p>
          Your AI coach never guesses balances or APRs. It calls our API for real numbers,
          then helps you decide what to pay down first.
        </p>
        <p>Let&apos;s set up your account in a few quick steps.</p>
      </div>

      <div className="mt-auto pt-10">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          onClick={onContinue}
        >
          Let&apos;s get started
        </Button>
      </div>
    </div>
  );
}
