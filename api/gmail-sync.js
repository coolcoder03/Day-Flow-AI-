const parseCookies = (header = '') => Object.fromEntries(header.split(';').map(x => x.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2));
const minutes = (start, end) => Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
async function google(url, token) { const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error(`Google request failed: ${response.status}`); return response.json(); }

export default async function handler(req, res) {
  const refresh = parseCookies(req.headers.cookie).dayflow_google_refresh;
  if (!refresh) return res.status(401).json({ error: 'Google account is not connected.' });
  const tokenBody = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', refresh_token: refresh, grant_type: 'refresh_token' });
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: tokenBody });
  if (!tokenResponse.ok) return res.status(401).json({ error: 'Google connection expired. Connect again.' });
  const { access_token: token } = await tokenResponse.json();
  try {
    const today = new Date(); const start = new Date(today); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
    const [messages, events, taskLists] = await Promise.all([
      google('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is%3Aunread%20%7Bimportant%20OR%20is%3Astarred%7D', token),
      google(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&singleEvents=true&orderBy=startTime`, token),
      google('https://tasks.googleapis.com/tasks/v1/users/@me/lists', token)
    ]);
    const emailDetails = await Promise.all((messages.messages || []).map(async message => {
      const item = await google(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, token);
      const headers = Object.fromEntries((item.payload.headers || []).map(h => [h.name, h.value]));
      return { id: item.id, subject: headers.Subject || '(No subject)', from: headers.From || '', priority: (item.labelIds || []).some(x => x === 'IMPORTANT' || x === 'STARRED') ? 'high' : 'normal' };
    }));
    const taskGroups = await Promise.all((taskLists.items || []).map(list => google(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false`, token)));
    const tasks = taskGroups.flatMap(group => group.items || []).map(task => ({ id: task.id, title: task.title, due: task.due || null, priority: 'normal' }));
    return res.status(200).json({ emails: emailDetails, events: (events.items || []).filter(e => e.start?.dateTime).map(e => ({ id: e.id, title: e.summary || '(Untitled event)', time: new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), dur: minutes(e.start.dateTime, e.end.dateTime), org: e.organizer?.email || '' })), tasks, syncedAt: new Date().toISOString() });
  } catch (error) { return res.status(502).json({ error: error.message }); }
}
