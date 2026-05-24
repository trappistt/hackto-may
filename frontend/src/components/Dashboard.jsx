import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { api } from "@/api.js";
import { SiteHeader } from "@/components/AppShell.jsx";
import BlackHoleReport from "./BlackHoleReport.jsx";
import FinancialTrends from "./FinancialTrends.jsx";
import CoachChat from "./CoachChat.jsx";
import VoiceSummary from "./VoiceSummary.jsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { COACH_TONES } from "@/components/onboarding/screens/ToneScreen.jsx";

const TONE_LABELS = Object.fromEntries(COACH_TONES.map((t) => [t.value, t.label]));

export default function Dashboard({ user, onSignOut }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const toneLabel = TONE_LABELS[user.tone] ?? user.tone;

  return (
    <>
      <SiteHeader
        subtitle={`Hi ${firstName} · Coach tone: ${toneLabel}`}
        actions={
          <>
            <Badge variant="secondary" className="font-mono text-xs font-normal">
              {user.id.slice(0, 8)}…
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(user.id)}
              title="Copy user ID for ElevenLabs ConvAI"
            >
              Copy ID
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </>
        }
      />

      <Separator className="mb-8" />

      {error && (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <BlackHoleReport
            report={report}
            loading={loading && !report}
            onRefresh={loadReport}
          />
          <FinancialTrends
            trends={report?.trends}
            loading={loading && !report}
          />
          <VoiceSummary userId={user.id} report={report} />
        </div>
        <CoachChat
          userId={user.id}
          onSend={(content) => api.sendCoachMessage(user.id, content)}
        />
      </main>
    </>
  );
}
