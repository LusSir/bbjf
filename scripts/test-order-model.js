const assert = require("assert");
const orderModel = require("../miniprogram/utils/order-model");

assert.strictEqual(orderModel.isValidPhone("18585204552"), true);
assert.strictEqual(orderModel.isValidPhone("123"), false);

const order = orderModel.normalizeOrderInput({
  contactName: " 张三 ",
  contactPhone: " 18585204552 ",
  note: " 想确认库存 ",
  items: [
    {
      productId: "P0001",
      skuId: "sku-a",
      quantity: 2,
      productSnapshot: {
        name: "纯棉四件套",
        image: "cloud://main"
      },
      skuSnapshot: {
        colorName: "米白小花",
        size: "1.8m",
        priceText: "¥199 起",
        stockText: "到店确认"
      }
    }
  ]
});

assert.strictEqual(order.contactName, "张三");
assert.strictEqual(order.contactPhone, "18585204552");
assert.strictEqual(order.status, "pending_contact");
assert.strictEqual(order.items[0].quantity, 2);
assert.strictEqual(order.items[0].skuSnapshot.size, "1.8m");

assert.throws(() => orderModel.normalizeOrderInput({ contactName: "张三", contactPhone: "123", items: [{}] }), /手机号/);
assert.throws(() => orderModel.normalizeOrderInput({ contactName: "张三", contactPhone: "18585204552", items: [] }), /购物车/);

assert.strictEqual(orderModel.getOrderStatusName("pending_contact"), "待联系");
assert.strictEqual(orderModel.getOrderStatusName("completed"), "已完成");
assert.strictEqual(orderModel.normalizeOrderStatus("bad"), "pending_contact");
assert.strictEqual(orderModel.normalizeOrderStatus("closed"), "closed");

console.log("order model tests passed");
