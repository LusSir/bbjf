const assert = require("assert");

const storage = {};
const app = { globalData: {} };
let loginCalls = 0;

global.getApp = () => app;
global.wx = {
  setStorageSync(key, value) {
    storage[key] = value;
  },
  getStorageSync(key) {
    return storage[key];
  },
  removeStorageSync(key) {
    delete storage[key];
  },
  cloud: {
    callFunction() {
      loginCalls += 1;
      return Promise.resolve({
        result: {
          user: {
            openid: "openid-1",
            role: "user"
          }
        }
      });
    }
  }
};

const auth = require("../miniprogram/utils/auth");

auth.setCurrentUser({ openid: "openid-1", role: "admin" });
assert.strictEqual(storage[auth.USER_STORAGE_KEY].openid, "openid-1");
assert.strictEqual(app.globalData.user.openid, "openid-1");
assert.strictEqual(app.globalData.isAdmin, true);

auth.logout();
assert.strictEqual(storage[auth.USER_STORAGE_KEY], undefined);
assert.strictEqual(app.globalData.user, null);
assert.strictEqual(app.globalData.isAdmin, false);
assert.strictEqual(auth.getCachedUser(), null);
assert.strictEqual(loginCalls, 0);

console.log("auth tests passed");
