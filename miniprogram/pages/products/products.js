const categories = require("../../data/categories");
const productsService = require("../../utils/products-service");

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
    const sortedCategories = categories.slice().sort((a, b) => a.sort - b.sort);
    const selectedCategoryId = sortedCategories[0] ? sortedCategories[0].id : "";
    this.setData({
      categories: sortedCategories,
      selectedCategoryId
    });
    this.loadProducts();
  },
  onShow() {
    const storedCategoryId = wx.getStorageSync("selectedCategoryId");
    if (storedCategoryId) {
      wx.removeStorageSync("selectedCategoryId");
      this.setData({ selectedCategoryId: storedCategoryId });
    }
    this.loadProducts();
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
    const exists = categories.some((item) => item.id === categoryId);
    if (!exists) return;

    this.setData({
      selectedCategoryId: categoryId,
      visibleProducts: getProductsByCategory(this.data.products, categoryId)
    });
  }
});
