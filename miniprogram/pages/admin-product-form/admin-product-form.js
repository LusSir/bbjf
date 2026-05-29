const auth = require("../../utils/auth");
const categories = require("../../data/categories");
const productModel = require("../../utils/product-model");
const productsService = require("../../utils/products-service");

const sortedCategories = categories.slice().sort((a, b) => a.sort - b.sort);
const defaultCategoryId = sortedCategories[0] ? sortedCategories[0].id : "sets";

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    saving: false,
    uploading: false,
    editingId: "",
    categories: sortedCategories,
    selectedCategoryName: productModel.getCategoryName(sortedCategories, defaultCategoryId),
    form: productModel.productToForm({ categoryId: defaultCategoryId, sort: 10 })
  },
  onLoad(options) {
    this.setData({ editingId: options.id || "" });
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    auth.requireAdmin()
      .then(() => {
        this.setData({ checking: false, allowed: true });
        if (this.data.editingId) {
          this.loadProduct(this.data.editingId);
        }
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadProduct(id) {
    this.setData({ loading: true });
    productsService.getProductById(id)
      .then((product) => {
        if (!product) {
          wx.showToast({ title: "商品不存在", icon: "none" });
          return;
        }
        this.setData({
          form: productModel.productToForm(product),
          selectedCategoryName: productModel.getCategoryName(this.data.categories, product.categoryId)
        });
      })
      .finally(() => {
        this.setData({ loading: false });
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
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.uploadImage(res.tempFilePaths[0]);
      }
    });
  },
  uploadImage(tempPath) {
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const productId = this.data.form.id || "new-product";
    const cloudPath = `products/${productId}-${Date.now()}.${ext}`;

    this.setData({ uploading: true });
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        this.setData({ "form.image": res.fileID });
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
        setTimeout(() => wx.navigateBack(), 500);
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "保存失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ saving: false });
      });
  }
});
