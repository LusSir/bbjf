const auth = require("../../utils/auth");
const cartModel = require("../../utils/cart-model");
const cartService = require("../../utils/cart-service");
const ordersService = require("../../utils/orders-service");

Page({
  data: {
    items: [],
    count: 0,
    contactName: "",
    contactPhone: "",
    note: "",
    submitting: false
  },
  onShow() {
    this.refreshCart();
  },
  refreshCart() {
    const items = cartService.readCartItems();
    this.setData({
      items,
      count: cartModel.getCartCount(items)
    });
  },
  updateQuantity(event) {
    const key = event.currentTarget.dataset.key;
    const quantity = Number(event.detail.value);
    cartService.updateQuantity(key, quantity);
    this.refreshCart();
  },
  increaseQuantity(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.items.find((entry) => entry.key === key);
    if (!item) return;
    cartService.updateQuantity(key, item.quantity + 1);
    this.refreshCart();
  },
  decreaseQuantity(event) {
    const key = event.currentTarget.dataset.key;
    const item = this.data.items.find((entry) => entry.key === key);
    if (!item) return;
    cartService.updateQuantity(key, item.quantity - 1);
    this.refreshCart();
  },
  removeItem(event) {
    cartService.removeItem(event.currentTarget.dataset.key);
    this.refreshCart();
  },
  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },
  openProducts() {
    wx.switchTab({ url: "/pages/products/products" });
  },
  openMyOrders() {
    wx.navigateTo({ url: "/pages/my-orders/my-orders" });
  },
  submitOrder() {
    const items = cartService.readCartItems();
    if (!items.length) {
      wx.showToast({ title: "购物车为空", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    auth.login()
      .then(() => ordersService.createOrder({
        contactName: this.data.contactName,
        contactPhone: this.data.contactPhone,
        note: this.data.note,
        items
      }))
      .then(() => {
        cartService.clearCart();
        this.setData({
          contactName: "",
          contactPhone: "",
          note: ""
        });
        wx.showToast({ title: "订单已提交", icon: "success" });
        this.refreshCart();
        setTimeout(() => wx.navigateTo({ url: "/pages/my-orders/my-orders" }), 500);
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "提交失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  }
});
