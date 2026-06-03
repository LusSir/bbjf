const store = require("../../config/store");
const cartService = require("../../utils/cart-service");
const cloudImage = require("../../utils/cloud-image");
const productsService = require("../../utils/products-service");
const productModel = require("../../utils/product-model");

function sanitizeImageUrl(url) {
  return cloudImage.isRenderableImageUrl(url) ? url : "";
}

function resolveProductImages(product) {
  const item = product || {};
  const images = productModel.normalizeProductImages(item.images);
  const skus = productModel.normalizeProductSkus(item.skus, item);
  const sourceUrls = [item.displayImage || item.image]
    .concat(images.map((image) => image.displayUrl || image.url))
    .concat(skus.map((sku) => sku.displayImage || sku.image));

  return cloudImage.resolveCloudFileUrls(sourceUrls).then((resolvedUrls) => {
    const imageCount = images.length;
    const primaryImage = sanitizeImageUrl(item.displayImage) || sanitizeImageUrl(resolvedUrls[0]);
    const resolvedImages = images.map((image, index) => Object.assign({}, image, {
      displayUrl: sanitizeImageUrl(image.displayUrl) || sanitizeImageUrl(resolvedUrls[index + 1])
    }));
    const resolvedSkus = skus.map((sku, index) => Object.assign({}, sku, {
      displayImage: sanitizeImageUrl(sku.displayImage) || sanitizeImageUrl(resolvedUrls[index + 1 + imageCount])
    }));

    return Object.assign({}, item, {
      displayImage: primaryImage || (resolvedImages[0] ? resolvedImages[0].displayUrl : ""),
      images: resolvedImages,
      skus: resolvedSkus
    });
  });
}

Page({
  data: {
    product: null,
    selectedSkuId: "",
    selectedSku: null,
    quantity: 1
  },
  onLoad(options) {
    productsService.getProductById(options.id).then((product) => {
      if (!product) {
        wx.showToast({ title: "商品不存在", icon: "none" });
        return;
      }

      const normalizedProduct = productModel.normalizeProductForCart(product);
      resolveProductImages(normalizedProduct).then((resolvedProduct) => {
        const selectedSku = productModel.getDefaultSku(resolvedProduct);
        wx.setNavigationBarTitle({ title: resolvedProduct.name });
        this.setData({
          product: resolvedProduct,
          selectedSku,
          selectedSkuId: selectedSku ? selectedSku.id : ""
        });
      });
    });
  },
  previewColorImage(event) {
    const current = event.currentTarget.dataset.url;
    const urls = (this.data.product.images || [])
      .map((item) => item.displayUrl)
      .filter(Boolean);
    if (!current || !urls.length) return;
    wx.previewImage({
      current,
      urls
    });
  },
  selectSku(event) {
    const skuId = event.currentTarget.dataset.id;
    const selectedSku = (this.data.product.skus || []).find((item) => item.id === skuId);
    if (!selectedSku || selectedSku.status === "disabled") return;
    this.setData({
      selectedSku,
      selectedSkuId: skuId
    });
  },
  updateQuantity(event) {
    const quantity = Math.max(1, Math.min(99, Number(event.detail.value) || 1));
    this.setData({ quantity });
  },
  addToCart() {
    if (!this.data.product || !this.data.selectedSku) {
      wx.showToast({ title: "请选择规格", icon: "none" });
      return;
    }
    cartService.addItem(this.data.product, this.data.selectedSku, this.data.quantity);
    wx.showToast({ title: "已加入购物车", icon: "success" });
  },
  openCart() {
    wx.switchTab({ url: "/pages/cart/cart" });
  },
  onShareAppMessage() {
    const product = this.data.product;
    return {
      title: product ? `${product.name} - ${store.name}` : store.shareTitle,
      path: product ? `/pages/product-detail/product-detail?id=${product.id}` : "/pages/home/home"
    };
  }
});
