const cartModel = require("./cart-model");

function readCartItems() {
  if (typeof wx === "undefined") return [];
  return cartModel.normalizeCartItems(wx.getStorageSync(cartModel.CART_STORAGE_KEY) || []);
}

function writeCartItems(items) {
  const nextItems = cartModel.normalizeCartItems(items);
  if (typeof wx !== "undefined") {
    wx.setStorageSync(cartModel.CART_STORAGE_KEY, nextItems);
  }
  return nextItems;
}

function addItem(product, sku, quantity) {
  return writeCartItems(cartModel.addCartItem(readCartItems(), product, sku, quantity));
}

function updateQuantity(key, quantity) {
  return writeCartItems(cartModel.updateCartItemQuantity(readCartItems(), key, quantity));
}

function removeItem(key) {
  return writeCartItems(cartModel.removeCartItem(readCartItems(), key));
}

function clearCart() {
  return writeCartItems([]);
}

module.exports = {
  addItem,
  clearCart,
  readCartItems,
  removeItem,
  updateQuantity,
  writeCartItems
};
