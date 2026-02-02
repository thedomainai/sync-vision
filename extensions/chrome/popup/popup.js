// Popup script for SyncVision Audio Capture

const DEFAULT_SERVER_URL = "http://localhost:3000";

// DOM Elements
const statusEl = document.getElementById("status");
const tabInfoEl = document.getElementById("tabInfo");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const openAppBtn = document.getElementById("openAppBtn");
const serverUrlInput = document.getElementById("serverUrl");
const errorEl = document.getElementById("error");
const successEl = document.getElementById("success");

// State
let isCapturing = false;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  const { serverUrl } = await chrome.storage.local.get(["serverUrl"]);
  serverUrlInput.value = serverUrl || DEFAULT_SERVER_URL;

  // Get current capture state
  const state = await getState();
  updateUI(state);

  // Listen for state changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATE_CHANGED") {
      updateUI(message.state);
    }
  });
});

// Event Listeners
startBtn.addEventListener("click", startCapture);
stopBtn.addEventListener("click", stopCapture);
openAppBtn.addEventListener("click", openApp);
serverUrlInput.addEventListener("change", saveSettings);

// Functions
async function getState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
      resolve(response || { isCapturing: false });
    });
  });
}

async function startCapture() {
  hideMessages();

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    showError("No active tab found");
    return;
  }

  // Check if tab is a supported meeting site
  const supportedSites = ["meet.google.com", "zoom.us", "teams.microsoft.com"];
  const url = new URL(tab.url);
  const isSupported = supportedSites.some((site) => url.hostname.includes(site));

  if (!isSupported) {
    showError(
      "Please navigate to a supported meeting site (Google Meet, Zoom, or Teams)"
    );
    return;
  }

  // Save server URL
  await saveSettings();

  // Send message to background to start capture
  chrome.runtime.sendMessage(
    {
      type: "START_CAPTURE",
      tabId: tab.id,
      serverUrl: serverUrlInput.value || DEFAULT_SERVER_URL,
    },
    (response) => {
      if (response?.error) {
        showError(response.error);
      } else if (response?.success) {
        showSuccess("Audio capture started");
        updateUI({ isCapturing: true, tabId: tab.id, tabUrl: tab.url });
      }
    }
  );
}

async function stopCapture() {
  hideMessages();

  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" }, (response) => {
    if (response?.error) {
      showError(response.error);
    } else {
      showSuccess("Audio capture stopped");
      updateUI({ isCapturing: false });
    }
  });
}

async function openApp() {
  const serverUrl = serverUrlInput.value || DEFAULT_SERVER_URL;
  chrome.tabs.create({ url: `${serverUrl}/realtime` });
}

async function saveSettings() {
  const serverUrl = serverUrlInput.value || DEFAULT_SERVER_URL;
  await chrome.storage.local.set({ serverUrl });
}

function updateUI(state) {
  isCapturing = state.isCapturing;

  if (isCapturing) {
    statusEl.textContent = "Recording";
    statusEl.className = "status-value recording";
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");

    if (state.tabUrl) {
      tabInfoEl.textContent = `Capturing: ${state.tabUrl}`;
      tabInfoEl.classList.remove("hidden");
    }
  } else {
    statusEl.textContent = "Idle";
    statusEl.className = "status-value idle";
    startBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    tabInfoEl.classList.add("hidden");
  }
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  successEl.classList.add("hidden");
}

function showSuccess(message) {
  successEl.textContent = message;
  successEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
}

function hideMessages() {
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");
}
