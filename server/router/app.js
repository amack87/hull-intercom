/* @flow */
const { Router } = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { notifHandler, responseMiddleware, smartNotifierHandler } = require("hull/lib/utils");

const appMiddleware = require("../lib/middleware/app-middleware");
const requireConfiguration = require("../lib/middleware/require-configuration");
const notifHandlers = require("./../notif-handlers");
const actions = require("./../actions");

function appRouter(): Router {
  const router = new Router();

  // FIXME: since we have two routers on the same mountpoint: "/"
  // all middleware applied here also is applied to the static router,
  // which is a bad things, that's why we add the middleware on per route basis
  // router.use(deps.hullMiddleware);
  // router.use(AppMiddleware(deps));

  // const middlewareSet = [requireConfiguration];

  router.use(appMiddleware());
  // router.use("/batch", requireConfiguration, actions.batchHandler, responseMiddleware());
  router.use("/batch", notifHandler({
    handlers: {
      "user:update": notifHandlers.batch
    }
  }));

  router.use("/notify", notifHandler({
    userHandlerOptions: {
      maxSize: parseInt(process.env.SNS_SIZE, 10) || 50,
      groupTraits: false
    },
    handlers: {
      "segment:update": notifHandlers.segmentUpdate,
      "segment:delete": notifHandlers.segmentDelete,
      "user:update": notifHandlers.userUpdate,
      "ship:update": notifHandlers.shipUpdate
    }
  }));

  router.use("/smart-notifier", smartNotifierHandler({
    handlers: {
      "segment:update": notifHandlers.segmentUpdate,
      "segment:delete": notifHandlers.segmentDelete,
      "user:update": notifHandlers.userUpdate,
      "ship:update": notifHandlers.shipUpdate
    }
  }));

  router.post("/fetch-all", requireConfiguration, actions.fetchAll, responseMiddleware());
  // FIXME: 404 for that endpoint?
  router.use("/intercom", bodyParser.json(), requireConfiguration, actions.webhook, responseMiddleware());

  router.post("/sync", requireConfiguration, actions.sync, responseMiddleware());

  router.post("/fetch-leads", requireConfiguration, actions.fetchLeads, responseMiddleware());

  router.post("/fetch-segments", requireConfiguration, actions.fetchSegments);

  router.get("/schema/user_fields", cors(), requireConfiguration, actions.fields);

  router.all("/status", actions.statusCheck);

  return router;
}

module.exports = appRouter;
