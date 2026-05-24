import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { lifeStoryHeading, lifeStorySubheading } from "../toneCopy.js";
import { LifeStoryIllustration } from "../illustrations.jsx";
import OnboardingNav from "../OnboardingNav.jsx";
import { cn } from "@/lib/utils";

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

export default function LifeStoryScreen({
  tone = "friend",
  lifeContext,
  onChange,
  onBack,
  onContinue,
  loading,
  error
}) {
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);
  const lifeContextRef = useRef(lifeContext);
  const canContinue = lifeContext.trim().length >= 20;
  const speechSupported = typeof window !== "undefined" && !!getSpeechRecognition();

  useEffect(() => {
    lifeContextRef.current = lifeContext;
  }, [lifeContext]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  function toggleMic() {
    if (listening) {
      stopListening();
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setSpeechError("Voice input isn't supported in this browser — type your story instead.");
      return;
    }

    setSpeechError(null);
    recognition.lang = "en-CA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          chunk += event.results[i][0].transcript;
        }
      }
      if (chunk.trim()) {
        const prev = lifeContextRef.current.trim();
        onChange(prev ? `${prev} ${chunk.trim()}` : chunk.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setSpeechError("Couldn't hear that — try again or type instead.");
      }
      stopListening();
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="flex flex-1 flex-col px-1 pb-2 pt-2 sm:px-2">
      <LifeStoryIllustration className="mb-4 max-h-36" />

      <div className="mb-5 space-y-2">
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          {lifeStoryHeading(tone)}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {lifeStorySubheading(tone)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="life-context" className="sr-only">
          Your story
        </Label>
        <div className="overflow-hidden rounded-xl border border-input bg-card shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring">
          <Textarea
            id="life-context"
            placeholder="e.g. New job, rent went up, juggling cards and a line of credit…"
            value={lifeContext}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[160px] resize-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {listening
                ? "Listening… tap mic when done."
                : speechSupported
                  ? "Tap mic to dictate, or type — a few sentences minimum."
                  : "Type your story — voice works in Chrome or Safari."}
            </p>
            <Button
              type="button"
              variant={listening ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full",
                listening && "animate-pulse"
              )}
              onClick={toggleMic}
              disabled={!speechSupported}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              title={
                speechSupported
                  ? listening
                    ? "Stop listening"
                    : "Speak your story"
                  : "Voice input needs Chrome or Safari"
              }
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {speechError && (
          <p className="text-xs text-destructive" role="alert">
            {speechError}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <OnboardingNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!canContinue}
        loading={loading}
      />
    </div>
  );
}
