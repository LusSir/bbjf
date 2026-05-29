const auth = require("../../utils/auth");

Page({
  data: {
    checking: true,
    allowed: false,
    user: null
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    this.setData({ checking: true });
    auth.requireAdmin()
      .then((user) => {
        this.setData({
          checking: false,
          allowed: true,
          user
        });
      })
      .catch(() => {
        this.setData({
          checking: false,
          allowed: false,
          user: auth.getCachedUser()
        });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  openLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  openCreateProduct() {
    wx.navigateTo({ url: "/pages/admin-product-form/admin-product-form" });
  },
  openProductManager() {
    wx.navigateTo({ url: "/pages/admin-products/admin-products" });
  }
});
