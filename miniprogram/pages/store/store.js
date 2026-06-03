const contact = require("../../utils/contact");
const auth = require("../../utils/auth");
const cloudImage = require("../../utils/cloud-image");
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
    const user = auth.getCachedUser();
    this.setData({
      user,
      isAdmin: Boolean(user && user.role === "admin")
    });
  },
  loadStore() {
    settingsService.getStore().then((store) => {
      this.resolveStoreImages(store).then((resolvedStore) => {
        this.setData({ store: resolvedStore });
      });
    });
  },
  resolveStoreImages(store) {
    const currentStore = store || fallbackStore;
    const storePhotos = currentStore.storePhotos || [];
    const displayStorePhotos = currentStore.displayStorePhotos || [];
    const sourceUrls = [currentStore.displayWechatQrCode || currentStore.wechatQrCode]
      .concat(storePhotos.map((photo, index) => displayStorePhotos[index] || photo));
    return cloudImage.resolveCloudFileUrls(sourceUrls)
      .then((urls) => Object.assign({}, currentStore, {
        displayWechatQrCode: cloudImage.isRenderableImageUrl(currentStore.displayWechatQrCode || urls[0])
          ? (currentStore.displayWechatQrCode || urls[0])
          : "",
        displayStorePhotos: urls.slice(1).map((url, index) => {
          const displayUrl = displayStorePhotos[index] || url;
          return cloudImage.isRenderableImageUrl(displayUrl) ? displayUrl : "";
        })
      }));
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
    const urls = (this.data.store.displayStorePhotos || []).filter(Boolean);
    if (!current || !urls.length) return;
    wx.previewImage({
      current,
      urls
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
