const request = require("supertest");
const { createClient } = require("redis");
const { createApp } = require("../src/server");

describe("GET /health", () => {
  test("returns status ok", async () => {
    // This test doesn't require Redis, but the app expects a client object.
    const redisClient = createClient({ url: "redis://localhost:6379" });
    const app = createApp({ redisClient, serviceName: "test-service" });

    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

