const contact = require("../../utils/contact");
const productsService = require("../../utils/products-service");
const settingsService = require("../../utils/settings-service");
const fallbackStore = require("../../config/store");

Page({
  data: {
    store: fallbackStore,
    categories: [],
    featuredProducts: [],
    specialProducts: []
  },
  onLoad() {
    this.loadSettings();
    this.loadProducts();
  },
  onShow() {
    this.loadSettings();
    this.loadProducts();
  },
  loadSettings() {
    Promise.all([
      settingsService.getStore(),
      settingsService.listCategories()
    ]).then(([store, categories]) => {
      this.setData({ store, categories });
    });
  },
  loadProducts() {
    productsService.listProducts().then((products) => {
      this.setData({
        featuredProducts: products.filter((item) => item.isFeatured).slice(0, 4),
        specialProducts: products.filter((item) => item.isSpecial).slice(0, 2)
      });
    });
  },
  onShareAppMessage() {
    return {
      title: this.data.store.shareTitle,
      path: "/pages/home/home"
    };
  },
  handleWechat() {
    contact.openWechatQrCode(this.data.store);
  },
  handlePhone() {
    contact.callStore(this.data.store);
  },
  handleLocation() {
    contact.openStoreLocation(this.data.store);
  },
  openCategory(event) {
    const id = event.currentTarget.dataset.id;
    wx.setStorageSync("selectedCategoryId", id);
    wx.switchTab({
      url: "/pages/products/products"
    });
  },
  openProducts() {
    wx.switchTab({ url: "/pages/products/products" });
  }
});
