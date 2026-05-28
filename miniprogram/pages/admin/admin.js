const auth = require("../../utils/auth");
const categories = require("../../data/categories");
const productModel = require("../../utils/product-model");
const productsService = require("../../utils/products-service");

const defaultCategoryId = categories[0] ? categories[0].id : "sets";
const defaultForm = productModel.productToForm({ categoryId: defaultCategoryId, sort: 10 });

Page({
  data: {
    checking: true,
    allowed: false,
    user: null,
    categories: categories.slice().sort((a, b) => a.sort - b.sort),
    products: [],
    form: defaultForm,
    editingId: "",
    nextProductId: "P0001",
    selectedCategoryName: productModel.getCategoryName(categories, defaultCategoryId),
    saving: false,
    uploading: false
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    this.setData({ checking: true });
    auth.requireAdmin()
      .then((user) => {
        this.setData({
          checking: false,
          allowed: true,
          user
        });
        this.loadProducts();
      })
      .catch(() => {
        this.setData({
          checking: false,
          allowed: false,
          user: auth.getCachedUser()
        });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  openLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  loadProducts() {
    productsService.listProducts({ includeDraft: true }).then((products) => {
      this.setData({
        products,
        nextProductId: productModel.buildNextProductId(products)
      });
    });
  },
  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },
  updateSwitch(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },
  changeCategory(event) {
    const index = Number(event.detail.value);
    const category = this.data.categories[index];
    if (!category) return;
    this.setData({
      "form.categoryId": category.id,
      selectedCategoryName: category.name
    });
  },
  editProduct(event) {
    const id = event.currentTarget.dataset.id;
    const product = this.data.products.find((item) => item.id === id);
    if (!product) return;
    this.setData({
      editingId: id,
      form: productModel.productToForm(product),
      selectedCategoryName: productModel.getCategoryName(this.data.categories, product.categoryId)
    });
  },
  resetForm() {
    this.setData({
      editingId: "",
      form: productModel.productToForm({ categoryId: defaultCategoryId, sort: 10 }),
      selectedCategoryName: productModel.getCategoryName(this.data.categories, defaultCategoryId)
    });
  },
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        this.uploadImage(tempPath);
      }
    });
  },
  uploadImage(tempPath) {
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const productId = this.data.form.id || this.data.nextProductId || "new-product";
    const cloudPath = `products/${productId}-${Date.now()}.${ext}`;

    this.setData({ uploading: true });
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        this.setData({
          "form.image": res.fileID
        });
        wx.showToast({ title: "图片已上传", icon: "success" });
      },
      fail: () => {
        wx.showToast({ title: "图片上传失败", icon: "none" });
      },
      complete: () => {
        this.setData({ uploading: false });
      }
    });
  },
  saveProduct() {
    let product;
    try {
      product = productModel.normalizeProductInput(this.data.form, { allowEmptyId: !this.data.editingId });
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    productsService.saveProduct(product)
      .then(() => {
        wx.showToast({ title: "商品已保存", icon: "success" });
        this.resetForm();
        this.loadProducts();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "保存失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ saving: false });
      });
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
          if (this.data.editingId === id) {
            this.resetForm();
          }
        });
      }
    });
  }
});
