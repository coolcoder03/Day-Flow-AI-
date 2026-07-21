const cookie = (name, value) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 3}`;

export default async function handler(req, res) {
  const { code, error } = req.query;
  const appUrl = process.env.APP_URL;
  if (error || !code) return res.redirect(`${appUrl || ''}/?google=error`);
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !appUrl) return res.status(503).send('Google OAuth is not configured.');
  const callback = `${appUrl.replace(/\/$/, '')}/api/gmail-callback`;
  const body = new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: 'authorization_code' });
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) return res.redirect(`${appUrl}/?google=error`);
  const tokens = await response.json();
  if (!tokens.refresh_token) return res.redirect(`${appUrl}/?google=error`);
  res.setHeader('Set-Cookie', cookie('dayflow_google_refresh', tokens.refresh_token));
  return res.redirect(`${appUrl}/?google=connected`);
}
