import { test, expect } from "@playwright/test";
import WebSocket from "ws";

test.describe("WebSocket Server", () => {
  const WS_URL = "ws://localhost:3001";

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("http://localhost:3001/health");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("WebSocket connection can be established", async () => {
    const ws = new WebSocket(WS_URL);

    const connected = await new Promise<boolean>((resolve) => {
      ws.on("open", () => resolve(true));
      ws.on("error", () => resolve(false));
      setTimeout(() => resolve(false), 5000);
    });

    expect(connected).toBe(true);

    // Should receive welcome message
    const welcomeMessage = await new Promise<string>((resolve) => {
      ws.on("message", (data) => {
        resolve(data.toString());
      });
      setTimeout(() => resolve(""), 5000);
    });

    const parsed = JSON.parse(welcomeMessage);
    expect(parsed.type).toBe("connected");
    expect(parsed.clientId).toBeDefined();

    ws.close();
  });

  test("WebSocket handles ping message", async () => {
    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve) => {
      ws.on("open", () => resolve());
    });

    // Skip welcome message
    await new Promise<void>((resolve) => {
      ws.on("message", () => resolve());
    });

    // Send ping
    ws.send(JSON.stringify({ type: "ping" }));

    // Should receive pong
    const pongMessage = await new Promise<string>((resolve) => {
      ws.on("message", (data) => {
        resolve(data.toString());
      });
      setTimeout(() => resolve(""), 5000);
    });

    const parsed = JSON.parse(pongMessage);
    expect(parsed.type).toBe("pong");

    ws.close();
  });

  test("WebSocket accepts audio endpoint connection", async () => {
    const ws = new WebSocket(`${WS_URL}/api/audio`);

    const connected = await new Promise<boolean>((resolve) => {
      ws.on("open", () => resolve(true));
      ws.on("error", () => resolve(false));
      setTimeout(() => resolve(false), 5000);
    });

    expect(connected).toBe(true);

    ws.close();
  });
});
