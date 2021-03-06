// @flow
const _ = require("lodash");
const moment = require("moment");

function getRecentLeads(ctx: Object, options: Object): Object {
  const { client } = ctx;
  const { intercomClient } = ctx.service;
  const { page, count, updated_after, updated_before } = options;
  return intercomClient
    .get("/contacts", {
      per_page: count,
      page,
      order: "desc",
      sort: "updated_at"
    })
    .then(response => {
      const originalLeads = _.get(response, "body.contacts", []);
      const totalPages = _.get(response, "body.pages.total_pages");
      const leads = originalLeads
        .filter(u => {
          if (!updated_after || !moment(updated_after).isValid()) {
            return true;
          }
          return moment(u.updated_at, "X").isAfter(updated_after);
        })
        .filter(u => {
          if (!updated_before || !moment(updated_before).isValid()) {
            return true;
          }
          return moment(u.updated_at, "X").isBefore(updated_before);
        });

      return {
        hasMore: leads.length === originalLeads.length && page < totalPages,
        leads
      };
    })
    .catch(err => {
      client.logger.error("getRecentLeads.error", err);
      return Promise.reject(err);
    });
}

module.exports = getRecentLeads;
