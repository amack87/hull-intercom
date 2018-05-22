// @flow
const _ = require("lodash");
const Promise = require("bluebird");

function postLeads(ctx: Object, leads: Array<Object>): Promise {
  const { client, service } = ctx;
  if (_.isEmpty(leads)) {
    client.logger.debug("postLeads.emptyList");
    return Promise.resolve();
  }

  client.logger.debug("postLeads", leads.length);

  return Promise.map(
    leads,
    lead => {
      return service.intercomClient
        .post("/contacts", lead)
        .then(response => response.body)
        .catch(err => {
          client
            .asUser({ email: lead.email, external_id: lead.user_id })
            .logger.error("outgoing.user.error", err);
          return Promise.resolve(err);
        });
    },
    {
      concurrency: parseInt(process.env.LEADS_API_REQUEST_CONCURRENCY, 10) || 10
    }
  );
}

module.exports = postLeads;
