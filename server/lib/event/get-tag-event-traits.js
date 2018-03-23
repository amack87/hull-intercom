// @flow
const _ = require("lodash");

function getTagEventTraits(ctx: Object, user: Object, allTags: Array<Object>): Object {
  const tags = user.tags.tags.map((t) => {
    if (!t.name) {
      t = _.find(allTags, { id: t.id });
    }
    if (!t.name) {
      ctx.client.logger.debug("incoming.event.tagNotFound");
      return "";
    }
    return t.name;
  });
  const traits = {};
  traits["intercom/tags"] = _.compact(tags);
  return traits;
}

module.exports = getTagEventTraits;
