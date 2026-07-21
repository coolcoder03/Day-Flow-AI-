# DayFlow AI+

DayFlow AI+ is a prayer-first daily planner for Muslim professionals. It anchors each day around the five daily prayers, then helps users fit tasks, meetings, habits, Gmail priorities, and Calendar events around those non-negotiable moments.

<img width="488" height="440" alt="image" src="https://github.com/user-attachments/assets/b3b8c96d-0117-478d-8a67-76da27625266" />


## Features

- Prayer-aware daily timeline with protected prayer blocks
- Responsive desktop, tablet, and mobile layouts
- Add, complete, and delete habits, tasks, and meetings
- Persist planning data locally in the browser
- One-click local schedule generation
- Google OAuth-ready Gmail, Calendar, and Tasks integration
- Read-only Google scopes: the app does not send email or change events

## Local development

Requirements: Node.js 20 or later is recommended.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`.

Create a local `.env` file from the example when testing the Vercel API routes:

```bash
cp .env.example .env
```

## Deploy to Vercel

Import this repository into Vercel. It automatically builds the Vite frontend and deploys the functions under `api/`.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework | Vite |

## Google Gmail, Calendar, and Tasks

The Google integration is server-side. Never put the Google client secret in browser code or in a `VITE_*` environment variable.

1. Create a Google Cloud project and enable Gmail API, Google Calendar API, and Google Tasks API.
2. Configure an External OAuth consent screen and add your test users while Google verification is pending.
3. Create an OAuth 2.0 **Web application** client.
4. Add this authorized redirect URI exactly:

   ```text
   https://YOUR-DOMAIN/api/gmail-callback
   ```

5. In Vercel, add the following encrypted environment variables and redeploy:

   ```text
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   APP_URL=https://YOUR-DOMAIN
   ```

After deployment, select **Continue with Google** under **Tasks & setup**. DayFlow requests read-only access to unread important/starred Gmail, today’s timed Calendar events, and open Google Tasks.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/gmail-auth` | Starts Google OAuth authorization |
| `GET /api/gmail-callback` | Exchanges the authorization code securely on the server |
| `GET /api/gmail-sync` | Reads Gmail, Calendar, and Tasks data |

The current proof-of-concept uses a secure HTTP-only refresh-token cookie for up to three days. For a public production release, move encrypted refresh tokens and sync caches to DynamoDB, add OAuth `state` validation, and provide disconnect/data-deletion controls.

## Tech stack

- React + Vite
- CSS custom responsive design system
- Vercel Functions
- Google OAuth 2.0
- Gmail, Google Calendar, and Google Tasks APIs

## Security note

This project intentionally uses read-only Google API permissions. OAuth credentials belong exclusively in Vercel environment variables; do not commit `.env` files or OAuth secrets to GitHub.
