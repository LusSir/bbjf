const cloudConfig = require("./config/cloud");

App({
  globalData: {
    storeName: "贝贝家纺",
    user: null,
    isAdmin: false
  },
  onLaunch() {
    if (!wx.cloud) {
      console.warn("当前基础库不支持云开发");
      return;
    }

    const initOptions = { traceUser: true };
    if (cloudConfig.envId) {
      initOptions.env = cloudConfig.envId;
    }

    wx.cloud.init(initOptions);
  }
});
