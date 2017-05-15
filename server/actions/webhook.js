import { Batcher } from "hull/lib/infra";
import _ from "lodash";

export default function webhook(req, res, next) {
  req.hull.client.logger.debug("intercom message", req.body);
  if (_.get(req, "body.topic") === "user.created") {
    // map the users to get only mapped fields
    return Batcher.getHandler("webhook", {
      ctx: req.hull,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        throttle: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
    .setCallback(users => req.hull.enqueue("saveUsers", { users }))
    .addMessage(_.get(req, "body.data.item"))
    .then(next, next);
  }

  return Batcher.getHandler("webhook_events", {
    ctx: req.hull,
    options: {
      maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
      throttle: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
    }
  })
  .setCallback(events => req.hull.enqueue("saveEvents", { events }))
  .addMessage(_.get(req, "body"))
  .then(next, next);
}
