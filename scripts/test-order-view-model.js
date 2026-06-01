const assert = require("assert");
const orderViewModel = require("../miniprogram/utils/order-view-model");

const order = {
  _id: "order-1",
  status: "confirmed",
  contactName: "张三",
  contactPhone: "13800138000",
  items: [
    {
      quantity: 2,
      productSnapshot: { name: "纯棉四件套" },
      skuSnapshot: { colorName: "米白", size: "1.8m" }
    },
    {
      quantity: 1,
      productSnapshot: { name: "夏凉被" },
      skuSnapshot: { colorName: "蓝色", size: "200x230" }
    },
    {
      quantity: 3,
      productSnapshot: { name: "枕芯" },
      skuSnapshot: { colorName: "默认规格", size: "" }
    }
  ]
};

const summary = orderViewModel.buildOrderSummary(order);
assert.strictEqual(summary.statusName, "已确认");
assert.strictEqual(summary.itemCount, 3);
assert.strictEqual(summary.totalQuantity, 6);
assert.strictEqual(summary.previewItems.length, 2);
assert.strictEqual(summary.hiddenItemCount, 1);
assert.strictEqual(summary.previewItems[0].summaryText, "纯棉四件套 / 米白 / 1.8m x2");

const emptySummary = orderViewModel.buildOrderSummary({ status: "unknown", items: [] });
assert.strictEqual(emptySummary.statusName, "待联系");
assert.strictEqual(emptySummary.itemCount, 0);
assert.strictEqual(emptySummary.totalQuantity, 0);
assert.deepStrictEqual(emptySummary.previewItems, []);

console.log("order view model tests passed");
