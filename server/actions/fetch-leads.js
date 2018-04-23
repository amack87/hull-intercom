/* @flow */
import type { $Response, NextFunction } from "express";

const { fetchAllLeads, fetchLeads } = require("../jobs");

function fetchLeadsAction(req: Object, res: $Response, next: NextFunction) {
  if (req.query.fetch_all) {
    return fetchAllLeads(req.hull).then(next, next);
  }
  return fetchLeads(req.hull, {
    updated_after: req.query.updated_after,
    updated_before: req.query.updated_before
  }).then(next, next);
}

module.exports = fetchLeadsAction;
