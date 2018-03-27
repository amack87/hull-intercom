// @flow
const Promise = require("bluebird");
const _ = require("lodash");

function getUsersLeadsMatching(ctx: Object, leads: Array<Object>): Promise {
  const filteredLeads = leads.filter(l => !_.isEmpty(l.email));
  return Promise.resolve(filteredLeads);
}

module.exports = getUsersLeadsMatching;
