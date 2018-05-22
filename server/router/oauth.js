/* @flow */
const { Strategy: IntercomStrategy } = require("passport-intercom");
const moment = require("moment");
const { oAuthHandler } = require("hull/lib/utils");

function oAuthRouter(dependencies: Object) {
  const { hostSecret, clientID, clientSecret } = dependencies;

  return oAuthHandler({
    hostSecret,
    name: "Intercom",
    Strategy: IntercomStrategy,
    tokenInUrl: false,
    options: {
      clientID,
      clientSecret,
      requireVerifiedEmail: false
    },
    isSetup(req) {
      if (req.query.reset) return Promise.reject();
      const { ship, client } = req.hull;
      const { access_token, api_key, app_id } = ship.private_settings || {};

      if (access_token || (api_key && app_id)) {
        // TODO: we have noticed problems with syncing hull segments property
        // after a Intercom resync, there may be a problem with notification
        // subscription. Following two lines fixes that problem.
        // req.service.intercomAgent.syncContactProperties()
        //   .catch((err) => hull.logger.error("Error in creating segments property", err));

        return client.get(ship.id).then(s => {
          return req.hull.service.intercomAgent
            .getUsersTotalCount()
            .then(total_count => {
              return { settings: s.private_settings, total_count };
            });
        });
      }
      return Promise.reject();
    },
    onLogin: () => {
      return Promise.resolve();
    },
    onAuthorize: req => {
      const { helpers } = req.hull;
      const { accessToken } = req.account || {};
      const newShip = {
        access_token: accessToken,
        token_fetched_at: moment()
          .utc()
          .format("x")
      };
      return helpers.updateSettings(newShip);
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    }
  });
}

module.exports = oAuthRouter;
