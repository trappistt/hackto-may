import { useState } from "react";
import { api, STORAGE_KEY } from "@/api.js";
import { SiteHeader } from "@/components/AppShell.jsx";
import { cn } from "@/lib/utils";
import OnboardingProgress from "./OnboardingProgress.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import ConnectBankScreen from "./screens/ConnectBankScreen.jsx";
import ToneScreen from "./screens/ToneScreen.jsx";

function firstName(displayName) {
  const n = displayName?.trim();
  if (!n) return "there";
  return n.split(/\s+/)[0];
}

function deriveStep(u) {
  if (!u.displayName?.trim() || !u.dateOfBirth) return "profile";
  if (!u.bankConnected) return "bank";
  return "tone";
}

const STEP_WIDTH = {
  auth: "max-w-md",
  profile: "max-w-lg",
  welcome: "max-w-xl",
  bank: "max-w-xl",
  tone: "max-w-3xl"
};

export default function OnboardingFlow({ onComplete, initialUser = null }) {
  const [step, setStep] = useState(initialUser ? deriveStep(initialUser) : "auth");
  const [user, setUser] = useState(initialUser);
  const [displayName, setDisplayName] = useState(initialUser?.displayName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialUser?.dateOfBirth ?? "");
  const [tone, setTone] = useState(initialUser?.tone ?? "friend");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogleAuth({ mode, provider }) {
    setLoading(true);
    setError(null);
    try {
      const demoEmail =
        provider === "google"
          ? `demo.google.${Date.now()}@hackto-may.local`
          : `demo.${mode}.${Date.now()}@hackto-may.local`;
      const { user: authUser } = await api.authGoogle({
        mode,
        email: demoEmail,
        name: provider === "google" ? "Demo User" : null
      });
      setUser(authUser);
      localStorage.setItem(STORAGE_KEY, authUser.id);
      setDisplayName(authUser.displayName ?? "");
      setStep("profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, {
        displayName: displayName.trim(),
        dateOfBirth
      });
      setUser(updated);
      setStep("welcome");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function connectBank() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await api.seedMock(user.id, "alex");
      const updated = await api.getUser(user.id);
      setUser(updated);
      setStep("tone");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, {
        tone,
        onboardingComplete: true
      });
      onComplete(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full">
      <SiteHeader subtitle="Your interest black hole copilot" logoSize="xl" />

      <div className={cn("mx-auto w-full", STEP_WIDTH[step])}>
        <OnboardingProgress step={step} />
        <div className="mt-6 rounded-2xl border border-border bg-card p-1 shadow-sm sm:p-2">
          {step === "auth" && (
            <AuthScreen onGoogleAuth={handleGoogleAuth} loading={loading} error={error} />
          )}
          {step === "profile" && (
            <ProfileScreen
              displayName={displayName}
              dateOfBirth={dateOfBirth}
              onChange={(patch) => {
                if (patch.displayName !== undefined) setDisplayName(patch.displayName);
                if (patch.dateOfBirth !== undefined) setDateOfBirth(patch.dateOfBirth);
              }}
              onContinue={saveProfile}
              loading={loading}
              error={error}
            />
          )}
          {step === "welcome" && (
            <WelcomeScreen
              firstName={firstName(displayName)}
              onContinue={() => setStep("bank")}
            />
          )}
          {step === "bank" && (
            <ConnectBankScreen onConnect={connectBank} loading={loading} error={error} />
          )}
          {step === "tone" && (
            <ToneScreen
              tone={tone}
              onSelectTone={setTone}
              onFinish={finishOnboarding}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
