function isAdmin(user) {
  return Boolean(user && user.role === "admin");
}

function canEnterAdmin(user) {
  return isAdmin(user);
}

module.exports = {
  isAdmin,
  canEnterAdmin
};
