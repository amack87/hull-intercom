const _ = require("lodash");

function fields(req, res) {
  const fieldsMap = _.filter(
    req.hull.service.syncAgent.userMapping.map,
    f => !f.read_only
  ).map(f => f.name);
  const customAttributes = req.hull.ship.private_settings.custom_attributes;
  const fieldsList = _.uniq(_.concat(fieldsMap, customAttributes));
  res.json({
    options: fieldsList.map(f => {
      return { label: f, value: f };
    })
  });
}

module.exports = fields;
