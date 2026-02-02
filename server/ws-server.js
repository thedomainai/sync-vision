/**
 * WebSocket server for Chrome extension audio streaming
 *
 * Receives audio from Chrome extension and forwards to Deepgram for transcription.
 * Broadcasts transcription results to connected web clients.
 *
 * Usage: node server/ws-server.js
 */

const WebSocket = require("ws");
const http = require("http");

// Configuration
const PORT = process.env.WS_PORT || 3001;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS headers for health check endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", clients: clients.size }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Map(); // clientId -> { ws, type, deepgramWs }

// Generate client ID
let clientIdCounter = 0;
function generateClientId() {
  return `client-${++clientIdCounter}-${Date.now()}`;
}

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  const clientId = generateClientId();
  const clientType = req.url === "/api/audio" ? "extension" : "webapp";

  console.log(`[${clientId}] Connected (${clientType})`);

  clients.set(clientId, {
    ws,
    type: clientType,
    deepgramWs: null,
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connected",
      clientId,
      message: "Connected to SyncVision WebSocket server",
    })
  );

  // Handle messages
  ws.on("message", (data) => {
    const client = clients.get(clientId);

    if (client.type === "extension") {
      // Audio data from Chrome extension
      handleAudioData(clientId, data);
    } else {
      // Control messages from web app
      try {
        const message = JSON.parse(data.toString());
        handleWebAppMessage(clientId, message);
      } catch (e) {
        console.error(`[${clientId}] Invalid message:`, e.message);
      }
    }
  });

  // Handle close
  ws.on("close", () => {
    console.log(`[${clientId}] Disconnected`);
    const client = clients.get(clientId);

    // Close Deepgram connection if exists
    if (client?.deepgramWs) {
      client.deepgramWs.close();
    }

    clients.delete(clientId);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`[${clientId}] Error:`, error.message);
  });
});

// Handle audio data from Chrome extension
function handleAudioData(clientId, audioData) {
  const client = clients.get(clientId);
  if (!client) return;

  // Initialize Deepgram connection if not exists
  if (!client.deepgramWs || client.deepgramWs.readyState !== WebSocket.OPEN) {
    initDeepgramConnection(clientId);
    return; // Wait for connection to establish
  }

  // Forward audio to Deepgram
  if (client.deepgramWs.readyState === WebSocket.OPEN) {
    client.deepgramWs.send(audioData);
  }
}

// Initialize Deepgram WebSocket connection
function initDeepgramConnection(clientId) {
  const client = clients.get(clientId);
  if (!client) return;

  if (!DEEPGRAM_API_KEY) {
    console.error("DEEPGRAM_API_KEY is not set");
    client.ws.send(
      JSON.stringify({
        type: "error",
        message: "Deepgram API key not configured",
      })
    );
    return;
  }

  console.log(`[${clientId}] Connecting to Deepgram...`);

  const deepgramUrl = new URL("wss://api.deepgram.com/v1/listen");
  deepgramUrl.searchParams.set("model", "nova-2");
  deepgramUrl.searchParams.set("language", "ja");
  deepgramUrl.searchParams.set("punctuate", "true");
  deepgramUrl.searchParams.set("interim_results", "true");
  deepgramUrl.searchParams.set("encoding", "linear16");
  deepgramUrl.searchParams.set("sample_rate", "16000");
  deepgramUrl.searchParams.set("channels", "1");

  const deepgramWs = new WebSocket(deepgramUrl.toString(), {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  deepgramWs.on("open", () => {
    console.log(`[${clientId}] Deepgram connected`);
    client.deepgramWs = deepgramWs;

    // Notify client
    client.ws.send(
      JSON.stringify({
        type: "deepgram_connected",
        message: "Transcription started",
      })
    );
  });

  deepgramWs.on("message", (data) => {
    try {
      const result = JSON.parse(data.toString());

      // Extract transcript
      const transcript = result.channel?.alternatives?.[0]?.transcript;
      const isFinal = result.is_final;

      if (transcript) {
        // Broadcast to all connected web app clients
        broadcastToWebApps({
          type: "transcript",
          transcript,
          isFinal,
          speaker: result.channel?.alternatives?.[0]?.words?.[0]?.speaker,
        });

        // Also send back to extension for confirmation
        client.ws.send(
          JSON.stringify({
            type: "transcript",
            transcript,
            isFinal,
          })
        );
      }
    } catch (e) {
      console.error(`[${clientId}] Deepgram parse error:`, e.message);
    }
  });

  deepgramWs.on("close", () => {
    console.log(`[${clientId}] Deepgram disconnected`);
    client.deepgramWs = null;

    client.ws.send(
      JSON.stringify({
        type: "deepgram_disconnected",
        message: "Transcription stopped",
      })
    );
  });

  deepgramWs.on("error", (error) => {
    console.error(`[${clientId}] Deepgram error:`, error.message);
    client.deepgramWs = null;
  });
}

// Handle messages from web app
function handleWebAppMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case "ping":
      client.ws.send(JSON.stringify({ type: "pong" }));
      break;

    case "subscribe":
      // Web app wants to receive transcripts
      console.log(`[${clientId}] Subscribed to transcripts`);
      break;

    default:
      console.log(`[${clientId}] Unknown message type:`, message.type);
  }
}

// Broadcast message to all web app clients
function broadcastToWebApps(message) {
  const messageStr = JSON.stringify(message);

  for (const [clientId, client] of clients) {
    if (client.type === "webapp" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     SyncVision WebSocket Server                        ║
╠════════════════════════════════════════════════════════╣
║  Audio endpoint:  ws://localhost:${PORT}/api/audio         ║
║  Web app endpoint: ws://localhost:${PORT}/                 ║
║  Health check:    http://localhost:${PORT}/health          ║
╠════════════════════════════════════════════════════════╣
║  Environment:                                          ║
║  - DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY ? "Set ✓" : "Not set ✗"}                       ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");

  // Close all client connections
  for (const [clientId, client] of clients) {
    if (client.deepgramWs) {
      client.deepgramWs.close();
    }
    client.ws.close();
  }

  wss.close(() => {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});
