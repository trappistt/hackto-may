import { useCallback, useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { api } from "../api.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VoiceSummary({ userId, report }) {
  const [script, setScript] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [ttsAvailable, setTtsAvailable] = useState(null);

  const loadScript = useCallback(async () => {
    if (!userId || !report) return;
    setError(null);
    try {
      const data = await api.getVoiceSummary(userId);
      setScript(data.script);
      setTtsAvailable(data.elevenlabsConfigured);
    } catch (err) {
      setError(err.message);
    }
  }, [userId, report]);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  async function handleSpeak() {
    if (!userId || !script) return;
    setSpeaking(true);
    setError(null);

    try {
      const data = await api.speakVoiceSummary(userId, script);
      const blob = base64ToBlob(data.audioBase64, data.contentType ?? "audio/mpeg");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      if (err.status === 501) {
        if (typeof window !== "undefined" && window.speechSynthesis && script) {
          const utterance = new SpeechSynthesisUtterance(script);
          utterance.lang = "en-CA";
          window.speechSynthesis.speak(utterance);
          return;
        }
      }
      setError(err.message);
    } finally {
      setSpeaking(false);
    }
  }

  if (!report) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Voice summary
        </p>
        <CardTitle className="font-display text-lg">Hear your top black hole</CardTitle>
        <CardDescription>
          Powered by ElevenLabs when configured, otherwise browser speech.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {script && (
          <blockquote className="border-l-2 border-mist-400 pl-4 text-sm leading-relaxed text-muted-foreground">
            {script}
          </blockquote>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSpeak} disabled={!script || speaking}>
          <Volume2 className="h-4 w-4" />
          {speaking ? "Playing…" : "Play voice summary"}
        </Button>
        {ttsAvailable === false && (
          <span className="text-xs text-muted-foreground">
            Add ELEVENLABS_API_KEY for studio voice
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

function base64ToBlob(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}
