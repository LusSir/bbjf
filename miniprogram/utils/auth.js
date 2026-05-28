const role = require("./role");

const USER_STORAGE_KEY = "bbjf_user";

function getAppSafe() {
  return typeof getApp === "function" ? getApp() : null;
}

function setCurrentUser(user) {
  const app = getAppSafe();
  if (app) {
    app.globalData.user = user || null;
    app.globalData.isAdmin = role.isAdmin(user);
  }

  if (user && typeof wx !== "undefined") {
    wx.setStorageSync(USER_STORAGE_KEY, user);
  }
}

function getCachedUser() {
  const app = getAppSafe();
  if (app && app.globalData.user) {
    return app.globalData.user;
  }

  if (typeof wx === "undefined") {
    return null;
  }

  const user = wx.getStorageSync(USER_STORAGE_KEY) || null;
  if (user) {
    setCurrentUser(user);
  }
  return user;
}

function login() {
  if (typeof wx === "undefined" || !wx.cloud) {
    return Promise.reject(new Error("当前环境不支持云开发"));
  }

  return wx.cloud.callFunction({
    name: "login"
  }).then((res) => {
    const user = res && res.result && res.result.user;
    if (!user) {
      throw new Error("登录失败，请检查 login 云函数");
    }
    setCurrentUser(user);
    return user;
  });
}

function refreshUser() {
  return login().catch(() => getCachedUser());
}

function requireAdmin() {
  const user = getCachedUser();
  if (role.canEnterAdmin(user)) {
    return Promise.resolve(user);
  }

  return login().then((latestUser) => {
    if (!role.canEnterAdmin(latestUser)) {
      throw new Error("当前账号不是管理员");
    }
    return latestUser;
  });
}

module.exports = {
  USER_STORAGE_KEY,
  getCachedUser,
  login,
  refreshUser,
  requireAdmin,
  setCurrentUser
};
