const fallbackStore = require("../config/store");
const fallbackCategories = require("../data/categories");
const settingsModel = require("./settings-model");

function callSettings(action, data) {
  if (typeof wx === "undefined" || !wx.cloud) {
    return Promise.reject(new Error("当前环境不支持云开发"));
  }

  return wx.cloud.callFunction({
    name: "settings",
    data: {
      action,
      data: data || {}
    }
  }).then((res) => res && res.result ? res.result : {});
}

function getStore() {
  return callSettings("getStore")
    .then((result) => settingsModel.normalizeStore(result.store || fallbackStore))
    .catch(() => settingsModel.normalizeStore(fallbackStore));
}

function saveStore(store) {
  return callSettings("saveStore", { store })
    .then((result) => settingsModel.normalizeStore(result.store));
}

function listCategories(options) {
  const includeDisabled = Boolean(options && options.includeDisabled);
  return callSettings("listCategories", { includeDisabled })
    .then((result) => {
      const categories = settingsModel.normalizeCategories(result.categories);
      if (!categories.length) {
        return includeDisabled
          ? settingsModel.normalizeCategories(fallbackCategories)
          : settingsModel.activeCategories(fallbackCategories);
      }
      return includeDisabled ? categories : settingsModel.activeCategories(categories);
    })
    .catch(() => includeDisabled
      ? settingsModel.normalizeCategories(fallbackCategories)
      : settingsModel.activeCategories(fallbackCategories));
}

function saveCategory(category) {
  return callSettings("saveCategory", { category })
    .then((result) => settingsModel.normalizeCategoryInput(result.category));
}

function setCategoryStatus(id, status) {
  return callSettings("setCategoryStatus", { id, status })
    .then((result) => result.ok);
}

module.exports = {
  getStore,
  listCategories,
  saveCategory,
  saveStore,
  setCategoryStatus
};
