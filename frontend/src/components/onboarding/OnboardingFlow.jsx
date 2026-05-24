import { useCallback, useEffect, useState } from "react";
import { api, ONBOARDING_STEP_KEY, STORAGE_KEY } from "@/api.js";
import { SiteHeader } from "@/components/AppShell.jsx";
import OnboardingProgress from "./OnboardingProgress.jsx";
import OpenerScreen from "./screens/OpenerScreen.jsx";
import ToneScreen from "./screens/ToneScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import LifeStoryScreen from "./screens/LifeStoryScreen.jsx";
import FetchingScreen from "./screens/FetchingScreen.jsx";

const VALID_STEPS = ["opener", "tone", "profile", "life", "fetching"];

function deriveStep(u) {
  if (!u.displayName?.trim() || !u.age?.trim() || !u.whoUsesTool) return "profile";
  if (!u.lifeContext?.trim()) return "life";
  if (!u.bankConnected) return "fetching";
  return "fetching";
}

function initialStep(initialUser) {
  if (!initialUser) return "opener";
  const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
  if (saved && VALID_STEPS.includes(saved) && saved !== "opener") return saved;
  return deriveStep(initialUser);
}

export default function OnboardingFlow({ onComplete, initialUser = null }) {
  const [step, setStep] = useState(() => initialStep(initialUser));
  const [user, setUser] = useState(initialUser);
  const [tone, setTone] = useState(initialUser?.tone ?? "friend");
  const [displayName, setDisplayName] = useState(initialUser?.displayName ?? "");
  const [age, setAge] = useState(initialUser?.age ?? "");
  const [whoUsesTool, setWhoUsesTool] = useState(initialUser?.whoUsesTool ?? "");
  const [lifestyleBrief, setLifestyleBrief] = useState(initialUser?.lifestyleBrief ?? "");
  const [lifeContext, setLifeContext] = useState(initialUser?.lifeContext ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (step !== "opener") {
      localStorage.setItem(ONBOARDING_STEP_KEY, step);
    }
  }, [step]);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const demoEmail = `demo.${Date.now()}@hackto-may.local`;
      const { user: authUser } = await api.authGoogle({
        mode: "signup",
        email: demoEmail
      });
      setUser(authUser);
      localStorage.setItem(STORAGE_KEY, authUser.id);
      setStep("tone");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveTone() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, { tone });
      setUser(updated);
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
        age: age.trim(),
        whoUsesTool,
        lifestyleBrief: lifestyleBrief.trim()
      });
      setUser(updated);
      setStep("life");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveLifeStory() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, {
        lifeContext: lifeContext.trim()
      });
      setUser(updated);
      setStep("fetching");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const connectBankAndFinish = useCallback(async () => {
    if (!user) return;
    setError(null);
    const minDelay = new Promise((r) => setTimeout(r, 2200));
    try {
      await Promise.all([
        minDelay,
        api.seedMock(user.id, "sam"),
        api.updateUser(user.id, { onboardingComplete: true, bankConnected: true })
      ]);
      const updated = await api.getUser(user.id);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      onComplete(updated);
    } catch (err) {
      setError(err.message);
    }
  }, [user, onComplete]);

  function goBack() {
    setError(null);
    const prev = {
      tone: "opener",
      profile: "tone",
      life: "profile",
      fetching: "life"
    };
    if (prev[step]) setStep(prev[step]);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <SiteHeader logoSize="md" centered />

      <OnboardingProgress step={step} />

      <div className="flex min-h-[58vh] flex-col">
        {step === "opener" && (
          <OpenerScreen onContinue={startSession} loading={loading} error={error} />
        )}
        {step === "tone" && (
          <ToneScreen
            tone={tone}
            onSelectTone={setTone}
            onBack={goBack}
            onContinue={saveTone}
            loading={loading}
            error={error}
          />
        )}
        {step === "profile" && (
          <ProfileScreen
            tone={tone}
            displayName={displayName}
            age={age}
            whoUsesTool={whoUsesTool}
            lifestyleBrief={lifestyleBrief}
            onChange={(patch) => {
              if (patch.displayName !== undefined) setDisplayName(patch.displayName);
              if (patch.age !== undefined) setAge(patch.age);
              if (patch.whoUsesTool !== undefined) setWhoUsesTool(patch.whoUsesTool);
              if (patch.lifestyleBrief !== undefined) setLifestyleBrief(patch.lifestyleBrief);
            }}
            onBack={goBack}
            onContinue={saveProfile}
            loading={loading}
            error={error}
          />
        )}
        {step === "life" && (
          <LifeStoryScreen
            lifeContext={lifeContext}
            onChange={setLifeContext}
            onBack={goBack}
            onContinue={saveLifeStory}
            loading={loading}
            error={error}
          />
        )}
        {step === "fetching" && (
          <FetchingScreen onFetch={connectBankAndFinish} error={error} />
        )}
      </div>
    </div>
  );
}
