const contact = require("../../utils/contact");
const auth = require("../../utils/auth");
const settingsService = require("../../utils/settings-service");
const fallbackStore = require("../../config/store");

Page({
  data: {
    store: fallbackStore,
    user: null,
    isAdmin: false,
    faqs: [
      "支持到店看实物，花色和尺寸以门店现货为准。",
      "普通商品可微信咨询，特价商品建议尽快到店确认。",
      "第一版小程序不支持线上支付，预约订单提交后门店会主动联系。"
    ]
  },
  onShow() {
    this.loadStore();
    auth.refreshUser().then((user) => {
      this.setData({
        user,
        isAdmin: Boolean(user && user.role === "admin")
      });
    });
  },
  loadStore() {
    settingsService.getStore().then((store) => {
      this.setData({ store });
    });
  },
  onShareAppMessage() {
    return {
      title: this.data.store.shareTitle,
      path: "/pages/store/store"
    };
  },
  handleWechat() {
    contact.openWechatQrCode(this.data.store);
  },
  previewWechatQr() {
    contact.openWechatQrCode(this.data.store);
  },
  previewStorePhoto(event) {
    const current = event.currentTarget.dataset.src;
    wx.previewImage({
      current,
      urls: this.data.store.storePhotos
    });
  },
  handlePhone() {
    contact.callStore(this.data.store);
  },
  handleLocation() {
    contact.openStoreLocation(this.data.store);
  },
  handleAccountEntry() {
    if (!this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }

    if (this.data.isAdmin) {
      wx.navigateTo({ url: "/pages/admin/admin" });
      return;
    }

    wx.navigateTo({ url: "/pages/my-orders/my-orders" });
  }
});
