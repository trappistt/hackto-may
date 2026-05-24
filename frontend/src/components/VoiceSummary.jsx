import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

export default function VoiceSummary({ userId, report }) {
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
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
    <section className="card voice">
      <p className="eyebrow">Voice summary</p>
      <p className="lede small">
        Hear your top interest black hole — powered by ElevenLabs when configured, otherwise browser speech.
      </p>

      {script && (
        <blockquote className="voice-script muted small">{script}</blockquote>
      )}

      {error && <p className="error-banner">{error}</p>}

      <div className="voice-actions">
        <button
          type="button"
          className="primary"
          onClick={handleSpeak}
          disabled={!script || speaking || loading}
        >
          {speaking ? "Playing…" : "Play voice summary"}
        </button>
        {ttsAvailable === false && (
          <span className="muted small">Add ELEVENLABS_API_KEY for studio voice</span>
        )}
      </div>
    </section>
  );
}

function base64ToBlob(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}
