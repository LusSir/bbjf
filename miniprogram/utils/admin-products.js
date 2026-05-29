function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function filterProducts(products, filters) {
  const options = filters || {};
  const keyword = normalizeText(options.keyword);
  const categoryId = options.categoryId || "all";
  const status = options.status || "all";

  return (products || [])
    .filter((item) => {
      if (keyword && !normalizeText(item.name).includes(keyword)) return false;
      if (categoryId !== "all" && item.categoryId !== categoryId) return false;
      if (status !== "all" && (item.status || "active") !== status) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const left = Number(a.sort) || 999;
      const right = Number(b.sort) || 999;
      if (left !== right) return left - right;
      return String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans-CN");
    });
}

module.exports = {
  filterProducts
};
