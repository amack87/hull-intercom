/* @flow */
const { Connector } = require("hull");

const appMiddleware = require("./lib/middleware/app-middleware");
const jobs = require("./jobs");

function worker(connector: Connector) {
  return connector.worker(jobs)
    .use(appMiddleware());
}

module.exports = worker;
