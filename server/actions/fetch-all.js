const { fetchAllUsers } = require("../jobs");

function fetchAll(req, res, next) {
  fetchAllUsers(req.hull, {
    updated_after: req.query.updated_after,
    updated_before: req.query.updated_before
  }).then(next, next);
}

module.exports = fetchAll;
