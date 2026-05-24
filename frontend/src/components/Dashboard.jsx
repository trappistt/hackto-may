import { useCallback, useEffect, useState } from "react";
import { LogOut, Menu, MessageCircle } from "lucide-react";
import { api } from "@/api.js";
import Logo from "@/components/Logo.jsx";
import FinancialSnapshot from "./FinancialSnapshot.jsx";
import FinancialTrends from "./FinancialTrends.jsx";
import CoachChat from "./CoachChat.jsx";
import VoiceSummary from "./VoiceSummary.jsx";
import { Button } from "@/components/ui/button";
import { toneLabel } from "@/components/onboarding/toneCopy.js";
import { cn } from "@/lib/utils";

export default function Dashboard({ user, onSignOut }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBlackHoles(user.id);
      setReport(data);
    } catch (err) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const firstName = user.displayName?.trim().split(/\s+/)[0] ?? "there";

  return (
    <div className="mx-auto w-full max-w-lg lg:max-w-6xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <Logo size="sm" />
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Hi {firstName} · {toneLabel(user.tone)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.writeText(user.id);
                    setMenuOpen(false);
                  }}
                >
                  Copy user ID
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {error && (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <main className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        <div className="space-y-6">
          <FinancialSnapshot
            report={report}
            trends={report?.trends}
            loading={loading && !report}
          />
          <div className="hidden lg:block">
            <FinancialTrends trends={report?.trends} loading={loading && !report} />
          </div>
          <VoiceSummary userId={user.id} report={report} />
        </div>

        <div className={cn("lg:sticky lg:top-6", !showCoach && "hidden lg:block")}>
          <CoachChat
            userId={user.id}
            onSend={(content) => api.sendCoachMessage(user.id, content)}
            compact
          />
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-30 lg:hidden">
        <Button
          type="button"
          size="lg"
          className="h-14 gap-2 rounded-full px-6 shadow-lg"
          onClick={() => setShowCoach((s) => !s)}
        >
          <MessageCircle className="h-5 w-5" />
          {showCoach ? "Snapshot" : "Coach"}
        </Button>
      </div>

      {showCoach && (
        <div className="fixed inset-0 z-20 flex flex-col bg-background p-4 pt-6 lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">AI coach</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCoach(false)}>
              Close
            </Button>
          </div>
          <CoachChat
            userId={user.id}
            onSend={(content) => api.sendCoachMessage(user.id, content)}
            compact
          />
        </div>
      )}
    </div>
  );
}
