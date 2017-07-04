import Promise from "bluebird";

export default function segmentDelete(ctx) {
  const { syncAgent } = ctx.service;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.warn("ship is not configured");
    return Promise.resolve();
  }

  return syncAgent.syncShip();
}
