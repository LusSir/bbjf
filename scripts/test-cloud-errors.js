const assert = require("assert");
const productsFunction = require("../cloudfunctions/products/index");

assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("Table exist.")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("DATABASE_COLLECTION_ALREADY_EXIST")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("ResourceUnavailable.ResourceExist")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("other error")), false);
assert.strictEqual(productsFunction.formatProductId(1), "P0001");
assert.strictEqual(productsFunction.formatProductId(42), "P0042");
assert.strictEqual(productsFunction.getMaxProductSequence([{ id: "P0003" }, { id: "abc" }, { id: "P0012" }]), 12);

console.log("cloud error tests passed");
