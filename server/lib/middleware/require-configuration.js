/* @flow */
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "hull";

/**
 * This Middleware makes sure that we have the ship configured to make
 * 3rd API calls
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
function requireConfiguration(
  req: HullRequest,
  res: $Response,
  next: NextFunction
) {
  if (
    !req.hull.service ||
    !req.hull.service.syncAgent ||
    !req.hull.service.syncAgent.isConfigured()
  ) {
    return res.status(403).send("connector is not configured");
  }
  return next();
}

module.exports = requireConfiguration;
