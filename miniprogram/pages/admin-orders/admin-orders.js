const auth = require("../../utils/auth");
const orderModel = require("../../utils/order-model");
const orderViewModel = require("../../utils/order-view-model");
const ordersService = require("../../utils/orders-service");

const statusOptions = [{ id: "all", name: "全部订单" }].concat(orderModel.ORDER_STATUS_OPTIONS);

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    orders: [],
    statusOptions,
    status: "all",
    statusName: "全部订单"
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    this.setData({ checking: true });
    auth.requireAdmin()
      .then(() => {
        this.setData({ checking: false, allowed: true });
        this.loadOrders();
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadOrders() {
    this.setData({ loading: true });
    ordersService.listAdminOrders(this.data.status)
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
  changeStatusFilter(event) {
    const option = this.data.statusOptions[Number(event.detail.value)];
    if (!option) return;
    this.setData({
      status: option.id,
      statusName: option.name
    });
    this.loadOrders();
  },
  updateOrderStatus(event) {
    const id = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    ordersService.updateOrderStatus(id, status, "")
      .then(() => {
        wx.showToast({ title: "状态已更新", icon: "success" });
        this.loadOrders();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "更新失败", icon: "none" });
      });
  },
  openOrderDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}&mode=admin` });
  }
});
