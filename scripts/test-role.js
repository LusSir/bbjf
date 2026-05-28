const assert = require("assert");
const role = require("../miniprogram/utils/role");

assert.strictEqual(role.isAdmin({ role: "admin" }), true);
assert.strictEqual(role.isAdmin({ role: "user" }), false);
assert.strictEqual(role.isAdmin(null), false);
assert.strictEqual(role.canEnterAdmin({ role: "admin" }), true);
assert.strictEqual(role.canEnterAdmin({ role: "user" }), false);

console.log("role tests passed");
