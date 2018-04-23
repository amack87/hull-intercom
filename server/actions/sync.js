const { fetchUsers } = require("../jobs");

function sync(req, res, next) {
  fetchUsers(req.hull)
    .then(next, next);
}

module.exports = sync;
