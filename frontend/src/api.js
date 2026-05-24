const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? `Request failed (${res.status})`);
    err.status = res.status;
    err.hint = data.hint;
    throw err;
  }
  return data;
}

export const api = {
  authGoogle: (body) =>
    request("/api/auth/google", { method: "POST", body: JSON.stringify(body) }),

  createUser: (body) =>
    request("/api/users", { method: "POST", body: JSON.stringify(body) }),

  getUser: (userId) => request(`/api/users/${userId}`),

  updateUser: (userId, body) =>
    request(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  seedMock: (userId, personaKey) =>
    request(`/api/users/${userId}/accounts/mock`, {
      method: "POST",
      body: JSON.stringify({ personaKey })
    }),

  getBlackHoles: (userId) => request(`/api/users/${userId}/black-holes`),

  sendCoachMessage: (userId, content) =>
    request(`/api/users/${userId}/coach/message`, {
      method: "POST",
      body: JSON.stringify({ content })
    }),

  getVoiceSummary: (userId) => request(`/api/users/${userId}/voice/summary`),

  speakVoiceSummary: (userId, script) =>
    request(`/api/users/${userId}/voice/speak`, {
      method: "POST",
      body: JSON.stringify({ script })
    })
};

export const STORAGE_KEY = "hackto_user_id";
