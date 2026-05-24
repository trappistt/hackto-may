import { useCallback, useEffect, useState } from "react";
import { api, STORAGE_KEY } from "./api.js";
import DemoSetup from "./components/DemoSetup.jsx";
import BlackHoleReport from "./components/BlackHoleReport.jsx";
import CoachChat from "./components/CoachChat.jsx";
import VoiceSummary from "./components/VoiceSummary.jsx";

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const loadReport = useCallback(async (id) => {
    setLoading(true);
    setSetupError(null);
    try {
      const data = await api.getBlackHoles(id);
      setReport(data);
    } catch (err) {
      setSetupError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadReport(userId);
  }, [userId, loadReport]);

  async function handleSetup({ personaKey, tone }) {
    setLoading(true);
    setSetupError(null);
    try {
      const user = await api.createUser({ tone });
      await api.seedMock(user.id, personaKey);
      localStorage.setItem(STORAGE_KEY, user.id);
      setUserId(user.id);
      await loadReport(user.id);
    } catch (err) {
      setSetupError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
    setReport(null);
    setSetupError(null);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ◉
          </span>
          <div>
            <strong>hackto-may</strong>
            <span className="muted">Interest black hole copilot</span>
          </div>
        </div>
        {userId && (
          <div className="topbar-actions">
            <code className="user-id" title={userId}>
              {userId.slice(0, 8)}…
            </code>
            <button type="button" className="ghost" onClick={resetDemo}>
              New demo
            </button>
          </div>
        )}
      </header>

      <main className="layout">
        {!userId ? (
          <DemoSetup onReady={handleSetup} loading={loading} error={setupError} />
        ) : (
          <>
            <div className="main-column">
              <BlackHoleReport
                report={report}
                loading={loading && !report}
                onRefresh={() => loadReport(userId)}
              />
              <VoiceSummary userId={userId} report={report} />
            </div>
            <CoachChat
              userId={userId}
              onSend={(content) => api.sendCoachMessage(userId, content)}
            />
          </>
        )}
      </main>
    </div>
  );
}
