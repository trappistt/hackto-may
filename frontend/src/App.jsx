import { useEffect, useState } from "react";
import { api, STORAGE_KEY } from "./api.js";
import AppShell from "./components/AppShell.jsx";
import OnboardingFlow from "./components/onboarding/OnboardingFlow.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [resumeUser, setResumeUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      setBooting(false);
      return;
    }
    api
      .getUser(id)
      .then((u) => {
        if (u.onboardingComplete) setUser(u);
        else setResumeUser(u);
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setBooting(false));
  }, []);

  function handleOnboardingComplete(completedUser) {
    localStorage.setItem(STORAGE_KEY, completedUser.id);
    setUser(completedUser);
    setResumeUser(null);
  }

  function handleSignOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setResumeUser(null);
  }

  if (booting) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[40vh] max-w-md items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (user) {
    return (
      <AppShell>
        <Dashboard user={user} onSignOut={handleSignOut} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <OnboardingFlow
        initialUser={resumeUser}
        onComplete={handleOnboardingComplete}
      />
    </AppShell>
  );
}
