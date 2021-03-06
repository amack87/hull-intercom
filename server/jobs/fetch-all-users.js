const Promise = require("bluebird");
const _ = require("lodash");

const saveUsers = require("./save-users");

function fetchAllUsers(ctx, payload = {}) {
  const { scroll_param, updated_after, updated_before } = payload;
  const { intercomAgent } = ctx.service;
  if (_.isEmpty(scroll_param)) {
    ctx.metric.event({
      title: "fetchAllUsers"
    });
  }
  return intercomAgent
    .importUsers(scroll_param, updated_after, updated_before)
    .then(({ users, scroll_param: next_scroll_param }) => {
      if (!next_scroll_param) {
        return Promise.resolve();
      }
      return Promise.all([
        fetchAllUsers(ctx, {
          scroll_param: next_scroll_param,
          updated_after,
          updated_before
        }),
        saveUsers(ctx, { users })
      ]);
    });
}

module.exports = fetchAllUsers;
