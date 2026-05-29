const assert = require("assert");
const adminProducts = require("../miniprogram/utils/admin-products");

const products = [
  { id: "P0001", name: "纯棉四件套", categoryId: "sets", status: "active", sort: 20 },
  { id: "P0002", name: "夏季凉席", categoryId: "mats", status: "draft", sort: 10 },
  { id: "P0003", name: "冬被芯", categoryId: "quilts", status: "active", sort: 30 }
];

assert.deepStrictEqual(
  adminProducts.filterProducts(products, { keyword: "四件", categoryId: "all", status: "all" }).map((item) => item.id),
  ["P0001"]
);

assert.deepStrictEqual(
  adminProducts.filterProducts(products, { keyword: "", categoryId: "mats", status: "all" }).map((item) => item.id),
  ["P0002"]
);

assert.deepStrictEqual(
  adminProducts.filterProducts(products, { keyword: "", categoryId: "all", status: "active" }).map((item) => item.id),
  ["P0001", "P0003"]
);

assert.deepStrictEqual(
  adminProducts.filterProducts(products, { keyword: "", categoryId: "all", status: "draft" }).map((item) => item.id),
  ["P0002"]
);

console.log("admin products tests passed");
