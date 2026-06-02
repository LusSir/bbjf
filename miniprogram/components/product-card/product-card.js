const cloudImage = require("../../utils/cloud-image");

Component({
  properties: {
    product: {
      type: Object,
      value: {},
      observer(product) {
        const skus = product && product.skus ? product.skus : [];
        const displaySku = skus.find((item) => item.status === "active") || skus[0] || null;
        const image = product && product.image ? product.image : "";
        this.setData({
          displaySku,
          displayImage: cloudImage.isRenderableImageUrl(image) ? image : ""
        });
        this.resolveDisplayImage(image);
      }
    }
  },
  data: {
    displaySku: null,
    displayImage: ""
  },
  methods: {
    resolveDisplayImage(image) {
      if (!image) return;
      cloudImage.resolveCloudFileUrl(image).then((url) => {
        if (this.data.product && this.data.product.image === image && cloudImage.isRenderableImageUrl(url)) {
          this.setData({ displayImage: url });
        }
      });
    },
    handleTap() {
      const id = this.data.product && this.data.product.id;
      if (!id) return;

      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${id}`
      });
    }
  }
});
