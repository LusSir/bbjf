const store = require("../../config/store");
const categories = require("../../data/categories");
const products = require("../../data/products");
const contact = require("../../utils/contact");

Page({
  data: {
    store,
    categories: [],
    featuredProducts: [],
    specialProducts: []
  },
  onLoad() {
    this.setData({
      categories: categories.slice().sort((a, b) => a.sort - b.sort),
      featuredProducts: products.filter((item) => item.isFeatured).slice(0, 4),
      specialProducts: products.filter((item) => item.isSpecial).slice(0, 2)
    });
  },
  onShareAppMessage() {
    return {
      title: store.shareTitle,
      path: "/pages/home/home"
    };
  },
  handleWechat() {
    contact.copyWechat();
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
