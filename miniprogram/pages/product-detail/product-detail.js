const store = require("../../config/store");
const productsService = require("../../utils/products-service");
const productModel = require("../../utils/product-model");

Page({
  data: {
    product: null
  },
  onLoad(options) {
    productsService.getProductById(options.id).then((product) => {
      if (!product) {
        wx.showToast({ title: "商品不存在", icon: "none" });
        return;
      }

      const images = productModel.normalizeProductImages(product.images);
      wx.setNavigationBarTitle({ title: product.name });
      this.setData({
        product: {
          ...product,
          image: productModel.getPrimaryImage(product),
          images
        }
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
  onShareAppMessage() {
    const product = this.data.product;
    return {
      title: product ? `${product.name} - ${store.name}` : store.shareTitle,
      path: product ? `/pages/product-detail/product-detail?id=${product.id}` : "/pages/home/home"
    };
  }
});
