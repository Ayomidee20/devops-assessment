const crypto = require("crypto");
const express = require("express");

module.exports = function processRouterFactory({ redisClient }) {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const { data } = req.body || {};
      if (typeof data !== "string" || data.length === 0) {
        return res.status(400).json({ error: "invalid_request", message: "Field 'data' must be a non-empty string." });
      }

      const id = crypto.randomUUID();
      const key = `process:${id}`;

      const payload = {
        id,
        data,
        processedAt: new Date().toISOString()
      };

      await redisClient.set(key, JSON.stringify(payload));

      return res.status(200).json({ id, status: "processed" });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
