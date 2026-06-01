const auth = require("../../utils/auth");
const orderModel = require("../../utils/order-model");
const orderViewModel = require("../../utils/order-view-model");
const ordersService = require("../../utils/orders-service");

Page({
  data: {
    id: "",
    mode: "user",
    loading: false,
    updating: false,
    order: null,
    statusOptions: orderModel.ORDER_STATUS_OPTIONS,
    isAdminMode: false
  },
  onLoad(options) {
    this.setData({
      id: options.id || "",
      mode: options.mode === "admin" ? "admin" : "user",
      isAdminMode: options.mode === "admin"
    });
  },
  onShow() {
    this.loadOrder();
  },
  loadOrder() {
    if (!this.data.id) {
      wx.showToast({ title: "订单不存在", icon: "none" });
      return;
    }

    this.setData({ loading: true });
    const authTask = this.data.isAdminMode ? auth.requireAdmin() : auth.login();
    authTask
      .then(() => ordersService.getOrder(this.data.id))
      .then((order) => {
        if (!order) {
          wx.showToast({ title: "订单不存在", icon: "none" });
          return;
        }
        this.setData({ order: orderViewModel.buildOrderSummary(order) });
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "订单加载失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },
  updateStatus(event) {
    const status = event.currentTarget.dataset.status;
    if (!this.data.order || !status) return;
    this.setData({ updating: true });
    ordersService.updateOrderStatus(this.data.order._id, status, this.data.order.adminNote || "")
      .then(() => {
        wx.showToast({ title: "状态已更新", icon: "success" });
        this.loadOrder();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "更新失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ updating: false });
      });
  }
});
