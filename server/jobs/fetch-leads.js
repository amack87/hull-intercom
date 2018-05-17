// @flow
const moment = require("moment");
const Promise = require("bluebird");
const { RateLimitError, ConfigurationError } = require("hull/lib/errors");

const saveLeads = require("./save-leads");
const getRecentLeads = require("../lib/lead/get-recent-leads");

function fetchLeads(ctx: Object, payload: Object) {
  const { ship, helpers } = ctx;
  const { updated_before, page = 1, count = 50 } = payload;

  let { updated_after } = payload;

  // by default that operation works for interval based pooling
  if (!updated_after && !updated_before) {
    updated_after =
      ship.private_settings.leads_last_fetched_at ||
      moment()
        .subtract(process.env.LEADS_FETCH_DEFAULT_HOURS || 24, "hours")
        .format();
  }

  if (page === 1) {
    ctx.client.logger.info("incoming.job.start", {
      jobName: "fetch",
      type: "user",
      updated_after,
      updated_before
    });
  }

  return getRecentLeads(ctx, {
    page,
    count,
    updated_after,
    updated_before
  })
    .then(({ leads, hasMore }) => {
      ctx.client.logger.info("incoming.job.progress", {
        jobName: "fetch",
        stepName: "recent-leads",
        progress: (page - 1) * count + leads.length,
        hasMore
      });
      const promises = [];
      if (hasMore) {
        promises.push(
          fetchLeads(ctx, {
            updated_after,
            updated_before,
            page: page + 1,
            count
          })
        );
      }
      if (leads.length > 0) {
        promises.push(saveLeads(ctx, { leads }));
      }

      if (!hasMore || page % 5 === 0) {
        promises.push(
          helpers.updateSettings({
            leads_last_fetched_at: moment().format()
          })
        );
      }
      return Promise.all(promises);
    })
    .catch(RateLimitError, () => Promise.resolve("ok"))
    .catch(ConfigurationError, () => Promise.resolve("ok"))
    .catch(err => {
      // deprecated statusCode, effectively replaced by catch above
      if (err.statusCode === 429) {
        return Promise.resolve("ok");
      }
      return Promise.reject(err);
    });
}

module.exports = fetchLeads;
