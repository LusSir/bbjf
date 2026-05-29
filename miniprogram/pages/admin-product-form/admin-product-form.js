const auth = require("../../utils/auth");
const productModel = require("../../utils/product-model");
const productsService = require("../../utils/products-service");
const settingsService = require("../../utils/settings-service");

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    saving: false,
    uploading: false,
    editingId: "",
    categories: [],
    selectedCategoryName: "",
    form: productModel.productToForm({ categoryId: "", sort: 10 })
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
        this.setData({ checking: false, allowed: true, loading: true });
        this.loadCategories().then(() => {
          if (this.data.editingId) {
            this.loadProduct(this.data.editingId);
            return;
          }
          this.setData({ loading: false });
        });
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadCategories() {
    return settingsService.listCategories().then((categories) => {
      const defaultCategoryId = categories[0] ? categories[0].id : "";
      const currentCategoryId = this.data.form.categoryId || defaultCategoryId;
      this.setData({
        categories,
        "form.categoryId": currentCategoryId,
        selectedCategoryName: productModel.getCategoryName(categories, currentCategoryId)
      });
    });
  },
  loadProduct(id) {
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
    if (this.data.uploading) {
      wx.showToast({ title: "图片上传中", icon: "none" });
      return;
    }
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
    const uploadBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.uploadImageQueue(paths, 0, [], uploadBatchId);
  },
  uploadImageQueue(tempPaths, index, uploadedImages, uploadBatchId) {
    if (index >= tempPaths.length) {
      const nextImages = productModel.mergeProductImages(this.data.form, uploadedImages);
      this.setData({
        "form.images": nextImages.images,
        "form.image": nextImages.image,
        uploading: false
      });
      if (!uploadedImages.length) return;
      wx.showToast({ title: "图片已上传", icon: "success" });
      return;
    }

    const tempPath = tempPaths[index];
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const productId = this.data.form.id || "new-product";
    const cloudPath = `products/${productId}-${uploadBatchId}-${index}.${ext}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        uploadedImages.push({
          name: "",
          url: res.fileID
        });
        this.uploadImageQueue(tempPaths, index + 1, uploadedImages, uploadBatchId);
      },
      fail: () => {
        wx.showToast({ title: "图片上传失败", icon: "none" });
        this.uploadImageQueue(tempPaths, index + 1, uploadedImages, uploadBatchId);
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
