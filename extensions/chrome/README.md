# SyncVision Audio Capture Chrome Extension

Chrome extension to capture audio from meeting tabs for real-time transcription in SyncVision.

## Features

- Capture audio from Google Meet, Zoom Web, and Microsoft Teams
- Stream audio to WebSocket server for transcription via Deepgram
- Visual recording indicator on meeting pages

## Quick Start

### 1. Start the servers

```bash
# Terminal 1: Start Next.js web app
npm run dev

# Terminal 2: Start WebSocket server
npm run dev:ws

# Or run both together
npm run dev:all
```

### 2. Install the extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this `extensions/chrome` directory
5. The extension should appear in your toolbar (🎙️ icon)

### 3. Configure environment

Create `.env.local` in the project root:

```
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### 4. Start capturing

1. Open a meeting (Google Meet, Zoom, or Teams)
2. Click the SyncVision extension icon 🎙️
3. Click "Start Capture"
4. Open SyncVision web app to see transcription

## Supported Sites

| Site | URL Pattern |
|------|-------------|
| Google Meet | `meet.google.com/*` |
| Zoom Web | `*.zoom.us/*` |
| Microsoft Teams | `teams.microsoft.com/*` |

## Server URLs

| Server | Default URL | Purpose |
|--------|-------------|---------|
| Web App | http://localhost:3000 | SyncVision UI |
| WebSocket | http://localhost:3001 | Audio streaming |

## Architecture

```
Chrome Extension                WebSocket Server              Deepgram
      │                              │                           │
      ├── tabCapture ───────────────>│                           │
      │   (audio stream)             │                           │
      │                              ├── WebSocket ─────────────>│
      │                              │   (audio)                 │
      │                              │<──────────────────────────┤
      │<─────────────────────────────┤   (transcription)         │
      │   (confirmation)             │                           │
      │                              │                           │
      │                              │───> Web App               │
      │                              │     (broadcast)           │
```

## Audio Format

- Sample Rate: 16000 Hz
- Channels: 1 (mono)
- Format: 16-bit PCM (Int16Array)

## Permissions

- `tabCapture` - Capture tab audio
- `activeTab` - Access current tab
- `storage` - Save settings

## Development

### Files

| File | Description |
|------|-------------|
| `manifest.json` | Extension manifest (v3) |
| `popup/popup.html` | Extension popup UI |
| `popup/popup.js` | Popup logic |
| `background/service-worker.js` | Audio capture & streaming |
| `content/content.js` | Meeting site integration |
| `icons/` | Extension icons (SVG with 🎙️) |

### Debugging

1. Open `chrome://extensions/`
2. Find SyncVision extension
3. Click "service worker" → DevTools for background
4. Click "Inspect views: popup" → DevTools for popup

## Troubleshooting

### "Failed to capture tab audio"
- Make sure you're on a supported meeting site
- Check that the tab has audio playing
- Try refreshing the page

### WebSocket connection failed
- Verify WebSocket server is running (`npm run dev:ws`)
- Check the server URL in extension settings
- Default: `http://localhost:3001`

### No transcription appears
- Check DEEPGRAM_API_KEY is set in `.env.local`
- Look for errors in WebSocket server console
- Verify audio is not muted in the meeting
