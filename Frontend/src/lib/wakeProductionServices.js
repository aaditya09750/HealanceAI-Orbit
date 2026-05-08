// Fire-and-forget wake-up pings for the Render free-tier dynos.
// Runs once at app startup, production builds only.
//
// Both URLs serve a public /health endpoint and the ML service has CORS
// configured to allow the Vercel origin, so this is a normal observable
// fetch — errors will show up in DevTools just like any other request.

const TARGETS = [
  'https://healanceai-backend.onrender.com/api/health',
  'https://healanceai-ml.onrender.com/health',
];

export const wakeProductionServices = () => {
  if (!import.meta.env.PROD) return;
  for (const url of TARGETS) {
    fetch(url, {
      method: 'GET',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {});
  }
};
