import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  playerAction,
  createGroup,
  getPlayers,
  setFavourite,
  zoneAction
} from "./src/sonos-interfacer.js";

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/music/start/:playlist', async (req: Request, res: Response) => {
  const playlist = req.params.playlist.replace(/_/g, ' ');
  const players = await getPlayers();

  const coordinator = 'Port';
  await createGroup(coordinator, players);
  await setFavourite(coordinator, playlist);
  await playerAction(coordinator, 'play');


  console.log(players);

  res.json({ success: true, action: 'play', timestamp: new Date().toISOString() });
});

app.post('/music/:action', async (req: Request, res: Response) => {
  const expectedAction = req.params.action as 'play' | 'pause' | 'playpause';
  await playerAction('Port', expectedAction);
  res.json({ success: true, action: expectedAction, timestamp: new Date().toISOString() });
});

app.post('/volume/:action', async (req: Request, res: Response) => {
  const expectedAction = req.params.action;

  let data = -2;
  if (expectedAction === 'up') {
    data = +1;
  }

  await zoneAction('Port', data);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SofaBaton Sonos HTTP Server running on port ${PORT}`);
});
