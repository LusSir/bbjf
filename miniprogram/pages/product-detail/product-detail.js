const store = require("../../config/store");
const cartService = require("../../utils/cart-service");
const productsService = require("../../utils/products-service");
const productModel = require("../../utils/product-model");

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
      const selectedSku = productModel.getDefaultSku(normalizedProduct);
      const images = productModel.normalizeProductImages(normalizedProduct.images);
      wx.setNavigationBarTitle({ title: normalizedProduct.name });
      this.setData({
        product: Object.assign({}, normalizedProduct, { images }),
        selectedSku,
        selectedSkuId: selectedSku ? selectedSku.id : ""
      });
    });
  },
  previewColorImage(event) {
    const current = event.currentTarget.dataset.url;
    const urls = (this.data.product.images || []).map((item) => item.url);
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
