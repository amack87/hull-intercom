/* @flow */
const express = require("express");
const queueUiRouter = require("hull/lib/infra/queue/ui-router");

const appRouter = require("./router/app");
const oAuthRouter = require("./router/oauth");

function server(app: express, dependencies: Object = {}): express {
  const { hostSecret, queue } = dependencies;

  app.use("/", (err, req, res, next) => {
    if (req.path === "/intercom" && err.message === "App not found") {
      return res.status("410").end("Resource gone");
    }
    return next(err);
  }, appRouter());

  app.use("/auth", oAuthRouter(dependencies));

  if (queue.adapter.app) {
    app.use("/kue", queueUiRouter({ hostSecret, queueAgent: queue }));
  }
  return app;
}

module.exports = server;
