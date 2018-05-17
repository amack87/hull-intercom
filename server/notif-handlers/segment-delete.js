const Promise = require("bluebird");

function segmentDelete(ctx) {
  const { syncAgent } = ctx.service;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector is not configured"
    });
    return Promise.resolve();
  }

  return syncAgent.syncShip();
}

module.exports = segmentDelete;
