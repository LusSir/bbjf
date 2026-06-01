const assert = require("assert");
const cart = require("../miniprogram/utils/cart-model");
const productModel = require("../miniprogram/utils/product-model");

const product = productModel.normalizeProductForCart({
  id: "P0001",
  name: "纯棉四件套",
  image: "cloud://main",
  skus: [
    {
      id: "sku-a",
      colorName: "米白小花",
      image: "cloud://a",
      size: "1.8m",
      priceText: "¥199 起",
      stockText: "到店确认",
      status: "active",
      sort: 2
    }
  ]
});

assert.strictEqual(product.skus[0].id, "sku-a");
assert.strictEqual(product.skus[0].image, "cloud://a");

let items = [];
items = cart.addCartItem(items, product, product.skus[0], 1);
items = cart.addCartItem(items, product, product.skus[0], 2);

assert.strictEqual(items.length, 1);
assert.strictEqual(items[0].quantity, 3);
assert.strictEqual(items[0].productSnapshot.name, "纯棉四件套");
assert.strictEqual(items[0].skuSnapshot.colorName, "米白小花");

items = cart.updateCartItemQuantity(items, items[0].key, 1);
assert.strictEqual(items[0].quantity, 1);

items = cart.updateCartItemQuantity(items, items[0].key, 0);
assert.strictEqual(items.length, 0);

const fallbackProduct = productModel.normalizeProductForCart({
  id: "P0002",
  name: "无规格商品",
  priceText: "到店咨询价",
  image: "cloud://fallback"
});
assert.strictEqual(fallbackProduct.skus.length, 1);
assert.strictEqual(fallbackProduct.skus[0].id, "default");
assert.strictEqual(fallbackProduct.skus[0].priceText, "到店咨询价");

console.log("cart model tests passed");
