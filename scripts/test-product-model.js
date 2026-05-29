const assert = require("assert");
const model = require("../miniprogram/utils/product-model");

const draft = model.normalizeProductInput({
  id: " cotton-set-002 ",
  categoryId: "sets",
  name: " 纯棉四件套 ",
  priceText: "¥299 起",
  image: "cotton-set-002.jpg",
  images: [
    { name: "米白小花", url: "cotton-set-002-a.jpg" },
    { name: "浅粉格纹", url: "/assets/products/cotton-set-002-b.jpg" },
    { name: "", url: "" }
  ],
  tagsText: "热卖\n纯棉",
  highlightsText: "亲肤透气\n多花色可选",
  specsText: "床型：1.5m / 1.8m\n材质：纯棉",
  description: "到店可看实物",
  isFeatured: true,
  isSpecial: false,
  isNew: true,
  sort: "20",
  status: "active"
});

assert.strictEqual(draft.id, "cotton-set-002");
assert.strictEqual(draft.name, "纯棉四件套");
assert.deepStrictEqual(draft.tags, ["热卖", "纯棉"]);
assert.deepStrictEqual(draft.highlights, ["亲肤透气", "多花色可选"]);
assert.deepStrictEqual(draft.specs, ["床型：1.5m / 1.8m", "材质：纯棉"]);
assert.strictEqual(draft.image, "/assets/products/cotton-set-002.jpg");
assert.deepStrictEqual(draft.images, [
  { name: "米白小花", url: "/assets/products/cotton-set-002-a.jpg" },
  { name: "浅粉格纹", url: "/assets/products/cotton-set-002-b.jpg" }
]);
assert.strictEqual(draft.sort, 20);
assert.strictEqual(draft.status, "active");

assert.throws(() => model.normalizeProductInput({ name: "缺少编号" }), /商品编号/);
assert.throws(() => model.normalizeProductInput({ id: "bad id", name: "错误编号" }), /英文/);
assert.strictEqual(model.getCategoryName([{ id: "mats", name: "凉席" }], "mats"), "凉席");
assert.strictEqual(model.getCategoryName([{ id: "mats", name: "凉席" }], "unknown"), "未选择");
assert.strictEqual(model.buildNextProductId([{ id: "P0001" }, { id: "P0009" }]), "P0010");
assert.strictEqual(model.getPrimaryImage({ image: "", images: [{ url: "cloud://a" }] }), "cloud://a");
assert.strictEqual(model.getPrimaryImage({ image: "cloud://main", images: [{ url: "cloud://a" }] }), "cloud://main");
assert.strictEqual(model.productToForm({ images: [{ url: "cloud://first" }] }).image, "cloud://first");
assert.deepStrictEqual(
  model.appendProductImage({ image: "", images: [{ name: "A", url: "cloud://a" }] }, { name: "B", url: "cloud://b" }),
  { image: "cloud://a", images: [{ name: "A", url: "cloud://a" }, { name: "B", url: "cloud://b" }] }
);
assert.deepStrictEqual(
  model.appendProductImage({ image: "cloud://main", images: [{ name: "A", url: "cloud://a" }] }, { name: "B", url: "cloud://b" }),
  { image: "cloud://main", images: [{ name: "A", url: "cloud://a" }, { name: "B", url: "cloud://b" }] }
);

console.log("product model tests passed");
