const CART_STORAGE_KEY = "bbjf_cart";

function trimText(value) {
  return String(value || "").trim();
}

function createCartItemKey(productId, skuId) {
  return `${trimText(productId)}::${trimText(skuId) || "default"}`;
}

function normalizeQuantity(value) {
  const quantity = Number(value) || 1;
  return Math.max(1, Math.min(99, Math.floor(quantity)));
}

function createProductSnapshot(product) {
  const item = product || {};
  return {
    id: trimText(item.id),
    name: trimText(item.name),
    image: trimText(item.image),
    priceText: trimText(item.priceText)
  };
}

function createSkuSnapshot(sku) {
  const item = sku || {};
  return {
    id: trimText(item.id) || "default",
    colorName: trimText(item.colorName) || "默认规格",
    image: trimText(item.image),
    size: trimText(item.size),
    priceText: trimText(item.priceText),
    stockText: trimText(item.stockText)
  };
}

function normalizeCartItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      key: trimText(item.key) || createCartItemKey(item.productId, item.skuId),
      productId: trimText(item.productId),
      skuId: trimText(item.skuId) || "default",
      quantity: normalizeQuantity(item.quantity),
      productSnapshot: createProductSnapshot(item.productSnapshot),
      skuSnapshot: createSkuSnapshot(item.skuSnapshot)
    }))
    .filter((item) => item.productId && item.skuId);
}

function addCartItem(items, product, sku, quantity) {
  const currentItems = normalizeCartItems(items);
  const productSnapshot = createProductSnapshot(product);
  const skuSnapshot = createSkuSnapshot(sku);
  const key = createCartItemKey(productSnapshot.id, skuSnapshot.id);
  const nextQuantity = normalizeQuantity(quantity);
  const existed = currentItems.find((item) => item.key === key);

  if (existed) {
    return currentItems.map((item) => item.key === key
      ? { ...item, quantity: normalizeQuantity(item.quantity + nextQuantity), productSnapshot, skuSnapshot }
      : item);
  }

  return currentItems.concat({
    key,
    productId: productSnapshot.id,
    skuId: skuSnapshot.id,
    quantity: nextQuantity,
    productSnapshot,
    skuSnapshot
  });
}

function updateCartItemQuantity(items, key, quantity) {
  const rawQuantity = Number(quantity) || 0;
  return normalizeCartItems(items)
    .map((item) => item.key === key ? { ...item, quantity: normalizeQuantity(rawQuantity) } : item)
    .filter((item) => item.key !== key || rawQuantity > 0);
}

function removeCartItem(items, key) {
  return normalizeCartItems(items).filter((item) => item.key !== key);
}

function getCartCount(items) {
  return normalizeCartItems(items).reduce((total, item) => total + item.quantity, 0);
}

module.exports = {
  CART_STORAGE_KEY,
  addCartItem,
  createCartItemKey,
  createProductSnapshot,
  createSkuSnapshot,
  getCartCount,
  normalizeCartItems,
  removeCartItem,
  updateCartItemQuantity
};
