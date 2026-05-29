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
      count: 9,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.uploadImages(res.tempFilePaths);
      }
    });
  },
  uploadImages(tempPaths) {
    const paths = tempPaths || [];
    if (!paths.length) return;
    this.setData({ uploading: true });
    this.uploadImageQueue(paths, 0);
  },
  uploadImageQueue(tempPaths, index) {
    if (index >= tempPaths.length) {
      this.setData({ uploading: false });
      wx.showToast({ title: "图片已上传", icon: "success" });
      return;
    }

    const tempPath = tempPaths[index];
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const productId = this.data.form.id || "new-product";
    const cloudPath = `products/${productId}-${Date.now()}-${index}.${ext}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        const nextImages = productModel.appendProductImage(this.data.form, {
          name: "",
          url: res.fileID
        });
        this.setData({
          "form.images": nextImages.images,
          "form.image": nextImages.image
        }, () => {
          this.uploadImageQueue(tempPaths, index + 1);
        });
      },
      fail: () => {
        wx.showToast({ title: "图片上传失败", icon: "none" });
        this.uploadImageQueue(tempPaths, index + 1);
      },
      complete: () => {
      }
    });
  },
  updateImageName(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      [`form.images[${index}].name`]: event.detail.value
    });
  },
  setPrimaryImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const target = this.data.form.images[index];
    if (!target) return;
    this.setData({ "form.image": target.url });
  },
  removeProductImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const images = (this.data.form.images || []).filter((_, itemIndex) => itemIndex !== index);
    const currentImage = this.data.form.image;
    const stillExists = images.some((item) => item.url === currentImage);
    this.setData({
      "form.images": images,
      "form.image": stillExists ? currentImage : (images[0] ? images[0].url : "")
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
