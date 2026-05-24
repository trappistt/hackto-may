import { useState } from "react";
import { MessageCircle, Mic } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toneLabel } from "@/components/onboarding/toneCopy.js";
import { cn } from "@/lib/utils";
import CoachChat from "./CoachChat.jsx";
import VoiceCoach from "./VoiceCoach.jsx";

export default function CoachPanel({
  userId,
  tone,
  displayName,
  report,
  onSend,
  compact = false,
  className
}) {
  const [mode, setMode] = useState("chat");
  const [voiceSessionKey, setVoiceSessionKey] = useState(0);

  function switchMode(next) {
    if (next === mode) return;
    if (mode === "voice") {
      setVoiceSessionKey((k) => k + 1);
    }
    setMode(next);
  }

  return (
    <Card
      className={cn(
        "flex flex-col",
        !compact && "lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)]",
        compact && "border-0 shadow-none",
        className
      )}
    >
      <CardHeader className={cn("space-y-4 pb-3", compact && "p-4 pb-2")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              AI coach
            </p>
            <CardTitle className="font-display text-xl">
              {toneLabel(tone)}
            </CardTitle>
          </div>
          <div
            className="flex shrink-0 rounded-xl border border-border bg-muted/50 p-1"
            role="tablist"
            aria-label="Coach mode"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "chat"}
              variant={mode === "chat" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => switchMode("chat")}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "voice"}
              variant={mode === "voice" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => switchMode("voice")}
            >
              <Mic className="h-3.5 w-3.5" />
              Voice
            </Button>
          </div>
        </div>
        <CardDescription>
          {mode === "chat"
            ? "Type your questions — answers use your real balances and interest math."
            : "Talk out loud — your coach pulls the same account data via server tools."}
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("flex min-h-0 flex-1 flex-col pb-4", compact && "px-4 pb-4")}>
        {mode === "chat" ? (
          <CoachChat
            key="chat"
            userId={userId}
            tone={tone}
            onSend={onSend}
            embedded
            compact={compact}
          />
        ) : (
          <VoiceCoach
            key={`voice-${voiceSessionKey}`}
            userId={userId}
            tone={tone}
            displayName={displayName}
            report={report}
            embedded
            compact={compact}
          />
        )}
      </CardContent>
    </Card>
  );
}
