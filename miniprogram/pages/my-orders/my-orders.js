const auth = require("../../utils/auth");
const orderViewModel = require("../../utils/order-view-model");
const ordersService = require("../../utils/orders-service");

Page({
  data: {
    loading: false,
    orders: []
  },
  onShow() {
    this.loadOrders();
  },
  loadOrders() {
    this.setData({ loading: true });
    auth.login()
      .then(() => ordersService.listMyOrders())
      .then((orders) => {
        this.setData({ orders: orders.map(orderViewModel.buildOrderSummary) });
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "订单加载失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },
  openProducts() {
    wx.switchTab({ url: "/pages/products/products" });
  },
  openOrderDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  }
});
