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

export default function BlackHoleReport({ report, loading, onRefresh }) {
  if (loading) {
    return (
      <section className="card report">
        <p className="muted">Scanning liabilities…</p>
      </section>
    );
  }

  if (!report) return null;

  const top = report.ranked?.[0];
  const rec = report.recommendation;

  return (
    <section className="card report">
      <div className="report-header">
        <div>
          <p className="eyebrow">Interest Black Hole Report</p>
          <h2>{formatMoney(report.totalMonthlyInterestBurn)}</h2>
          <p className="lede small">total monthly interest bleed across all debts</p>
        </div>
        <button type="button" className="ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {top && (
        <div className="hero-metric">
          <span className="label">Worst bleed</span>
          <strong>{top.name}</strong>
          <span className="mono">{formatMoney(top.monthlyInterest)}/mo</span>
          <span className="muted">
            {formatApr(top.apr)} APR · balance {formatMoney(top.balance)}
          </span>
        </div>
      )}

      {rec && (
        <div className="recommendation">
          <p className="eyebrow">Payoff recommendation</p>
          <p>
            Put <strong>{formatMoney(rec.extraPayment)}</strong> extra on{" "}
            <strong>{rec.accountName}</strong> ({rec.strategy}).
          </p>
          <p className="mono savings">
            ~{formatMoney(rec.interestSaved90Days)} interest saved in 90 days
          </p>
          <p className="muted small">{rec.rationale}</p>
        </div>
      )}

      <ol className="ranked-list">
        {report.ranked?.map((row, i) => (
          <li key={row.accountId}>
            <div className="rank">#{i + 1}</div>
            <div className="rank-body">
              <div className="rank-title">
                <strong>{row.name}</strong>
                <span className="mono bleed">{formatMoney(row.monthlyInterest)}/mo</span>
              </div>
              <div className="rank-meta muted">
                Balance {formatMoney(row.balance)} · {formatApr(row.apr)}
                {row.utilization != null &&
                  ` · ${(row.utilization * 100).toFixed(0)}% utilized`}
              </div>
              {row.flags?.length > 0 && (
                <div className="flags">
                  {row.flags.map((f) => (
                    <span key={f} className="flag">
                      {flagLabel(f)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="disclaimer">{report.disclaimer}</p>
    </section>
  );
}
