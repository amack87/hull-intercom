// @flow
import Promise from "bluebird";
import _ from "lodash";

export default function handleRateLimitError(ctx: Object, jobName: String, payload: Object, err: Error): Promise {
  if (_.get(err, "statusCode") === 429 || _.get(err, "response.statusCode") === 429) {
    ctx.client.logger.error("connector.ratelimit.error");
    return ctx.enqueue(jobName, payload, { delay: process.env.RATE_LIMIT_DELAY || 10000 });
  }
  return Promise.reject(err);
}
