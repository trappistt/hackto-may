import { Building2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANKS = ["RBC", "TD", "BMO", "Scotiabank", "CIBC"];

export default function ConnectBankScreen({ onConnect, loading, error }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 sm:px-8">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Link accounts
        </p>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Connect your bank
        </h1>
        <p className="text-sm text-muted-foreground">
          Securely link accounts to scan liabilities. For this demo we load sample Canadian
          credit data.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-muted p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-charcoal">Canadian institutions</p>
            <p className="text-xs text-muted-foreground">Read-only · demo mock feed</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {BANKS.map((bank) => (
            <span
              key={bank}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {bank}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-charcoal" />
          Bank-grade encryption (demo uses mock data only)
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-charcoal" />
          We never store your online banking password
        </li>
      </ul>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto space-y-3 pt-8">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          disabled={loading}
          onClick={onConnect}
        >
          {loading ? "Connecting…" : "Connect bank account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo loads the &quot;Alex&quot; sample profile automatically
        </p>
      </div>
    </div>
  );
}
