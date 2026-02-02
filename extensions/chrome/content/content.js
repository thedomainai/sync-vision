// Content script for SyncVision Audio Capture
// Injected into meeting pages (Google Meet, Zoom, Teams)

// Detect meeting site
const hostname = window.location.hostname;

let meetingType = null;
if (hostname.includes("meet.google.com")) {
  meetingType = "google-meet";
} else if (hostname.includes("zoom.us")) {
  meetingType = "zoom";
} else if (hostname.includes("teams.microsoft.com")) {
  meetingType = "teams";
}

// Log detection
console.log(`[SyncVision] Detected meeting site: ${meetingType || "none"}`);

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_MEETING_INFO":
      sendResponse({
        meetingType,
        url: window.location.href,
        title: document.title,
      });
      return true;

    case "PING":
      sendResponse({ pong: true });
      return true;

    default:
      sendResponse({ error: "Unknown message type" });
      return true;
  }
});

// Notify background script that content script is loaded
chrome.runtime.sendMessage({
  type: "CONTENT_SCRIPT_LOADED",
  meetingType,
  url: window.location.href,
});

// Optional: Add visual indicator when capturing
function showCaptureIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "syncvision-indicator";
  indicator.innerHTML = `
    <style>
      #syncvision-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999999;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      #syncvision-indicator .pulse {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: syncvision-pulse 1.5s ease-in-out infinite;
      }
      @keyframes syncvision-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
      }
    </style>
    <span class="pulse"></span>
    <span>SyncVision Recording</span>
  `;
  document.body.appendChild(indicator);
}

function hideCaptureIndicator() {
  const indicator = document.getElementById("syncvision-indicator");
  if (indicator) {
    indicator.remove();
  }
}

// Listen for capture state changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CAPTURE_STARTED") {
    showCaptureIndicator();
  } else if (message.type === "CAPTURE_STOPPED") {
    hideCaptureIndicator();
  }
});
