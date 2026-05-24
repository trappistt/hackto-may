import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Which debt hurts me most per month?",
  "What should I pay extra this month?",
  "Summarize my financial picture."
];

export default function CoachChat({ userId, onSend, compact = false }) {
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
    <Card className={cn("flex flex-col", !compact && "lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)]", compact && "shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "p-4 pb-2")}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          AI coach
        </p>
        <CardTitle className="font-display text-xl">Ask about your numbers</CardTitle>
        <CardDescription>
          Backboard calls our tools for balances and interest — it does not invent figures.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pb-0">
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((q) => (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal px-3 py-2 text-left text-xs font-normal"
              disabled={loading}
              onClick={() => send(q)}
            >
              {q}
            </Button>
          ))}
        </div>

        <ScrollArea
          className={cn(
            "rounded-xl border border-border bg-muted p-4",
            compact ? "h-[280px]" : "h-[min(420px,50vh)]"
          )}
        >
          <div className="space-y-3 pr-3" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No messages yet. Try a starter question above.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[95%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border bg-card text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.disclaimer && (
                  <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    {m.disclaimer}
                  </p>
                )}
              </div>
            ))}
            {loading && (
              <p className="text-sm text-muted-foreground">Coach is thinking…</p>
            )}
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className={cn("pt-4", compact && "p-4 pt-2")}>
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            type="text"
            placeholder="Ask about debt, payoff, utilization…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !userId}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
