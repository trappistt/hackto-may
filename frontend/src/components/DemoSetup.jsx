import { useState } from "react";

const PERSONAS = [
  {
    key: "alex",
    label: "Alex",
    subtitle: "High-CC professional",
    detail: "Three cards, heavy utilization, minimum-payment trap"
  },
  {
    key: "sam",
    label: "Sam",
    subtitle: "Loan + promo card",
    detail: "Student loan plus promo APR expiring soon"
  },
  {
    key: "jordan",
    label: "Jordan",
    subtitle: "Recovering spender",
    detail: "Lower balances, rebuilding habits"
  }
];

const TONES = [
  { value: "coach", label: "Coach" },
  { value: "companion", label: "Companion" },
  { value: "chief_of_staff", label: "Chief of staff" }
];

export default function DemoSetup({ onReady, loading, error }) {
  const [personaKey, setPersonaKey] = useState("alex");
  const [tone, setTone] = useState("coach");

  return (
    <section className="setup card">
      <p className="eyebrow">Demo onboarding</p>
      <h1>Find your interest black holes</h1>
      <p className="lede">
        Pick a sample profile. We load mock Canadian credit data, scan monthly interest bleed,
        then you can ask the AI coach — numbers always come from our API, never guessed.
      </p>

      <div className="persona-grid">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`persona-card ${personaKey === p.key ? "selected" : ""}`}
            onClick={() => setPersonaKey(p.key)}
          >
            <strong>{p.label}</strong>
            <span>{p.subtitle}</span>
            <small>{p.detail}</small>
          </button>
        ))}
      </div>

      <label className="field">
        <span>Coach tone</span>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="error-banner">{error}</p>}

      <button
        type="button"
        className="primary"
        disabled={loading}
        onClick={() => onReady({ personaKey, tone })}
      >
        {loading ? "Loading demo…" : "Run black hole scan"}
      </button>
    </section>
  );
}
