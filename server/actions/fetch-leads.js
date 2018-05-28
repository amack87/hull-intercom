/* @flow */
import type { $Response, NextFunction } from "express";

import type { HullRequest } from "hull";

function fetchLeadsAction(
  req: HullRequest,
  res: $Response,
  next: NextFunction
) {
  if (req.query && req.query.fetch_all) {
    return req.hull.enqueue("fetchAllLeads").then(next, next);
  }
  return req.hull
    .enqueue("fetchLeads", {
      updated_after: req.query && req.query.updated_after,
      updated_before: req.query && req.query.updated_before
    })
    .then(next, next);
}

module.exports = fetchLeadsAction;
