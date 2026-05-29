function trimText(value) {
  return String(value || "").trim();
}

function splitLines(value) {
  return trimText(value)
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeImage(value) {
  const image = trimText(value);
  if (!image) return "";
  if (image.startsWith("cloud://") || image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }
  return `/assets/products/${image}`;
}

function normalizeProductImages(images) {
  return (Array.isArray(images) ? images : [])
    .map((item) => ({
      name: trimText(item && item.name),
      url: normalizeImage(item && (item.url || item.image))
    }))
    .filter((item) => item.url);
}

function getPrimaryImage(product) {
  const item = product || {};
  if (item.image) return item.image;
  const images = normalizeProductImages(item.images);
  return images[0] ? images[0].url : "";
}

function mergeProductImages(form, uploadedImages) {
  const current = form || {};
  const images = normalizeProductImages(current.images).concat(normalizeProductImages(uploadedImages));
  const image = normalizeImage(current.image) || (images[0] ? images[0].url : "");
  return {
    image,
    images
  };
}

function appendProductImage(form, image) {
  return mergeProductImages(form, [image]);
}

function assertProductId(id) {
  if (!id) {
    throw new Error("请填写商品编号");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
    throw new Error("商品编号只能使用英文、数字和短横线");
  }
}

function normalizeProductInput(input, options) {
  const allowEmptyId = Boolean(options && options.allowEmptyId);
  const id = trimText(input.id);
  const name = trimText(input.name);
  const categoryId = trimText(input.categoryId);

  if (id || !allowEmptyId) {
    assertProductId(id);
  }
  if (!name) {
    throw new Error("请填写商品名称");
  }
  if (!categoryId) {
    throw new Error("请选择商品分类");
  }

  const images = normalizeProductImages(input.images);
  const image = normalizeImage(input.image) || (images[0] ? images[0].url : "");

  return {
    id,
    categoryId,
    name,
    priceText: trimText(input.priceText) || "到店咨询价",
    image,
    images,
    imageTone: trimText(input.imageTone) || "warm",
    tags: splitLines(input.tagsText || input.tags),
    highlights: splitLines(input.highlightsText || input.highlights),
    specs: splitLines(input.specsText || input.specs),
    description: trimText(input.description),
    isFeatured: Boolean(input.isFeatured),
    isSpecial: Boolean(input.isSpecial),
    isNew: Boolean(input.isNew),
    sort: Number(input.sort) || 999,
    status: input.status === "draft" ? "draft" : "active"
  };
}

function productToForm(product) {
  const item = product || {};
  const images = normalizeProductImages(item.images);
  return {
    id: item.id || "",
    categoryId: item.categoryId || "sets",
    name: item.name || "",
    priceText: item.priceText || "",
    image: item.image || (images[0] ? images[0].url : ""),
    images,
    imageTone: item.imageTone || "warm",
    tagsText: (item.tags || []).join("\n"),
    highlightsText: (item.highlights || []).join("\n"),
    specsText: (item.specs || []).join("\n"),
    description: item.description || "",
    isFeatured: Boolean(item.isFeatured),
    isSpecial: Boolean(item.isSpecial),
    isNew: Boolean(item.isNew),
    sort: item.sort || 999,
    status: item.status || "active"
  };
}

function getCategoryName(categories, categoryId) {
  const category = (categories || []).find((item) => item.id === categoryId);
  return category ? category.name : "未选择";
}

function buildNextProductId(products) {
  const max = (products || []).reduce((currentMax, item) => {
    const match = String(item.id || "").match(/^P(\d+)$/i);
    if (!match) return currentMax;
    return Math.max(currentMax, Number(match[1]) || 0);
  }, 0);
  return `P${String(max + 1).padStart(4, "0")}`;
}

module.exports = {
  appendProductImage,
  buildNextProductId,
  getCategoryName,
  getPrimaryImage,
  mergeProductImages,
  normalizeProductImages,
  normalizeProductInput,
  productToForm,
  splitLines
};
