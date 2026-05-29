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

function mergeImageList(currentImages, nextImages) {
  return normalizeImageList(currentImages).concat(normalizeImageList(nextImages));
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

function normalizeCategoryInput(input) {
  const category = input || {};
  const name = trimText(category.name);
  if (!name) throw new Error("请填写分类名称");

  return {
    id: trimText(category.id),
    name,
    sort: Number(category.sort) || 999,
    description: trimText(category.description),
    status: category.status === "disabled" ? "disabled" : "active"
  };
}

function normalizeCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((item) => {
      try {
        return normalizeCategoryInput(item);
      } catch (error) {
        return null;
      }
    })
    .filter((item) => item && item.id)
    .sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
}

function activeCategories(categories) {
  return normalizeCategories(categories).filter((item) => item.status !== "disabled");
}

module.exports = {
  activeCategories,
  mergeImageList,
  normalizeCategories,
  normalizeCategoryInput,
  normalizeImageList,
  normalizeStore,
  trimText
};
