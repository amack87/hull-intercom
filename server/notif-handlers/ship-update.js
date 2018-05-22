const Promise = require("bluebird");

function shipUpdate(ctx) {
  const { syncAgent } = ctx.service;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector is not configured"
    });
    return Promise.resolve();
  }

  return syncAgent.syncShip({ forceTagsResync: true });
}

module.exports = shipUpdate;
