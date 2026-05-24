import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import TrendAreaChart from "@/components/charts/TrendAreaChart.jsx";

const INTEREST_CONFIG = {
  minimum: {
    label: "At minimum payments",
    color: "hsl(207, 12%, 55%)"
  },
  optimized: {
    label: "With extra on top debt",
    color: "#05AB74"
  }
};

const BALANCE_CONFIG = {
  minimum: {
    label: "At minimum payments",
    color: "hsl(196, 77%, 45%)"
  },
  optimized: {
    label: "With extra on top debt",
    color: "#05AB74"
  }
};

function formatCad(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(n);
}

export default function FinancialTrends({ trends, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-sm text-muted-foreground">Loading trends…</p>
        </CardContent>
      </Card>
    );
  }

  if (!trends?.interestBurn?.length) return null;

  const extraHint = trends.meta?.extraPayment
    ? ` · +${formatCad(trends.meta.extraPayment)}/mo on ${trends.meta.topAccountName ?? "top debt"}`
    : "";

  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trends
        </p>
        <CardTitle className="font-display text-xl">Where your money is heading</CardTitle>
        <CardDescription>
          Projected from your current balances (past months estimated). Lines diverge when you
          apply the payoff recommendation{extraHint}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Monthly interest bleed</h3>
          <TrendAreaChart
            data={trends.interestBurn}
            chartConfig={INTEREST_CONFIG}
            valueFormatter={formatCad}
            yTickFormatter={(v) => `$${Math.round(v)}`}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Total debt balance</h3>
          <TrendAreaChart
            data={trends.totalBalance}
            chartConfig={BALANCE_CONFIG}
            valueFormatter={formatCad}
            yTickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{trends.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
