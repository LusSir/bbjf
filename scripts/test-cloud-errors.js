const assert = require("assert");
const productsFunction = require("../cloudfunctions/products/index");

assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("Table exist.")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("DATABASE_COLLECTION_ALREADY_EXIST")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("ResourceUnavailable.ResourceExist")), true);
assert.strictEqual(productsFunction.isCollectionAlreadyExistsError(new Error("other error")), false);

console.log("cloud error tests passed");
