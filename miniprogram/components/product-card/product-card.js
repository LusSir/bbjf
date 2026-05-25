Component({
  properties: {
    product: {
      type: Object,
      value: {}
    }
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
