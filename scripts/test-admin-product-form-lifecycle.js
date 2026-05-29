const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("miniprogram/pages/admin-product-form/admin-product-form.js", "utf8");

assert.match(source, /onLoad\(options\)\s*{[\s\S]*this\.checkAdmin\(\)/, "product form should initialize from onLoad");
assert.doesNotMatch(source, /onShow\(\)\s*{[\s\S]*this\.checkAdmin\(\)[\s\S]*?}/, "product form must not reload from onShow");

console.log("admin product form lifecycle tests passed");
