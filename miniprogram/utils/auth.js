const role = require("./role");

const USER_STORAGE_KEY = "bbjf_user";

function getAppSafe() {
  return typeof getApp === "function" ? getApp() : null;
}

function setCurrentUser(user) {
  const nextUser = user || null;
  const app = getAppSafe();
  if (app) {
    app.globalData.user = nextUser;
    app.globalData.isAdmin = role.isAdmin(nextUser);
  }

  if (typeof wx !== "undefined") {
    if (nextUser) {
      wx.setStorageSync(USER_STORAGE_KEY, nextUser);
    } else {
      wx.removeStorageSync(USER_STORAGE_KEY);
    }
  }
}

function logout() {
  setCurrentUser(null);
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

function normalizeProfile(profile) {
  const data = profile || {};
  return {
    nickName: String(data.nickName || "").trim(),
    avatarUrl: String(data.avatarUrl || "").trim()
  };
}

function login(profile) {
  if (typeof wx === "undefined" || !wx.cloud) {
    return Promise.reject(new Error("当前环境不支持云开发"));
  }

  return wx.cloud.callFunction({
    name: "login",
    data: {
      profile: normalizeProfile(profile)
    }
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
  logout,
  normalizeProfile,
  refreshUser,
  requireAdmin,
  setCurrentUser
};
