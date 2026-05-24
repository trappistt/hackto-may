import { Car, CreditCard, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

function accountIcon(name, type) {
  const n = name.toLowerCase();
  if (type === "installment" || n.includes("auto")) {
    return <Car className="h-5 w-5" />;
  }
  if (type === "line_of_credit" || n.includes("loc")) {
    return <Landmark className="h-5 w-5" />;
  }
  return <CreditCard className="h-5 w-5" />;
}

function interestTrendDelta(trends) {
  const series = trends?.interestBurn;
  if (!series || series.length < 2) return null;
  const prev = series[series.length - 2]?.optimized ?? series[series.length - 2]?.minimum;
  const curr = series[series.length - 1]?.optimized ?? series[series.length - 1]?.minimum;
  if (!prev || !curr) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function interestTrendBadgeLabel(pct) {
  if (pct == null) return null;
  const sign = pct > 0 ? `+${pct}%` : `${pct}%`;
  const status = pct < 0 ? "Improving" : pct > 0 ? "Rising" : "Steady";
  return `${sign} · ${status}`;
}

function estimateDebtFreeYears(report) {
  const totalBal = report.ranked?.reduce((s, r) => s + r.balance, 0) ?? 0;
  const monthlyMin = report.ranked?.reduce((s, r) => s + (r.minPayment ?? 0), 0) ?? 0;
  const extra = report.recommendation?.extraPayment ?? 0;
  const pay = monthlyMin + extra;
  if (pay <= 0) return null;
  const months = Math.ceil(totalBal / pay);
  return Math.max(1, Math.ceil(months / 12));
}

function StatBlock({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-semibold text-charcoal">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function FinancialSnapshot({ report, trends, loading }) {
  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Building your snapshot…
      </p>
    );
  }

  if (!report) return null;

  const top = report.ranked?.[0];
  const rec = report.recommendation;
  const trendPct = interestTrendDelta(trends);
  const debtFreeYears = estimateDebtFreeYears(report);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
        Financial Snapshot
      </h1>

      <StatBlock
        label="Interest black hole"
        value={formatMoney(report.totalMonthlyInterestBurn)}
        sub="Monthly interest paid across debts"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {top && (
          <StatBlock
            label="Worst bleed"
            value={formatMoney(top.monthlyInterest)}
            sub={`${top.name} · ${formatApr(top.apr)}`}
          />
        )}
        {rec && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI payoff move
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">
              Add <strong>{formatMoney(rec.extraPayment)}</strong> extra toward{" "}
              <strong>{rec.accountName}</strong> this month.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              ~{formatMoney(rec.interestSaved90Days)} saved in 90 days
            </p>
          </div>
        )}
      </div>

      {trends?.interestBurn?.length > 0 && trendPct != null && (
        <div className="rounded-2xl border border-border bg-card p-4 lg:pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Interest trend
            </p>
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 font-normal",
                trendPct <= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {trendPct > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {interestTrendBadgeLabel(trendPct)}
            </Badge>
          </div>
          <div className="mt-3 flex h-24 items-end gap-1">
            {trends.interestBurn.slice(-6).map((row) => {
              const series = trends.interestBurn.slice(-6);
              const max = Math.max(...series.map((r) => r.minimum), 1);
              const min = Math.min(...series.map((r) => r.minimum));
              const range = Math.max(max - min, max * 0.15, 1);
              const h = ((row.minimum - min) / range) * 80 + 15;
              return (
                <div
                  key={row.month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div
                    className="w-full max-w-[2rem] rounded-t bg-primary/80"
                    style={{ height: `${h}%` }}
                    title={formatMoney(row.minimum)}
                  />
                  <span className="text-[10px] text-muted-foreground">{row.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Debt accounts
        </p>
        <ul className="space-y-2">
          {report.ranked?.map((row, i) => (
            <li
              key={row.accountId}
              className="flex gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-charcoal">
                {accountIcon(row.name, row.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-charcoal">
                    {i + 1}. {row.name}
                  </span>
                  <span className="font-mono text-sm font-semibold text-charcoal">
                    {formatMoney(row.monthlyInterest)}/mo
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Balance {formatMoney(row.balance)} · {formatApr(row.apr)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {debtFreeYears && (
        <div className="rounded-2xl bg-charcoal px-5 py-4 text-center text-snow">
          <p className="text-xs font-medium uppercase tracking-widest text-snow/70">
            AI projection
          </p>
          <p className="font-display mt-1 text-xl font-semibold">
            Debt free in ~{debtFreeYears} {debtFreeYears === 1 ? "year" : "years"}
          </p>
          <p className="mt-1 text-xs text-snow/60">
            Rough estimate at minimums + recommended extra — educational only
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>
    </div>
  );
}
