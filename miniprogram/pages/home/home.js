const store = require("../../config/store");
const categories = require("../../data/categories");
const contact = require("../../utils/contact");
const productsService = require("../../utils/products-service");

Page({
  data: {
    store,
    categories: [],
    featuredProducts: [],
    specialProducts: []
  },
  onLoad() {
    this.setData({
      categories: categories.slice().sort((a, b) => a.sort - b.sort)
    });
    this.loadProducts();
  },
  onShow() {
    this.loadProducts();
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
      title: store.shareTitle,
      path: "/pages/home/home"
    };
  },
  handleWechat() {
    contact.openWechatQrCode();
  },
  handlePhone() {
    contact.callStore();
  },
  handleLocation() {
    contact.openStoreLocation();
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
