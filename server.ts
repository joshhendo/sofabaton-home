import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  playerAction,
  createGroup,
  getPlayers,
  getZoneWithCoordinator,
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

// Device control endpoints
app.post('/device/power', (req: Request, res: Response) => {
  const { action } = req.body;

  console.log(`Power command received: ${action}`);

  // Add your device control logic here
  switch (action) {
    case 'on':
      console.log('Turning device ON');
      // Your power on logic here
      break;
    case 'off':
      console.log('Turning device OFF');
      // Your power off logic here
      break;
    case 'toggle':
      console.log('Toggling device power');
      // Your toggle logic here
      break;
    default:
      return res.status(400).json({ error: 'Invalid power action' });
  }

  res.json({ success: true, action, timestamp: new Date().toISOString() });
});

app.post('/device/volume', (req: Request, res: Response) => {
  const { action, level } = req.body;

  console.log(
    `Volume command received: ${action}${level ? ` (level: ${level})` : ''}`,
  );

  switch (action) {
    case 'up':
      console.log('Increasing volume');
      // Your volume up logic here
      break;
    case 'down':
      console.log('Decreasing volume');
      // Your volume down logic here
      break;
    case 'set':
      if (typeof level === 'number' && level >= 0 && level <= 100) {
        console.log(`Setting volume to ${level}%`);
        // Your set volume logic here
      } else {
        return res.status(400).json({ error: 'Invalid volume level (0-100)' });
      }
      break;
    default:
      return res.status(400).json({ error: 'Invalid volume action' });
  }

  res.json({
    success: true,
    action,
    level,
    timestamp: new Date().toISOString(),
  });
});

app.post('/device/mute', (req: Request, res: Response) => {
  const { action } = req.body;

  console.log(`Mute command received: ${action}`);

  switch (action) {
    case 'on':
      console.log('Muting device');
      // Your mute logic here
      break;
    case 'off':
      console.log('Unmuting device');
      // Your unmute logic here
      break;
    case 'toggle':
      console.log('Toggling mute');
      // Your toggle mute logic here
      break;
    default:
      return res.status(400).json({ error: 'Invalid mute action' });
  }

  res.json({ success: true, action, timestamp: new Date().toISOString() });
});

// Input/Source control
app.post('/device/input', (req: Request, res: Response) => {
  const { source } = req.body;

  console.log(`Input change command received: ${source}`);

  const validSources = ['hdmi1', 'hdmi2', 'hdmi3', 'usb', 'bluetooth', 'aux'];

  if (!validSources.includes(source)) {
    return res.status(400).json({
      error: 'Invalid source',
      validSources,
    });
  }

  console.log(`Switching to input: ${source}`);
  // Your input switching logic here

  res.json({ success: true, source, timestamp: new Date().toISOString() });
});

// Channel/Navigation controls
app.post('/device/channel', (req: Request, res: Response) => {
  const { action, number } = req.body;

  console.log(
    `Channel command received: ${action}${number ? ` (${number})` : ''}`,
  );

  switch (action) {
    case 'up':
      console.log('Channel up');
      break;
    case 'down':
      console.log('Channel down');
      break;
    case 'set':
      if (typeof number === 'number' && number > 0) {
        console.log(`Changing to channel ${number}`);
      } else {
        return res.status(400).json({ error: 'Invalid channel number' });
      }
      break;
    default:
      return res.status(400).json({ error: 'Invalid channel action' });
  }

  res.json({
    success: true,
    action,
    number,
    timestamp: new Date().toISOString(),
  });
});

// Navigation controls (for smart TVs, streaming devices, etc.)
app.post('/device/navigate', (req: Request, res: Response) => {
  const { direction } = req.body;

  console.log(`Navigation command received: ${direction}`);

  const validDirections = [
    'up',
    'down',
    'left',
    'right',
    'select',
    'back',
    'home',
    'menu',
  ];

  if (!validDirections.includes(direction)) {
    return res.status(400).json({
      error: 'Invalid direction',
      validDirections,
    });
  }

  console.log(`Navigating: ${direction}`);
  // Your navigation logic here

  res.json({ success: true, direction, timestamp: new Date().toISOString() });
});

// Generic command endpoint for custom actions
app.post('/command/:commandName', (req: Request, res: Response) => {
  const { commandName } = req.params;
  const payload = req.body;

  console.log(`Custom command received: ${commandName}`);
  console.log('Payload:', payload);

  // Your custom command logic here
  // This is where you can handle any specific commands for your devices

  res.json({
    success: true,
    command: commandName,
    payload,
    timestamp: new Date().toISOString(),
  });
});

// GET endpoints for simple commands (alternative to POST)
app.get('/device/power/:action', (req: Request, res: Response) => {
  const { action } = req.params;
  console.log(`GET Power command: ${action}`);

  // Handle the same way as POST
  res.json({
    success: true,
    action,
    method: 'GET',
    timestamp: new Date().toISOString(),
  });
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
  console.log(`SofaBaton HTTP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nExample SofaBaton commands:`);
  console.log(`- Power On: POST /device/power {"action": "on"}`);
  console.log(`- Volume Up: POST /device/volume {"action": "up"}`);
  console.log(`- Mute Toggle: POST /device/mute {"action": "toggle"}`);
  console.log(`- Change Input: POST /device/input {"source": "hdmi1"}`);
  console.log(`- Navigate: POST /device/navigate {"direction": "up"}`);
});
