const assert = require("assert");
const model = require("../miniprogram/utils/settings-model");

const store = model.normalizeStore({
  name: " 贝贝家纺 ",
  slogan: " 成品床品 ",
  phone: " 18585204552 ",
  address: " 遵义 ",
  businessHours: " 8:00-18:00 ",
  latitude: "27.686643",
  longitude: "106.935789",
  wechatQrCode: "cloud://qr",
  storePhotos: [" cloud://one ", "", "cloud://two"],
  shareTitle: ""
});

assert.strictEqual(store.name, "贝贝家纺");
assert.strictEqual(store.phone, "18585204552");
assert.strictEqual(store.latitude, 27.686643);
assert.strictEqual(store.longitude, 106.935789);
assert.deepStrictEqual(store.storePhotos, ["cloud://one", "cloud://two"]);
assert.strictEqual(store.shareTitle, "贝贝家纺成品床品，到店可看实物");

assert.deepStrictEqual(
  model.mergeImageList(["cloud://one"], ["cloud://two", "", "cloud://three"]),
  ["cloud://one", "cloud://two", "cloud://three"]
);

const categories = model.normalizeCategories([
  { id: "b", name: " 被芯 ", sort: "2", description: "冬被", status: "disabled" },
  { id: "a", name: " 床品四件套 ", sort: "1", description: "日常家用", status: "active" },
  { id: "", name: "", sort: "3" }
]);

assert.deepStrictEqual(categories, [
  { id: "a", name: "床品四件套", sort: 1, description: "日常家用", status: "active" },
  { id: "b", name: "被芯", sort: 2, description: "冬被", status: "disabled" }
]);
assert.deepStrictEqual(model.activeCategories(categories), [
  { id: "a", name: "床品四件套", sort: 1, description: "日常家用", status: "active" }
]);
assert.deepStrictEqual(
  model.normalizeCategoryInput({ name: " 枕芯 ", sort: "5", description: "软硬可选" }),
  { id: "", name: "枕芯", sort: 5, description: "软硬可选", status: "active" }
);
assert.throws(() => model.normalizeCategoryInput({ name: "" }), /分类名称/);

console.log("settings model tests passed");
