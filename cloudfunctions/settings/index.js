const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const STORE_COLLECTION = "store_settings";
const CATEGORIES_COLLECTION = "categories";
const STORE_DOC_ID = "main";

function trimText(value) {
  return String(value || "").trim();
}

function numberOrNull(value) {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeImageList(images) {
  return (Array.isArray(images) ? images : [])
    .map((item) => trimText(item))
    .filter(Boolean);
}

function normalizeStore(input) {
  const store = input || {};
  const name = trimText(store.name) || "贝贝家纺";
  return {
    name,
    slogan: trimText(store.slogan) || "实体门店 · 成品床品 · 到店可看实物",
    phone: trimText(store.phone),
    wechatId: trimText(store.wechatId),
    wechatQrCode: trimText(store.wechatQrCode),
    address: trimText(store.address),
    businessHours: trimText(store.businessHours) || "8:00-18:00",
    latitude: numberOrNull(store.latitude),
    longitude: numberOrNull(store.longitude),
    storePhotos: normalizeImageList(store.storePhotos),
    shareTitle: trimText(store.shareTitle) || `${name}成品床品，到店可看实物`
  };
}

function normalizeCategory(input, options) {
  const category = input || {};
  const allowEmptyId = Boolean(options && options.allowEmptyId);
  const id = trimText(category.id);
  const name = trimText(category.name);

  if (!id && !allowEmptyId) throw new Error("分类编号缺失");
  if (!name) throw new Error("请填写分类名称");

  return {
    id,
    name,
    sort: Number(category.sort) || 999,
    description: trimText(category.description),
    status: category.status === "disabled" ? "disabled" : "active"
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

async function getStore() {
  try {
    const result = await db.collection(STORE_COLLECTION).doc(STORE_DOC_ID).get();
    return result.data ? normalizeStore(result.data) : null;
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

async function saveStore(store, openid) {
  await assertAdmin(openid);
  await ensureCollection(STORE_COLLECTION);
  const normalized = normalizeStore(store);
  const data = {
    ...normalized,
    updatedAt: db.serverDate(),
    updatedBy: openid
  };

  try {
    await db.collection(STORE_COLLECTION).doc(STORE_DOC_ID).set({ data });
  } catch (error) {
    throw error;
  }

  return normalized;
}

async function listCategories(includeDisabled) {
  try {
    const result = await db.collection(CATEGORIES_COLLECTION).orderBy("sort", "asc").limit(100).get();
    return result.data
      .map((item) => normalizeCategory(item))
      .filter((item) => includeDisabled || item.status !== "disabled");
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

function createCategoryId() {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function saveCategory(category, openid) {
  await assertAdmin(openid);
  await ensureCollection(CATEGORIES_COLLECTION);
  const normalized = normalizeCategory(category, { allowEmptyId: true });
  if (!normalized.id) normalized.id = createCategoryId();

  const existed = await db.collection(CATEGORIES_COLLECTION).where({ id: normalized.id }).limit(1).get()
    .then((result) => result.data[0] || null)
    .catch((error) => {
      if (isNotFoundError(error)) return null;
      throw error;
    });

  const data = {
    ...normalized,
    updatedAt: db.serverDate(),
    updatedBy: openid
  };

  if (existed) {
    await db.collection(CATEGORIES_COLLECTION).doc(existed._id).update({ data });
  } else {
    await db.collection(CATEGORIES_COLLECTION).add({
      data: {
        ...data,
        createdAt: db.serverDate(),
        createdBy: openid
      }
    });
  }

  return normalized;
}

async function setCategoryStatus(id, status, openid) {
  await assertAdmin(openid);
  await ensureCollection(CATEGORIES_COLLECTION);
  const nextStatus = status === "disabled" ? "disabled" : "active";
  const result = await db.collection(CATEGORIES_COLLECTION).where({ id }).limit(1).get();
  const category = result.data[0];
  if (!category) throw new Error("分类不存在");

  await db.collection(CATEGORIES_COLLECTION).doc(category._id).update({
    data: {
      status: nextStatus,
      updatedAt: db.serverDate(),
      updatedBy: openid
    }
  });

  return true;
}

async function main(event) {
  const wxContext = cloud.getWXContext();
  const action = event && event.action;
  const data = event && event.data ? event.data : {};

  if (action === "getStore") {
    return { store: await getStore() };
  }
  if (action === "saveStore") {
    return { store: await saveStore(data.store, wxContext.OPENID) };
  }
  if (action === "listCategories") {
    return { categories: await listCategories(Boolean(data.includeDisabled)) };
  }
  if (action === "saveCategory") {
    return { category: await saveCategory(data.category, wxContext.OPENID) };
  }
  if (action === "setCategoryStatus") {
    return { ok: await setCategoryStatus(data.id, data.status, wxContext.OPENID) };
  }

  throw new Error("未知配置操作");
}

exports.main = main;
exports.normalizeStore = normalizeStore;
exports.normalizeCategory = normalizeCategory;
exports.createCategoryId = createCategoryId;
exports.isCollectionAlreadyExistsError = isCollectionAlreadyExistsError;
