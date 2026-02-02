// Background service worker for SyncVision Audio Capture

// State
let state = {
  isCapturing: false,
  tabId: null,
  tabUrl: null,
  serverUrl: null,
  mediaStream: null,
  websocket: null,
  audioContext: null,
  processor: null,
};

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_STATE":
      sendResponse({
        isCapturing: state.isCapturing,
        tabId: state.tabId,
        tabUrl: state.tabUrl,
      });
      return true;

    case "START_CAPTURE":
      startCapture(message.tabId, message.serverUrl)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ error: error.message }));
      return true;

    case "STOP_CAPTURE":
      stopCapture()
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ error: error.message }));
      return true;

    default:
      sendResponse({ error: "Unknown message type" });
      return true;
  }
});

// Start audio capture from tab
async function startCapture(tabId, serverUrl) {
  if (state.isCapturing) {
    throw new Error("Already capturing");
  }

  try {
    // Get the tab info
    const tab = await chrome.tabs.get(tabId);

    // Request tab capture
    const streamId = await new Promise((resolve, reject) => {
      chrome.tabCapture.capture(
        {
          audio: true,
          video: false,
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!stream) {
            reject(new Error("Failed to capture tab audio"));
            return;
          }
          resolve(stream);
        }
      );
    });

    state.mediaStream = streamId;
    state.tabId = tabId;
    state.tabUrl = tab.url;
    state.serverUrl = serverUrl;

    // Connect to WebSocket server
    await connectWebSocket(serverUrl);

    // Start audio processing
    await startAudioProcessing(streamId);

    state.isCapturing = true;

    // Notify popup of state change
    broadcastStateChange();

    console.log("Audio capture started for tab:", tabId);
  } catch (error) {
    console.error("Failed to start capture:", error);
    await cleanup();
    throw error;
  }
}

// Connect to WebSocket server
async function connectWebSocket(serverUrl) {
  return new Promise((resolve, reject) => {
    const wsUrl = serverUrl.replace(/^http/, "ws") + "/api/audio";

    console.log("Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      state.websocket = ws;
      resolve();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      reject(new Error("Failed to connect to server"));
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      if (state.isCapturing) {
        // Connection lost while capturing, stop capture
        stopCapture();
      }
    };

    ws.onmessage = (event) => {
      // Handle messages from server if needed
      console.log("WebSocket message:", event.data);
    };

    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }
    }, 5000);
  });
}

// Start processing audio from media stream
async function startAudioProcessing(stream) {
  // Create audio context
  state.audioContext = new AudioContext({ sampleRate: 16000 });

  // Create source from stream
  const source = state.audioContext.createMediaStreamSource(stream);

  // Create script processor for audio data
  state.processor = state.audioContext.createScriptProcessor(4096, 1, 1);

  state.processor.onaudioprocess = (event) => {
    if (!state.websocket || state.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    // Get audio data
    const inputData = event.inputBuffer.getChannelData(0);

    // Convert to 16-bit PCM
    const pcm16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Send to server
    state.websocket.send(pcm16.buffer);
  };

  // Connect nodes
  source.connect(state.processor);
  state.processor.connect(state.audioContext.destination);
}

// Stop audio capture
async function stopCapture() {
  await cleanup();

  state.isCapturing = false;
  state.tabId = null;
  state.tabUrl = null;

  // Notify popup of state change
  broadcastStateChange();

  console.log("Audio capture stopped");
}

// Cleanup resources
async function cleanup() {
  // Stop processor
  if (state.processor) {
    state.processor.disconnect();
    state.processor = null;
  }

  // Close audio context
  if (state.audioContext) {
    await state.audioContext.close();
    state.audioContext = null;
  }

  // Stop media stream
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach((track) => track.stop());
    state.mediaStream = null;
  }

  // Close WebSocket
  if (state.websocket) {
    state.websocket.close();
    state.websocket = null;
  }
}

// Broadcast state change to popup
function broadcastStateChange() {
  chrome.runtime.sendMessage({
    type: "STATE_CHANGED",
    state: {
      isCapturing: state.isCapturing,
      tabId: state.tabId,
      tabUrl: state.tabUrl,
    },
  });
}

// Handle tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (state.isCapturing && state.tabId === tabId) {
    console.log("Captured tab was closed, stopping capture");
    stopCapture();
  }
});

// Handle extension unload
self.addEventListener("unload", () => {
  cleanup();
});
