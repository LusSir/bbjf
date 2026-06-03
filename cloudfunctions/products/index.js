const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const PRODUCTS_COLLECTION = "products";
const PRODUCT_COUNTER_DOC_ID = "__product_counter__";

function trimText(value) {
  return String(value || "").trim();
}

function listFrom(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimText(item)).filter(Boolean);
  }
  return trimText(value).split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean);
}

function normalizeImages(images) {
  return (Array.isArray(images) ? images : [])
    .map((item) => ({
      name: trimText(item && item.name),
      url: trimText(item && (item.url || item.image))
    }))
    .filter((item) => item.url);
}

function normalizeSkus(skus, product) {
  const owner = product || {};
  const normalized = (Array.isArray(skus) ? skus : [])
    .map((item, index) => {
      const sku = item || {};
      return {
        id: trimText(sku.id) || `sku-${index + 1}`,
        colorName: trimText(sku.colorName || sku.name) || "默认规格",
        image: trimText(sku.image) || trimText(owner.image),
        size: trimText(sku.size),
        priceText: trimText(sku.priceText) || trimText(owner.priceText) || "到店咨询价",
        stockText: trimText(sku.stockText) || "到店确认",
        status: sku.status === "disabled" ? "disabled" : "active",
        sort: Number(sku.sort) || (index + 1) * 10
      };
    })
    .filter((item) => item.id && item.colorName)
    .sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return a.colorName.localeCompare(b.colorName, "zh-Hans-CN");
    });

  if (normalized.length) return normalized;

  const images = normalizeImages(owner.images);
  const firstImage = images[0] || null;
  return [
    {
      id: "default",
      colorName: firstImage && firstImage.name ? firstImage.name : "默认规格",
      image: firstImage ? firstImage.url : trimText(owner.image),
      size: "",
      priceText: trimText(owner.priceText) || "到店咨询价",
      stockText: "到店确认",
      status: "active",
      sort: 10
    }
  ];
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

  const images = normalizeImages(product.images);
  const image = trimText(product.image) || (images[0] ? images[0].url : "");
  const baseProduct = {
    ...product,
    image,
    images,
    priceText: trimText(product.priceText) || "到店咨询价"
  };

  return {
    id,
    categoryId,
    name,
    priceText: trimText(product.priceText) || "到店咨询价",
    image,
    images,
    skus: normalizeSkus(product.skus, baseProduct),
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

function isCloudFileId(url) {
  return String(url || "").trim().startsWith("cloud://");
}

function isRenderableImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

async function resolveCloudFileUrls(urls) {
  const sourceUrls = Array.isArray(urls) ? urls : [];
  const cloudUrls = Array.from(new Set(sourceUrls.filter(isCloudFileId)));
  if (!cloudUrls.length) return sourceUrls;

  try {
    const result = await cloud.getTempFileURL({
      fileList: cloudUrls
    });
    const urlMap = {};
    const fileList = result && Array.isArray(result.fileList) ? result.fileList : [];
    fileList.forEach((item) => {
      if (item && item.fileID && item.tempFileURL) {
        urlMap[item.fileID] = item.tempFileURL;
      } else if (item && item.fileID) {
        console.warn("[bbjf] products getTempFileURL empty", {
          fileID: item.fileID,
          status: item.status,
          errMsg: item.errMsg
        });
      }
    });
    return sourceUrls.map((url) => urlMap[url] || url);
  } catch (error) {
    console.warn("[bbjf] products getTempFileURL failed", {
      fileList: cloudUrls,
      message: error && error.message ? error.message : String(error || "")
    });
    return sourceUrls;
  }
}

async function attachDisplayImages(product) {
  if (!product) return product;

  const images = normalizeImages(product.images);
  const skus = normalizeSkus(product.skus, product);
  const sourceUrls = [product.image]
    .concat(images.map((image) => image.url))
    .concat(skus.map((sku) => sku.image));
  const resolvedUrls = await resolveCloudFileUrls(sourceUrls);
  const imageCount = images.length;
  const displayImage = isRenderableImageUrl(resolvedUrls[0]) ? resolvedUrls[0] : "";

  return {
    ...product,
    displayImage,
    images: images.map((image, index) => {
      const displayUrl = resolvedUrls[index + 1];
      return {
        ...image,
        displayUrl: isRenderableImageUrl(displayUrl) ? displayUrl : ""
      };
    }),
    skus: skus.map((sku, index) => {
      const displayImageUrl = resolvedUrls[index + 1 + imageCount];
      return {
        ...sku,
        displayImage: isRenderableImageUrl(displayImageUrl) ? displayImageUrl : ""
      };
    })
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

async function listProducts(includeDraft) {
  const where = includeDraft ? {} : { status: _.neq("draft") };
  try {
    const result = await db.collection(PRODUCTS_COLLECTION).where(where).orderBy("sort", "asc").limit(100).get();
    return result.data.filter((item) => item.type !== "counter");
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (message.includes("collection not exists") || message.includes("COLLECTION_NOT_EXIST")) {
      return [];
    }
    throw error;
  }
}

async function listDisplayProducts(includeDraft) {
  const products = await listProducts(includeDraft);
  return Promise.all(products.map(attachDisplayImages));
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

async function getDisplayProduct(id) {
  return attachDisplayImages(await getProduct(id));
}

function formatProductId(sequence) {
  return `P${String(sequence).padStart(4, "0")}`;
}

function getMaxProductSequence(products) {
  return (products || []).reduce((currentMax, item) => {
    const match = String(item.id || "").match(/^P(\d+)$/i);
    if (!match) return currentMax;
    return Math.max(currentMax, Number(match[1]) || 0);
  }, 0);
}

async function getInitialProductSequence() {
  const products = await listProducts(true);
  return getMaxProductSequence(products);
}

async function allocateProductId() {
  if (!db.runTransaction) {
    throw new Error("当前云开发 SDK 不支持事务，请升级 wx-server-sdk 后重试");
  }

  const initialSequence = await getInitialProductSequence();
  const sequence = await db.runTransaction(async (transaction) => {
    const counterRef = transaction.collection(PRODUCTS_COLLECTION).doc(PRODUCT_COUNTER_DOC_ID);
    let currentValue = initialSequence;
    let counterExists = false;

    try {
      const counter = await counterRef.get();
      if (counter && counter.data && typeof counter.data.value === "number") {
        currentValue = Math.max(counter.data.value, initialSequence);
      }
      counterExists = true;
    } catch (error) {
      const message = error && error.message ? error.message : "";
      if (!message.includes("document not exists") && !message.includes("DOCUMENT_NOT_EXIST") && !message.includes("does not exist")) {
        throw error;
      }
    }

    const nextValue = currentValue + 1;
    const data = {
      type: "counter",
      value: nextValue,
      updatedAt: db.serverDate()
    };

    if (!counterExists) {
      data.createdAt = db.serverDate();
    }

    await counterRef.set({ data });
    return nextValue;
  });

  return formatProductId(sequence);
}

async function saveProduct(product, openid) {
  await assertAdmin(openid);
  const normalized = normalizeProduct(product, { allowEmptyId: true });
  if (!normalized.id) {
    normalized.id = await allocateProductId();
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
    return { products: await listDisplayProducts(Boolean(data.includeDraft)) };
  }
  if (action === "get") {
    return { product: await getDisplayProduct(data.id) };
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
exports.formatProductId = formatProductId;
exports.getMaxProductSequence = getMaxProductSequence;
