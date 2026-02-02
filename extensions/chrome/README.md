# SyncVision Audio Capture Chrome Extension

Chrome extension to capture audio from meeting tabs for real-time transcription in SyncVision.

## Features

- Capture audio from Google Meet, Zoom Web, and Microsoft Teams
- Stream audio to SyncVision web app for transcription
- Visual recording indicator on meeting pages

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this `extensions/chrome` directory
5. The extension should appear in your toolbar

### Generate Icons

The extension requires PNG icons. Generate them from the SVG:

```bash
# Using ImageMagick (install via Homebrew: brew install imagemagick)
cd extensions/chrome/icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

Or use any online SVG to PNG converter.

## Usage

1. Start the SyncVision web app (`npm run dev`)
2. Open a supported meeting site (Google Meet, Zoom, or Teams)
3. Click the SyncVision extension icon
4. Enter your server URL (default: `http://localhost:3000`)
5. Click "Start Capture"
6. The meeting audio will be transcribed in real-time

## Supported Sites

| Site | URL Pattern |
|------|-------------|
| Google Meet | `meet.google.com/*` |
| Zoom Web | `*.zoom.us/*` |
| Microsoft Teams | `teams.microsoft.com/*` |

## Permissions

- `tabCapture` - Required to capture tab audio
- `activeTab` - Access current tab information
- `storage` - Save user settings

## Technical Details

### Architecture

```
Extension                          Web App
   │                                  │
   ├── tabCapture API ───────────────>│
   │   (capture audio)                │
   │                                  │
   ├── WebSocket ────────────────────>│ /api/audio
   │   (stream PCM audio)             │
   │                                  │
   │                                  ├──> Deepgram
   │                                  │    (transcription)
   │                                  │
   │                                  ├──> Gemini
   │                                  │    (analysis)
```

### Audio Format

- Sample Rate: 16000 Hz
- Channels: 1 (mono)
- Format: 16-bit PCM (Int16Array)

## Development

### Files

| File | Description |
|------|-------------|
| `manifest.json` | Extension configuration |
| `popup/popup.html` | Extension popup UI |
| `popup/popup.js` | Popup logic |
| `background/service-worker.js` | Audio capture and streaming |
| `content/content.js` | Meeting site integration |

### Debugging

1. Open `chrome://extensions/`
2. Find SyncVision extension
3. Click "service worker" to open DevTools for background script
4. Click "Inspect views: popup" to debug popup

## Troubleshooting

### "Failed to capture tab audio"
- Make sure you're on a supported meeting site
- Check that the tab has audio playing
- Try refreshing the page

### WebSocket connection failed
- Verify the web app is running
- Check the server URL is correct
- Look for CORS errors in console

### No audio data received
- Check that the meeting audio is not muted
- Verify the microphone/speaker is working
- Try adjusting the volume
