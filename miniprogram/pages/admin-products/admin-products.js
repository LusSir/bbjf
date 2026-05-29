const auth = require("../../utils/auth");
const categories = require("../../data/categories");
const productsService = require("../../utils/products-service");
const adminProducts = require("../../utils/admin-products");
const productModel = require("../../utils/product-model");

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    keyword: "",
    categoryId: "all",
    status: "all",
    categories: [{ id: "all", name: "全部分类" }].concat(categories.slice().sort((a, b) => a.sort - b.sort)),
    statusOptions: [
      { id: "all", name: "全部状态" },
      { id: "active", name: "已上架" },
      { id: "draft", name: "未上架" }
    ],
    categoryName: "全部分类",
    statusName: "全部状态",
    products: [],
    visibleProducts: []
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    auth.requireAdmin()
      .then(() => {
        this.setData({ checking: false, allowed: true });
        this.loadProducts();
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadProducts() {
    this.setData({ loading: true });
    productsService.listProducts({ includeDraft: true })
      .then((products) => {
        this.setData({
          products: products.map((item) => ({
            ...item,
            categoryName: productModel.getCategoryName(this.data.categories, item.categoryId)
          })),
          loading: false
        });
        this.applyFilters();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: "商品加载失败", icon: "none" });
      });
  },
  applyFilters() {
    const visibleProducts = adminProducts.filterProducts(this.data.products, {
      keyword: this.data.keyword,
      categoryId: this.data.categoryId,
      status: this.data.status
    });
    this.setData({ visibleProducts });
  },
  updateKeyword(event) {
    this.setData({ keyword: event.detail.value });
    this.applyFilters();
  },
  changeCategory(event) {
    const index = Number(event.detail.value);
    const category = this.data.categories[index];
    if (!category) return;
    this.setData({
      categoryId: category.id,
      categoryName: category.name
    });
    this.applyFilters();
  },
  changeStatus(event) {
    const index = Number(event.detail.value);
    const status = this.data.statusOptions[index];
    if (!status) return;
    this.setData({
      status: status.id,
      statusName: status.name
    });
    this.applyFilters();
  },
  openCreate() {
    wx.navigateTo({ url: "/pages/admin-product-form/admin-product-form" });
  },
  editProduct(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin-product-form/admin-product-form?id=${id}` });
  },
  deleteProduct(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除商品",
      content: "删除后前台将不再显示该商品。",
      confirmText: "删除",
      confirmColor: "#df765d",
      success: (res) => {
        if (!res.confirm) return;
        productsService.deleteProduct(id).then(() => {
          wx.showToast({ title: "已删除", icon: "success" });
          this.loadProducts();
        });
      }
    });
  }
});
