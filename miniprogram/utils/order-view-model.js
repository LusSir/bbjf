const orderModel = require("./order-model");

function buildItemSummary(item) {
  const source = item || {};
  const product = source.productSnapshot || {};
  const sku = source.skuSnapshot || {};
  return [
    product.name,
    sku.colorName,
    sku.size
  ].filter(Boolean).join(" / ") + ` x${source.quantity || 1}`;
}

function buildOrderSummary(order) {
  const source = order || {};
  const items = Array.isArray(source.items) ? source.items : [];
  const previewItems = items.slice(0, 2).map((item) => Object.assign({}, item, {
    summaryText: buildItemSummary(item)
  }));

  return Object.assign({}, source, {
    statusName: orderModel.getOrderStatusName(source.status),
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    previewItems,
    hiddenItemCount: Math.max(0, items.length - previewItems.length)
  });
}

module.exports = {
  buildItemSummary,
  buildOrderSummary
};
