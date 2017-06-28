// @flow
import _ from "lodash";

import getLeadIdent from "../lib/lead/get-lead-ident";

/**
 * Gets a list of Intercom's leads and saves them as users to hull
 */
export default function saveLeads(ctx: Object, payload: Object): Promise<String> {
  const { client } = ctx;
  const { leads } = payload;
  return Promise.all(_.map(leads, (lead) => {
    const ident = getLeadIdent(ctx, lead);
    let traits = ctx.service.syncAgent.userMapping.getHullTraits(lead);
    // set all traits as set if null not to overwrite matching user
    traits = _.mapValues(traits, (trait) => {
      if (_.isObject(trait)) {
        return trait;
      }
      return {
        operation: "setIfNull",
        value: trait
      };
    });

    if (lead.avatar && lead.avatar.image_url) {
      traits.picture = {
        operation: "setIfNull",
        value: lead.avatar.image_url
      };
    }

    if (lead.last_seen_ip) {
      traits.last_known_ip = lead.last_seen_ip;
    }

    if (lead.last_request_at) {
      traits.last_seen_at = lead.last_request_at;
    }

    traits["intercom/is_lead"] = true;
    traits["intercom/lead_user_id"] = lead.user_id;

    ctx.client.logger.info("incoming.user.success", { ident, traits });
    return client
      .asUser(ident, { active: true })
      .traits(traits);
  }));
}