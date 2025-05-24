const RateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const logger = require("../../logger").policy;
const db = require("../../db");

module.exports = (params) => {
  if (params.rateLimitBy) {
    params.keyGenerator = (req) => {
      try {
        return req.egContext.evaluateAsTemplateString(params.rateLimitBy);
      } catch (err) {
        logger.error(
          "Failed to generate rate-limit key with config: %s; %s",
          params.rateLimitBy,
          err.message
        );
      }
    };
  }
  return new RateLimit(
    Object.assign(params, {
      legacyHeaders: true, // to keep compatibility with old clients
      standardHeaders: true, // to expose rate limit info in the `RateLimit-*` headers
      store: new RedisStore({
        sendCommand: db.call.bind(db),
      }),
    })
  );
};
