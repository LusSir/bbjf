const store = require("../../config/store");
const productsService = require("../../utils/products-service");

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

      wx.setNavigationBarTitle({ title: product.name });
      this.setData({ product });
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
