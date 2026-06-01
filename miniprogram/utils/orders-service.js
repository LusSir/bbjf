const orderModel = require("./order-model");

function callOrders(action, data) {
  if (typeof wx === "undefined" || !wx.cloud) {
    return Promise.reject(new Error("当前环境不支持云开发"));
  }

  return wx.cloud.callFunction({
    name: "orders",
    data: {
      action,
      data: data || {}
    }
  }).then((res) => res && res.result ? res.result : {});
}

function createOrder(order) {
  const normalized = orderModel.normalizeOrderInput(order);
  return callOrders("createOrder", { order: normalized }).then((result) => result.order);
}

function listMyOrders() {
  return callOrders("listMyOrders").then((result) => result.orders || []);
}

function listAdminOrders(status) {
  return callOrders("listAdminOrders", { status: status || "all" }).then((result) => result.orders || []);
}

function getOrder(id) {
  return callOrders("getOrder", { id }).then((result) => result.order || null);
}

function updateOrderStatus(id, status, adminNote) {
  return callOrders("updateOrderStatus", { id, status, adminNote }).then((result) => result.ok);
}

module.exports = {
  createOrder,
  getOrder,
  listAdminOrders,
  listMyOrders,
  updateOrderStatus
};
