import { useState } from "react";

const STARTERS = [
  "Which debt hurts me most per month?",
  "What should I pay extra this month?",
  "Summarize my financial picture."
];

export default function CoachChat({ userId, onSend }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function send(text) {
    const content = text.trim();
    if (!content || loading) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);

    try {
      const data = await onSend(content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, disclaimer: data.disclaimer }
      ]);
    } catch (err) {
      if (err.status !== 501) setError(err.message);
      if (err.status === 501) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Coach is not configured on the server. Set BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID in .env — the black hole report still uses real math from our API."
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card chat">
      <p className="eyebrow">AI coach</p>
      <h2>Ask about your numbers</h2>
      <p className="lede small">
        Backboard calls our tools for balances and interest — it does not invent figures.
      </p>

      <div className="starters">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            className="chip"
            disabled={loading}
            onClick={() => send(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="muted">No messages yet. Try a starter question above.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.content}</p>
            {m.disclaimer && <p className="disclaimer small">{m.disclaimer}</p>}
          </div>
        ))}
        {loading && <p className="muted typing">Coach is thinking…</p>}
      </div>

      {error && <p className="error-banner">{error}</p>}

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          type="text"
          placeholder="Ask about debt, payoff, utilization…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || !userId}
        />
        <button type="submit" className="primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
