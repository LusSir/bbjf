const store = require("../../config/store");
const contact = require("../../utils/contact");
const auth = require("../../utils/auth");

Page({
  data: {
    store,
    user: null,
    isAdmin: false,
    faqs: [
      "支持到店看实物，花色和尺寸以门店现货为准。",
      "普通商品可微信咨询，特价商品建议尽快到店确认。",
      "第一版小程序不支持线上支付，下单和付款请联系门店。"
    ]
  },
  onShow() {
    auth.refreshUser().then((user) => {
      this.setData({
        user,
        isAdmin: Boolean(user && user.role === "admin")
      });
    });
  },
  onShareAppMessage() {
    return {
      title: store.shareTitle,
      path: "/pages/store/store"
    };
  },
  handleWechat() {
    contact.openWechatQrCode();
  },
  previewWechatQr() {
    contact.openWechatQrCode();
  },
  previewStorePhoto(event) {
    const current = event.currentTarget.dataset.src;
    wx.previewImage({
      current,
      urls: this.data.store.storePhotos
    });
  },
  handlePhone() {
    contact.callStore();
  },
  handleLocation() {
    contact.openStoreLocation();
  },
  handleAccountEntry() {
    if (!this.data.isAdmin) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }

    wx.navigateTo({ url: "/pages/admin/admin" });
  }
});
