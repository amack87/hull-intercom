// @flow
function getLeadsIdent(ctx: Object, lead: Object): Object {
  const ident = {};

  ident.anonymous_id = `intercom:${lead.user_id}`;
  if (lead.email) {
    ident.email = lead.email;
  }
  return ident;
}

module.exports = getLeadsIdent;
