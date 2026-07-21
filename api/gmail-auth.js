const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly'
];

export default function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) return res.status(503).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and APP_URL.' });
  const callback = `${appUrl.replace(/\/$/, '')}/api/gmail-callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: SCOPES.join(' ') });
  return res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}
