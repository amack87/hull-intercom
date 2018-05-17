/* @flow */
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "hull";

const Redlock = require("redlock");
const redis = require("redis");
const Promise = require("bluebird");

const IntercomClient = require("../intercom-client");
const SyncAgent = require("../sync-agent");
const IntercomAgent = require("../intercom-agent");

let redlock;
if (false && process.env.REDIS_URL) {
  const client = redis.createClient(process.env.REDIS_URL);
  redlock = new Redlock([client]);
}

function appMiddleware() {
  return function middleware(
    req: HullRequest,
    res: $Response,
    next: NextFunction
  ) {
    req.hull.service = req.hull.service || {};
    const ctx = req.hull;

    if (!req.hull.ship) {
      return next();
    }

    const intercomClient = new IntercomClient(ctx);
    const intercomAgent = new IntercomAgent(intercomClient, ctx);
    const syncAgent = new SyncAgent(
      intercomAgent,
      ctx.client,
      ctx.segments,
      ctx.metric,
      ctx.ship,
      ctx.helpers,
      ctx.hostname,
      ctx.cache
    );

    const lock = {
      get: function getLock(resource, ttl) {
        resource = [req.hull.ship.id, resource].join("-");
        if (redlock) {
          return redlock.lock(resource, ttl);
        }
        return Promise.resolve();
      },
      extend: function extendLock(resource, ttl) {
        resource = [req.hull.ship.id, resource].join("-");
        if (redlock) {
          return redlock.extend(resource, ttl);
        }
        return Promise.resolve();
      }
    };

    req.hull.service = {
      intercomClient,
      intercomAgent,
      syncAgent,
      lock
    };

    return next();
  };
}

module.exports = appMiddleware;
