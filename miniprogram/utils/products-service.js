const fallbackProducts = require("../data/products");
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
    images: productModel.normalizeProductImages(item.images)
  };
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
      return sortProducts(includeDraft ? products : activeOnly(products));
    })
    .catch(() => includeDraft ? [] : sortProducts(fallbackProducts));
}

function getProductById(id) {
  return callProducts("get", { id })
    .then((result) => {
      const product = result.product || fallbackProducts.find((item) => item.id === id) || null;
      return product ? normalizeProduct(product) : null;
    })
    .catch(() => {
      const product = fallbackProducts.find((item) => item.id === id) || null;
      return product ? normalizeProduct(product) : null;
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
  sortProducts
};
