const assert = require("assert");

let requestedFileList = null;
global.wx = {
  cloud: {
    getTempFileURL(options) {
      requestedFileList = options.fileList;
      return Promise.resolve({ fileList: [] });
    }
  }
};

const productsService = require("../miniprogram/utils/products-service");

async function run() {
  const product = await productsService.resolveProductImages({
    id: "P0001",
    name: "Test product",
    image: "cloud://env/raw-main.jpg",
    displayImage: "https://tmp.example/main.jpg",
    images: [
      {
        name: "Color A",
        url: "cloud://env/raw-a.jpg",
        displayUrl: "https://tmp.example/a.jpg"
      }
    ],
    skus: [
      {
        id: "sku-1",
        colorName: "Color A",
        image: "cloud://env/raw-sku.jpg",
        displayImage: "https://tmp.example/sku.jpg",
        status: "active"
      }
    ]
  });

  assert.strictEqual(requestedFileList, null);
  assert.strictEqual(product.displayImage, "https://tmp.example/main.jpg");
  assert.strictEqual(product.images[0].displayUrl, "https://tmp.example/a.jpg");
  assert.strictEqual(product.skus[0].displayImage, "https://tmp.example/sku.jpg");

  console.log("products service tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
