# Deployment

## Chosen approach: one Render web service (server serves the client)
WebSockets need a long-lived process, so the server runs on Render and also serves the built React app. One URL, one service, no CORS or mixed-content problems.

> Vercel and Netlify run frontend and serverless functions that are short-lived and cannot hold WebSocket connections. If the client were hosted there, the WebSocket server would still need Render or Railway, and `VITE_WS_URL` would point to it.

## Build and start
Root `package.json` scripts (to add in step 7):
```json
{
  "scripts": {
    "build": "npm --prefix client install && npm --prefix client run build && npm --prefix server install && npm --prefix server run build",
    "start": "node server/dist/index.js"
  }
}
```
In production `server/src/index.ts` serves `../../client/dist` with `express.static` and falls back to `index.html`.

## Render settings
| Field | Value |
|---|---|
| Type | Web Service |
| Runtime | Node 20 |
| Build command | `npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Env | `NODE_ENV=production` (Render sets `PORT`) |

## Client WebSocket URL
```ts
const url = import.meta.env.VITE_WS_URL
  ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
```
- Production: same origin, no env needed.
- Local dev: Vite proxy forwards `/ws` to `localhost:3001`, or set `VITE_WS_URL=ws://localhost:3001/ws`.

## Constraints to know
- **Free tier sleeps** after inactivity, so the first request can take ~30–60 s. Open the URL before a demo or use an uptime pinger on `/api/health`.
- **Single instance only**: rooms live in memory. Do not scale to multiple instances without Redis and sticky sessions.
- **Deploys disconnect everyone**: all rooms are lost on restart.
- Use `wss://` on HTTPS pages (handled by the snippet above).

## Production checklist
- [ ] `/api/health` returns `{ ok: true }`
- [ ] Two devices on different networks can create, join, draw, guess and finish a game
- [ ] Refresh mid-game restores the player via token
- [ ] README contains the live URL
