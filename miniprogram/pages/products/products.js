const productsService = require("../../utils/products-service");
const settingsService = require("../../utils/settings-service");

function getProductsByCategory(products, categoryId) {
  return products.filter((item) => item.categoryId === categoryId);
}

Page({
  data: {
    categories: [],
    products: [],
    selectedCategoryId: "",
    visibleProducts: [],
    loading: false
  },
  onLoad() {
    this.loadCategories().then(() => {
      this.loadProducts();
    });
  },
  onShow() {
    this.loadCategories().then(() => {
      const storedCategoryId = wx.getStorageSync("selectedCategoryId");
      if (storedCategoryId) {
        wx.removeStorageSync("selectedCategoryId");
        this.setData({ selectedCategoryId: storedCategoryId });
      }
      this.loadProducts();
    });
  },
  loadCategories() {
    return settingsService.listCategories().then((categories) => {
      const selectedCategoryId = this.data.selectedCategoryId || (categories[0] ? categories[0].id : "");
      this.setData({
        categories,
        selectedCategoryId
      });
    });
  },
  loadProducts() {
    this.setData({ loading: true });
    productsService.listProducts().then((products) => {
      this.setData({
        products,
        visibleProducts: getProductsByCategory(products, this.data.selectedCategoryId),
        loading: false
      });
    });
  },
  selectCategory(event) {
    this.selectCategoryById(event.currentTarget.dataset.id);
  },
  selectCategoryById(categoryId) {
    const exists = this.data.categories.some((item) => item.id === categoryId);
    if (!exists) return;

    this.setData({
      selectedCategoryId: categoryId,
      visibleProducts: getProductsByCategory(this.data.products, categoryId)
    });
  }
});
