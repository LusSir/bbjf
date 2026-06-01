const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const ORDERS_COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";

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
    status: "pending_contact"
  };
}

function isNotFoundError(error) {
  const message = error && error.message ? error.message : String(error || "");
  return message.includes("collection not exists")
    || message.includes("COLLECTION_NOT_EXIST")
    || message.includes("document not exists")
    || message.includes("DOCUMENT_NOT_EXIST")
    || message.includes("Db or Table not exist");
}

function isCollectionAlreadyExistsError(error) {
  const message = error && error.message ? error.message : String(error || "");
  return message.includes("already exists")
    || message.includes("collection exists")
    || message.includes("Table exist")
    || message.includes("ResourceExist")
    || message.includes("DATABASE_COLLECTION_ALREADY_EXIST");
}

async function ensureCollection(name) {
  if (!db.createCollection) return;
  try {
    await db.createCollection(name);
  } catch (error) {
    if (!isCollectionAlreadyExistsError(error)) throw error;
  }
}

async function assertAdmin(openid) {
  const result = await db.collection("users").where({ _openid: openid, role: "admin" }).limit(1).get();
  if (!result.data.length) {
    throw new Error("仅管理员可操作");
  }
}

async function getProduct(productId) {
  const result = await db.collection(PRODUCTS_COLLECTION).where({ id: productId }).limit(1).get();
  return result.data[0] || null;
}

function getDefaultSku(product) {
  const skus = Array.isArray(product.skus) ? product.skus : [];
  if (skus.length) return skus.find((item) => item.status !== "disabled") || null;
  return {
    id: "default",
    colorName: "默认规格",
    image: product.image,
    size: "",
    priceText: product.priceText,
    stockText: "到店确认",
    status: "active"
  };
}

async function verifyOrderItems(items) {
  const verified = [];

  for (const item of items) {
    const product = await getProduct(item.productId);
    if (!product || product.status === "draft") {
      throw new Error(`商品已下架：${item.productSnapshot.name || item.productId}`);
    }

    const skus = Array.isArray(product.skus) ? product.skus : [];
    const sku = skus.length
      ? skus.find((entry) => entry.id === item.skuId)
      : getDefaultSku(product);

    if (!sku || sku.status === "disabled") {
      throw new Error(`规格已停用：${item.productSnapshot.name || product.name}`);
    }

    verified.push(Object.assign({}, item, {
      productSnapshot: {
        id: product.id,
        name: product.name,
        image: product.image || (sku && sku.image) || "",
        priceText: product.priceText || ""
      },
      skuSnapshot: {
        id: sku.id || "default",
        colorName: sku.colorName || "默认规格",
        image: sku.image || product.image || "",
        size: sku.size || "",
        priceText: sku.priceText || product.priceText || "",
        stockText: sku.stockText || "到店确认"
      }
    }));
  }

  return verified;
}

async function createOrder(orderInput, openid) {
  await ensureCollection(ORDERS_COLLECTION);
  const normalized = normalizeOrderInput(orderInput);
  const items = await verifyOrderItems(normalized.items);
  const now = db.serverDate();
  const order = {
    _openid: openid,
    contactName: normalized.contactName,
    contactPhone: normalized.contactPhone,
    note: normalized.note,
    items,
    status: normalized.status,
    adminNote: "",
    createdAt: now,
    updatedAt: now
  };
  const created = await db.collection(ORDERS_COLLECTION).add({ data: order });
  return Object.assign({ _id: created._id }, order);
}

async function listMyOrders(openid) {
  try {
    const result = await db.collection(ORDERS_COLLECTION).where({ _openid: openid }).orderBy("createdAt", "desc").limit(100).get();
    return result.data;
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

async function listAdminOrders(status, openid) {
  await assertAdmin(openid);
  const where = status && status !== "all" ? { status: normalizeOrderStatus(status) } : {};
  try {
    const result = await db.collection(ORDERS_COLLECTION).where(where).orderBy("createdAt", "desc").limit(100).get();
    return result.data;
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

async function getOrder(id, openid) {
  const result = await db.collection(ORDERS_COLLECTION).doc(id).get();
  const order = result.data;
  if (!order) return null;
  if (order._openid === openid) return order;
  await assertAdmin(openid);
  return order;
}

async function updateOrderStatus(id, status, adminNote, openid) {
  await assertAdmin(openid);
  const nextStatus = normalizeOrderStatus(status);
  await db.collection(ORDERS_COLLECTION).doc(id).update({
    data: {
      status: nextStatus,
      adminNote: trimText(adminNote),
      updatedAt: db.serverDate(),
      updatedBy: openid
    }
  });
  return true;
}

async function main(event) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const action = event && event.action;
  const data = event && event.data ? event.data : {};

  if (action === "createOrder") {
    return { order: await createOrder(data.order, openid) };
  }
  if (action === "listMyOrders") {
    return { orders: await listMyOrders(openid) };
  }
  if (action === "listAdminOrders") {
    return { orders: await listAdminOrders(data.status, openid) };
  }
  if (action === "getOrder") {
    return { order: await getOrder(data.id, openid) };
  }
  if (action === "updateOrderStatus") {
    return { ok: await updateOrderStatus(data.id, data.status, data.adminNote, openid) };
  }

  throw new Error("未知订单操作");
}

exports.main = main;
exports.normalizeOrderInput = normalizeOrderInput;
exports.normalizeOrderStatus = normalizeOrderStatus;
