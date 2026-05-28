const auth = require("../../utils/auth");

Page({
  data: {
    user: null,
    isAdmin: false,
    loading: false
  },
  onShow() {
    const user = auth.getCachedUser();
    this.setUser(user);
  },
  setUser(user) {
    this.setData({
      user,
      isAdmin: Boolean(user && user.role === "admin")
    });
  },
  handleLogin() {
    this.setData({ loading: true });
    auth.login()
      .then((user) => {
        this.setUser(user);
        wx.showToast({ title: "登录成功", icon: "success" });
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || "登录失败",
          icon: "none"
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },
  openAdmin() {
    if (!this.data.isAdmin) {
      wx.showToast({ title: "当前账号不是管理员", icon: "none" });
      return;
    }

    wx.navigateTo({ url: "/pages/admin/admin" });
  }
});
