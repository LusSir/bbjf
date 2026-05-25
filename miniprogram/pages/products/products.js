const categories = require("../../data/categories");
const products = require("../../data/products");

function getProductsByCategory(categoryId) {
  return products.filter((item) => item.categoryId === categoryId);
}

Page({
  data: {
    categories: [],
    selectedCategoryId: "",
    visibleProducts: []
  },
  onLoad() {
    const sortedCategories = categories.slice().sort((a, b) => a.sort - b.sort);
    const selectedCategoryId = sortedCategories[0] ? sortedCategories[0].id : "";
    this.setData({
      categories: sortedCategories,
      selectedCategoryId,
      visibleProducts: getProductsByCategory(selectedCategoryId)
    });
  },
  onShow() {
    const storedCategoryId = wx.getStorageSync("selectedCategoryId");
    if (!storedCategoryId) return;

    wx.removeStorageSync("selectedCategoryId");
    this.selectCategoryById(storedCategoryId);
  },
  selectCategory(event) {
    this.selectCategoryById(event.currentTarget.dataset.id);
  },
  selectCategoryById(categoryId) {
    const exists = categories.some((item) => item.id === categoryId);
    if (!exists) return;

    this.setData({
      selectedCategoryId: categoryId,
      visibleProducts: getProductsByCategory(categoryId)
    });
  }
});
