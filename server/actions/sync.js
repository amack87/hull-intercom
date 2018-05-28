function fetchUsersAction(req, res, next) {
  req.hull.enqueue("fetchUsers").then(next, next);
}

module.exports = fetchUsersAction;
