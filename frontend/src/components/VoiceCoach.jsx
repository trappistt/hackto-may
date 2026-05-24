import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import {
  ConversationProvider,
  useConversation
} from "@elevenlabs/react";
import { Orb } from "@/components/ui/orb.jsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toneLabel } from "@/components/onboarding/toneCopy.js";
import { cn } from "@/lib/utils";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim();

function VoiceCoachPanel({
  userId,
  tone = "friend",
  displayName,
  embedded = false,
  compact = false
}) {
  const [messages, setMessages] = useState([]);
  const [micError, setMicError] = useState(null);
  const mediaStreamRef = useRef(null);

  const {
    startSession,
    endSession,
    status,
    mode,
    getInputVolume,
    getOutputVolume
  } = useConversation({
    onMessage: (message) => {
      if (!message.message?.trim()) return;
      setMessages((prev) => [
        ...prev,
        {
          role: message.role === "user" ? "user" : "assistant",
          content: message.message.trim()
        }
      ]);
    },
    onError: (message) => setMicError(message)
  });

  const isActive = status === "connected";
  const isConnecting = status === "connecting";

  useEffect(() => {
    return () => {
      endSession();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    };
  }, [endSession]);

  const agentState = useMemo(() => {
    if (!isActive) return null;
    if (mode === "speaking") return "talking";
    return "listening";
  }, [isActive, mode]);

  const scaledInputVolume = useCallback(() => {
    try {
      const raw = getInputVolume() ?? 0;
      return Math.min(1, Math.pow(raw, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [getInputVolume]);

  const scaledOutputVolume = useCallback(() => {
    try {
      const raw = getOutputVolume() ?? 0;
      return Math.min(1, Math.pow(raw, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [getOutputVolume]);

  async function getMicStream() {
    if (mediaStreamRef.current) return mediaStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicError(null);
      return stream;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setMicError("Microphone access is required for voice coach.");
      } else {
        setMicError("Could not access microphone.");
      }
      throw err;
    }
  }

  function stopMicStream() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }

  async function toggleVoiceSession() {
    if (isActive || isConnecting) {
      endSession();
      stopMicStream();
      return;
    }

    setMicError(null);
    setMessages([]);

    try {
      await getMicStream();
      startSession({
        connectionType: "webrtc",
        dynamicVariables: {
          user_id: userId,
          tone: tone ?? "friend"
        }
      });
    } catch {
      // mic error already set
    }
  }

  const firstName = displayName?.trim().split(/\s+/)[0];

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-full ring-2 ring-border",
            embedded ? "size-24" : "size-28",
            isActive && "ring-primary/40"
          )}
        >
          <Orb
            className="h-full w-full"
            colors={["#A8E6CF", "#05AB74"]}
            agentState={agentState}
            volumeMode="manual"
            getInputVolume={scaledInputVolume}
            getOutputVolume={scaledOutputVolume}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {isConnecting && "Connecting…"}
          {!isConnecting && !isActive && "Tap below to talk with your coach about your numbers"}
          {isActive && mode === "speaking" &&
            `${firstName ? `${firstName}, ` : ""}Coach is speaking…`}
          {isActive && mode === "listening" && "Listening — ask about your debts or payoff plan"}
        </p>
      </div>

      {messages.length > 0 && (
        <ScrollArea
          className={cn(
            "rounded-xl border border-border bg-muted/40 p-3",
            compact ? "h-32" : embedded ? "h-36" : "h-40"
          )}
        >
          <div className="space-y-2 pr-2">
            {messages.map((m, i) => (
              <p
                key={i}
                className={cn(
                  "text-sm leading-relaxed",
                  m.role === "user" ? "text-charcoal" : "text-muted-foreground"
                )}
              >
                <span className="font-medium">{m.role === "user" ? "You" : "Coach"}:</span>{" "}
                {m.content}
              </p>
            ))}
          </div>
        </ScrollArea>
      )}

      {micError && (
        <Alert variant="destructive">
          <AlertDescription>{micError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        className="mt-auto w-full gap-2"
        variant={isActive ? "destructive" : "default"}
        onClick={toggleVoiceSession}
        disabled={isConnecting}
      >
        {isActive || isConnecting ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            {isConnecting ? "Connecting…" : "Done for now"}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Talk to your coach
          </>
        )}
      </Button>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Voice coach
        </p>
        <CardTitle className="font-display text-lg">Talk to {toneLabel(tone)}</CardTitle>
        <CardDescription>
          Spoken agent powered by ElevenLabs — uses your real account data via server tools.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function VoiceCoachUnavailable({ embedded }) {
  const message = (
    <p className="text-sm leading-relaxed text-muted-foreground">
      Set <code className="text-xs">VITE_ELEVENLABS_AGENT_ID</code> in{" "}
      <code className="text-xs">.env</code> and wire server tools per{" "}
      <code className="text-xs">docs/ELEVENLABS_CONVAI.md</code> to enable voice. Chat still
      works without it.
    </p>
  );

  if (embedded) return message;

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Voice coach
        </p>
        <CardTitle className="font-display text-lg">Spoken agent</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function VoiceCoach({
  userId,
  tone,
  displayName,
  report,
  embedded = false,
  compact = false
}) {
  if (!report) return null;

  if (!AGENT_ID) {
    return <VoiceCoachUnavailable embedded={embedded} />;
  }

  return (
    <ConversationProvider agentId={AGENT_ID}>
      <VoiceCoachPanel
        userId={userId}
        tone={tone}
        displayName={displayName}
        embedded={embedded}
        compact={compact}
      />
    </ConversationProvider>
  );
}
