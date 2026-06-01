Component({
  properties: {
    product: {
      type: Object,
      value: {},
      observer(product) {
        const skus = product && product.skus ? product.skus : [];
        const displaySku = skus.find((item) => item.status === "active") || skus[0] || null;
        this.setData({ displaySku });
      }
    }
  },
  data: {
    displaySku: null
  },
  methods: {
    handleTap() {
      const id = this.data.product && this.data.product.id;
      if (!id) return;

      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${id}`
      });
    }
  }
});
