const express = require("express");
const { createClient } = require("redis");
const processRouterFactory = require("../routes/process");

function envBool(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function buildRedisClientFromEnv() {
  const host = process.env.REDIS_HOST || "localhost";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD;
  const tlsEnabled = envBool(process.env.REDIS_TLS, false);

  const url = `redis${tlsEnabled ? "s" : ""}://${host}:${port}`;

  const client = createClient({
    url,
    ...(password ? { password } : {}),
    ...(tlsEnabled ? { socket: { tls: true, rejectUnauthorized: true } } : {})
  });

  client.on("error", (err) => {
    console.error(JSON.stringify({ level: "error", msg: "redis_error", err: String(err) }));
  });

  return client;
}

function createApp({ redisClient, serviceName }) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/status", (_req, res) => {
    res.status(200).json({
      service: serviceName,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  app.use("/process", processRouterFactory({ redisClient }));

  app.use((err, _req, res, _next) => {
    console.error(JSON.stringify({ level: "error", msg: "unhandled_error", err: String(err) }));
    res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}

async function start() {
  const port = Number(process.env.PORT || 3000);
  const serviceName = process.env.SERVICE_NAME || "devops-assessment-api";

  const redisClient = buildRedisClientFromEnv();
  await redisClient.connect();

  const app = createApp({ redisClient, serviceName });

  const server = app.listen(port, () => {
    console.log(JSON.stringify({ level: "info", msg: "server_started", port, serviceName }));
  });

  const shutdown = async (signal) => {
    console.log(JSON.stringify({ level: "info", msg: "shutdown_signal", signal }));
    server.close(async () => {
      try {
        await redisClient.quit();
      } catch (e) {
        console.error(JSON.stringify({ level: "error", msg: "redis_quit_failed", err: String(e) }));
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  start().catch((err) => {
    console.error(JSON.stringify({ level: "error", msg: "startup_failed", err: String(err) }));
    process.exit(1);
  });
}

module.exports = { createApp, buildRedisClientFromEnv };
