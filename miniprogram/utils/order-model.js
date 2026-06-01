const ORDER_STATUS_OPTIONS = [
  { id: "pending_contact", name: "待联系" },
  { id: "confirmed", name: "已确认" },
  { id: "preparing", name: "备货中" },
  { id: "completed", name: "已完成" },
  { id: "closed", name: "已关闭" }
];

function trimText(value) {
  return String(value || "").trim();
}

function isValidPhone(phone) {
  return /^1\d{10}$/.test(trimText(phone));
}

function normalizeOrderStatus(status) {
  return ORDER_STATUS_OPTIONS.some((item) => item.id === status) ? status : "pending_contact";
}

function getOrderStatusName(status) {
  const option = ORDER_STATUS_OPTIONS.find((item) => item.id === status);
  return option ? option.name : "待联系";
}

function normalizeOrderItem(item) {
  const source = item || {};
  const productSnapshot = source.productSnapshot || {};
  const skuSnapshot = source.skuSnapshot || {};
  return {
    productId: trimText(source.productId || productSnapshot.id),
    skuId: trimText(source.skuId || skuSnapshot.id) || "default",
    quantity: Math.max(1, Math.min(99, Math.floor(Number(source.quantity) || 1))),
    productSnapshot: {
      id: trimText(productSnapshot.id || source.productId),
      name: trimText(productSnapshot.name),
      image: trimText(productSnapshot.image),
      priceText: trimText(productSnapshot.priceText)
    },
    skuSnapshot: {
      id: trimText(skuSnapshot.id || source.skuId) || "default",
      colorName: trimText(skuSnapshot.colorName) || "默认规格",
      image: trimText(skuSnapshot.image),
      size: trimText(skuSnapshot.size),
      priceText: trimText(skuSnapshot.priceText),
      stockText: trimText(skuSnapshot.stockText)
    }
  };
}

function normalizeOrderInput(input) {
  const source = input || {};
  const contactName = trimText(source.contactName);
  const contactPhone = trimText(source.contactPhone);
  const items = (Array.isArray(source.items) ? source.items : []).map(normalizeOrderItem)
    .filter((item) => item.productId && item.productSnapshot.name);

  if (!contactName) throw new Error("请填写联系人");
  if (!isValidPhone(contactPhone)) throw new Error("请填写正确的手机号");
  if (!items.length) throw new Error("购物车为空");

  return {
    contactName,
    contactPhone,
    note: trimText(source.note),
    items,
    status: normalizeOrderStatus(source.status)
  };
}

module.exports = {
  ORDER_STATUS_OPTIONS,
  getOrderStatusName,
  isValidPhone,
  normalizeOrderInput,
  normalizeOrderItem,
  normalizeOrderStatus
};
