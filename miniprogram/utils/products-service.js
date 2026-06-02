const fallbackProducts = require("../data/products");
const cloudImage = require("./cloud-image");
const productModel = require("./product-model");

function sortProducts(products) {
  return products.map(normalizeProduct).sort((a, b) => {
    const left = Number(a.sort) || 999;
    const right = Number(b.sort) || 999;
    if (left !== right) return left - right;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans-CN");
  });
}

function normalizeProduct(item) {
  return {
    ...item,
    image: productModel.getPrimaryImage(item),
    images: productModel.normalizeProductImages(item.images),
    skus: productModel.normalizeProductSkus(item.skus, item)
  };
}

function resolveProductImages(product) {
  const item = product || {};
  const images = item.images || [];
  const skus = item.skus || [];
  const urls = [item.image]
    .concat(images.map((image) => image.url))
    .concat(skus.map((sku) => sku.image));

  return cloudImage.resolveCloudFileUrls(urls).then((resolvedUrls) => {
    const resolvedImage = resolvedUrls[0] || item.image;
    const imageUrls = resolvedUrls.slice(1, 1 + images.length);
    const skuUrls = resolvedUrls.slice(1 + images.length);

    return Object.assign({}, item, {
      image: resolvedImage,
      images: images.map((image, index) => Object.assign({}, image, {
        url: imageUrls[index] || image.url
      })),
      skus: skus.map((sku, index) => Object.assign({}, sku, {
        image: skuUrls[index] || sku.image
      }))
    });
  });
}

function activeOnly(products) {
  return products.filter((item) => item.status !== "draft");
}

function callProducts(action, data) {
  if (typeof wx === "undefined" || !wx.cloud) {
    return Promise.reject(new Error("当前环境不支持云开发"));
  }

  return wx.cloud.callFunction({
    name: "products",
    data: {
      action,
      data: data || {}
    }
  }).then((res) => res && res.result ? res.result : {});
}

function listProducts(options) {
  const includeDraft = Boolean(options && options.includeDraft);
  return callProducts("list", { includeDraft })
    .then((result) => {
      const products = Array.isArray(result.products) ? result.products : [];
      if (!products.length && !includeDraft) {
        return sortProducts(fallbackProducts);
      }
      return Promise.all(sortProducts(includeDraft ? products : activeOnly(products)).map(resolveProductImages));
    })
    .catch(() => Promise.all((includeDraft ? [] : sortProducts(fallbackProducts)).map(resolveProductImages)));
}

function getProductById(id) {
  return callProducts("get", { id })
    .then((result) => {
      const product = result.product || fallbackProducts.find((item) => item.id === id) || null;
      return product ? resolveProductImages(normalizeProduct(product)) : null;
    })
    .catch(() => {
      const product = fallbackProducts.find((item) => item.id === id) || null;
      return product ? resolveProductImages(normalizeProduct(product)) : null;
    });
}

function saveProduct(product) {
  return callProducts("save", { product }).then((result) => result.product);
}

function deleteProduct(id) {
  return callProducts("delete", { id }).then((result) => result.ok);
}

module.exports = {
  deleteProduct,
  getProductById,
  listProducts,
  saveProduct,
  normalizeProduct,
  resolveProductImages,
  sortProducts
};
