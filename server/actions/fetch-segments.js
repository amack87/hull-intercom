/* @flow */
import type { $Response } from "express";

function fetchSegments(req: Object, res: $Response) {
  req.hull.service.syncAgent.fetchSegments().then(
    () => {
      res.end("ok");
    },
    () => {
      res.end("error");
    }
  );
}

module.exports = fetchSegments;
