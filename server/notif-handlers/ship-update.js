const Promise = require("bluebird");
const { ConfigurationError } = require("hull/lib/errors");

function shipUpdate(ctx) {
  const { syncAgent } = ctx.service;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector is not configured"
    });
    return Promise.resolve();
  }

  if (ctx.smartNotifierResponse) {
    ctx.smartNotifierResponse.setFlowControl({
      type: "next",
      size: 10,
      in: 10
    });
  }

  return syncAgent
    .syncShip({ forceTagsResync: true })
    .catch(ConfigurationError, () => {
      return Promise.resolve();
    });
}

module.exports = shipUpdate;
