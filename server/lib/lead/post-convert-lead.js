// @flow
const Promise = require("bluebird");

function postConvertLead(ctx: Object, user: Object): Promise {
  const { client, service } = ctx;

  client.logger.debug("outgoing.user", user);

  return service.intercomClient
    .post("/contacts/convert", {
      contact: { user_id: user["traits_intercom/lead_user_id"] },
      user: { user_id: user.external_id }
    })
    .then(response => {
      return response.body;
    })
    .catch(err => {
      client.logger.error("postConvertLead.error", err);
      return Promise.resolve(err);
    });
}

module.exports = postConvertLead;
