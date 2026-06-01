const productsService = require("../../utils/products-service");
const settingsService = require("../../utils/settings-service");

function getProductsByCategory(products, categoryId, keyword) {
  const searchText = String(keyword || "").trim().toLowerCase();
  return products.filter((item) => {
    const categoryMatched = item.categoryId === categoryId;
    if (!categoryMatched) return false;
    if (!searchText) return true;

    const haystack = [
      item.name,
      item.priceText,
      (item.tags || []).join(" "),
      (item.highlights || []).join(" "),
      (item.skus || []).map((sku) => `${sku.colorName} ${sku.size} ${sku.stockText}`).join(" ")
    ].join(" ").toLowerCase();

    return haystack.indexOf(searchText) >= 0;
  });
}

Page({
  data: {
    categories: [],
    products: [],
    selectedCategoryId: "",
    visibleProducts: [],
    searchKeyword: "",
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
        visibleProducts: getProductsByCategory(products, this.data.selectedCategoryId, this.data.searchKeyword),
        loading: false
      });
    });
  },
  updateSearch(event) {
    const searchKeyword = event.detail.value;
    this.setData({
      searchKeyword,
      visibleProducts: getProductsByCategory(this.data.products, this.data.selectedCategoryId, searchKeyword)
    });
  },
  clearSearch() {
    this.setData({
      searchKeyword: "",
      visibleProducts: getProductsByCategory(this.data.products, this.data.selectedCategoryId, "")
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
      visibleProducts: getProductsByCategory(this.data.products, categoryId, this.data.searchKeyword)
    });
  }
});
