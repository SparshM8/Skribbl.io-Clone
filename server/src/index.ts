import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { InMemoryRoomStore } from './RoomStore.js';
import { MessageRouter, type Ctx } from './MessageRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

const PORT = Number(process.env.PORT ?? 3001);
const store = new InMemoryRoomStore();
const router = new MessageRouter(store);

const app = express();
app.use(cors());
app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });

// Heartbeat: drop dead sockets so the reconnect grace timer can kick in.
const alive = new WeakSet<WebSocket>();
wss.on('connection', (ws) => {
  const ctx: Ctx = { player: null, room: null };
  alive.add(ws);
  ws.on('pong', () => alive.add(ws));
  ws.on('message', (data) => router.handle(ws, ctx, data.toString()));
  ws.on('close', () => router.onDisconnect(ctx));
});
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!alive.has(ws)) return ws.terminate();
    alive.delete(ws);
    ws.ping();
  });
}, 15_000);

server.listen(PORT, () => console.log(`Server on :${PORT}  (ws path /ws)`));
