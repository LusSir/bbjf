const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const PRODUCTS_COLLECTION = "products";

function trimText(value) {
  return String(value || "").trim();
}

function listFrom(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimText(item)).filter(Boolean);
  }
  return trimText(value).split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean);
}

function normalizeProduct(input, options) {
  const allowEmptyId = Boolean(options && options.allowEmptyId);
  const product = input || {};
  const id = trimText(product.id);
  const name = trimText(product.name);
  const categoryId = trimText(product.categoryId);

  if (!id && !allowEmptyId) throw new Error("请填写商品编号");
  if (id && !/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new Error("商品编号只能使用英文、数字和短横线");
  if (!name) throw new Error("请填写商品名称");
  if (!categoryId) throw new Error("请选择商品分类");

  return {
    id,
    categoryId,
    name,
    priceText: trimText(product.priceText) || "到店咨询价",
    image: trimText(product.image),
    imageTone: trimText(product.imageTone) || "warm",
    tags: listFrom(product.tags),
    highlights: listFrom(product.highlights),
    specs: listFrom(product.specs),
    description: trimText(product.description),
    isFeatured: Boolean(product.isFeatured),
    isSpecial: Boolean(product.isSpecial),
    isNew: Boolean(product.isNew),
    sort: Number(product.sort) || 999,
    status: product.status === "draft" ? "draft" : "active"
  };
}

async function assertAdmin(openid) {
  const result = await db.collection("users").where({ _openid: openid, role: "admin" }).limit(1).get();
  if (!result.data.length) {
    throw new Error("仅管理员可操作");
  }
}

function isCollectionAlreadyExistsError(error) {
  const message = error && error.message ? error.message : String(error || "");
  return message.includes("already exists")
    || message.includes("collection exists")
    || message.includes("Table exist")
    || message.includes("ResourceExist")
    || message.includes("DATABASE_COLLECTION_ALREADY_EXIST");
}

async function ensureProductsCollection() {
  if (!db.createCollection) return;
  try {
    await db.createCollection(PRODUCTS_COLLECTION);
  } catch (error) {
    if (!isCollectionAlreadyExistsError(error)) {
      throw error;
    }
  }
}

async function listProducts(includeDraft) {
  const where = includeDraft ? {} : { status: _.neq("draft") };
  try {
    const result = await db.collection(PRODUCTS_COLLECTION).where(where).orderBy("sort", "asc").limit(100).get();
    return result.data;
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (message.includes("collection not exists") || message.includes("COLLECTION_NOT_EXIST")) {
      return [];
    }
    throw error;
  }
}

async function getProduct(id) {
  try {
    const result = await db.collection(PRODUCTS_COLLECTION).where({ id }).limit(1).get();
    return result.data[0] || null;
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (message.includes("collection not exists") || message.includes("COLLECTION_NOT_EXIST")) {
      return null;
    }
    throw error;
  }
}

async function buildNextProductId() {
  const products = await listProducts(true);
  const max = products.reduce((currentMax, item) => {
    const match = String(item.id || "").match(/^P(\d+)$/i);
    if (!match) return currentMax;
    return Math.max(currentMax, Number(match[1]) || 0);
  }, 0);
  return `P${String(max + 1).padStart(4, "0")}`;
}

async function saveProduct(product, openid) {
  await assertAdmin(openid);
  await ensureProductsCollection();
  const normalized = normalizeProduct(product, { allowEmptyId: true });
  if (!normalized.id) {
    normalized.id = await buildNextProductId();
  }
  const existed = await getProduct(normalized.id);
  const now = db.serverDate();

  if (existed) {
    await db.collection(PRODUCTS_COLLECTION).doc(existed._id).update({
      data: {
        ...normalized,
        updatedAt: now,
        updatedBy: openid
      }
    });
    return {
      ...existed,
      ...normalized
    };
  }

  const created = await db.collection(PRODUCTS_COLLECTION).add({
    data: {
      ...normalized,
      createdAt: now,
      updatedAt: now,
      createdBy: openid,
      updatedBy: openid
    }
  });

  return {
    _id: created._id,
    ...normalized
  };
}

async function deleteProduct(id, openid) {
  await assertAdmin(openid);
  const product = await getProduct(id);
  if (!product) return true;
  await db.collection(PRODUCTS_COLLECTION).doc(product._id).remove();
  return true;
}

async function main(event) {
  const wxContext = cloud.getWXContext();
  const action = event && event.action;
  const data = event && event.data ? event.data : {};

  if (action === "list") {
    return { products: await listProducts(Boolean(data.includeDraft)) };
  }
  if (action === "get") {
    return { product: await getProduct(data.id) };
  }
  if (action === "save") {
    return { product: await saveProduct(data.product, wxContext.OPENID) };
  }
  if (action === "delete") {
    return { ok: await deleteProduct(data.id, wxContext.OPENID) };
  }

  throw new Error("未知商品操作");
}

exports.main = main;
exports.isCollectionAlreadyExistsError = isCollectionAlreadyExistsError;
