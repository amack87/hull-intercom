global.Promise = require("bluebird");
const Connector = require("hull").Connector;
const express = require("express");

const server = require("../../../server/server");
const worker = require("../../../server/worker");

module.exports = function bootstrap(port = 8000) {
  const app = express();
  const connector = new Connector({ hostSecret: "1234", port, clientConfig: { protocol: "http", firehoseUrl: "firehose" } });
  connector.setupApp(app);
  server(app, {
    hostSecret: "1234",
    clientID: "123",
    clientSecret: "abc",
    cache: connector.cache,
    queue: connector.queue
  });
  worker(connector);

  connector.startWorker();
  return connector.startApp(app);
};
