import { RefreshCw, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function formatMoney(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2
  }).format(n);
}

function formatApr(apr) {
  return `${(apr * 100).toFixed(2)}%`;
}

function flagLabel(flag) {
  const labels = {
    high_utilization: "High utilization",
    minimum_payment_trap: "Minimum payment trap",
    promo_apr_expiring_soon: "Promo APR expiring"
  };
  return labels[flag] ?? flag;
}

/** Stats + grid list patterns — inspired by blocks.so/stats and blocks.so/grid-list */
function StatCard({ label, value, hint, className }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-semibold text-charcoal sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function BlackHoleReport({ report, loading, onRefresh, compact = false }) {
  if (loading) {
    return (
      <Card className={compact ? "shadow-none" : undefined}>
        <CardContent className={compact ? "py-8" : "py-10"}>
          <p className="text-center text-sm text-muted-foreground">Scanning liabilities…</p>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const top = report.ranked?.[0];
  const rec = report.recommendation;

  return (
    <Card className={cn(compact && "shadow-none")}>
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between gap-4 space-y-0",
          compact && "p-4 pb-2"
        )}
      >
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Interest Black Hole Report
          </p>
          <CardTitle className={cn("font-display", compact ? "text-2xl" : "text-3xl sm:text-4xl")}>
            {formatMoney(report.totalMonthlyInterestBurn)}
          </CardTitle>
          <CardDescription>Total monthly interest bleed across all debts</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className={cn("space-y-6", compact && "space-y-4 p-4 pt-0")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {top && (
            <StatCard
              label="Worst bleed"
              value={formatMoney(top.monthlyInterest)}
              hint={`${top.name} · ${formatApr(top.apr)} APR`}
            />
          )}
          {top && (
            <StatCard
              label="Balance at risk"
              value={formatMoney(top.balance)}
              hint={
                top.utilization != null
                  ? `${(top.utilization * 100).toFixed(0)}% utilized`
                  : undefined
              }
            />
          )}
        </div>

        {rec && (
          <div className="rounded-xl border border-border bg-muted p-5">
            <div className="mb-2 flex items-center gap-2 text-charcoal">
              <TrendingDown className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Payoff recommendation
              </p>
            </div>
            <p className="text-sm leading-relaxed text-charcoal">
              Put <strong>{formatMoney(rec.extraPayment)}</strong> extra on{" "}
              <strong>{rec.accountName}</strong> ({rec.strategy}).
            </p>
            <p className="mt-2 font-mono text-sm font-medium text-charcoal">
              ~{formatMoney(rec.interestSaved90Days)} interest saved in 90 days
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{rec.rationale}</p>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Ranked liabilities
          </p>
          <ul className="space-y-2">
            {report.ranked?.map((row, i) => (
              <li
                key={row.accountId}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-mist-300"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-charcoal">{row.name}</strong>
                    <span className="font-mono text-sm font-medium text-charcoal">
                      {formatMoney(row.monthlyInterest)}/mo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Balance {formatMoney(row.balance)} · {formatApr(row.apr)}
                    {row.utilization != null &&
                      ` · ${(row.utilization * 100).toFixed(0)}% utilized`}
                  </p>
                  {row.flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {row.flags.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {flagLabel(f)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
