const assert = require("assert");

let requestedFileList = [];
global.wx = {
  cloud: {
    getTempFileURL(options) {
      requestedFileList = options.fileList;
      return Promise.resolve({
        fileList: [
          {
            fileID: "cloud://env/a.jpg",
            tempFileURL: "https://tmp.example/a.jpg"
          },
          {
            fileID: "cloud://env/b.jpg",
            tempFileURL: "https://tmp.example/b.jpg"
          }
        ]
      });
    }
  }
};

const cloudImage = require("../miniprogram/utils/cloud-image");

async function run() {
  const urls = await cloudImage.resolveCloudFileUrls([
    "/assets/a.jpg",
    "cloud://env/a.jpg",
    "",
    "https://example.com/c.jpg",
    "cloud://env/b.jpg"
  ]);

  assert.deepStrictEqual(requestedFileList, ["cloud://env/a.jpg", "cloud://env/b.jpg"]);
  assert.deepStrictEqual(urls, [
    "/assets/a.jpg",
    "https://tmp.example/a.jpg",
    "",
    "https://example.com/c.jpg",
    "https://tmp.example/b.jpg"
  ]);

  assert.strictEqual(cloudImage.isCloudFileId("cloud://env/a.jpg"), true);
  assert.strictEqual(cloudImage.isCloudFileId("/assets/a.jpg"), false);
  assert.strictEqual(cloudImage.isRenderableImageUrl("cloud://env/a.jpg"), false);
  assert.strictEqual(cloudImage.isRenderableImageUrl("<URL>"), false);
  assert.strictEqual(cloudImage.isRenderableImageUrl("/assets/a.jpg"), true);
  assert.strictEqual(cloudImage.isRenderableImageUrl("https://example.com/a.jpg"), true);
  assert.strictEqual(cloudImage.isRenderableImageUrl("wxfile://tmp/a.jpg"), true);

  global.wx.cloud.getTempFileURL = (options) => {
    requestedFileList = options.fileList;
    options.success({
      fileList: [
        {
          fileID: "cloud://env/c.jpg",
          tempFileURL: "https://tmp.example/c.jpg"
        }
      ]
    });
  };

  const callbackUrls = await cloudImage.resolveCloudFileUrls(["cloud://env/c.jpg"]);
  assert.deepStrictEqual(requestedFileList, ["cloud://env/c.jpg"]);
  assert.deepStrictEqual(callbackUrls, ["https://tmp.example/c.jpg"]);

  global.wx.cloud.getTempFileURL = (options) => {
    requestedFileList = options.fileList;
    options.fail();
  };
  global.wx.cloud.downloadFile = (options) => {
    options.success({
      tempFilePath: `wxfile://tmp/${options.fileID.split("/").pop()}`
    });
  };

  const fallbackUrls = await cloudImage.resolveCloudFileUrls([
    "cloud://env/d.jpg",
    "/assets/e.jpg"
  ]);
  assert.deepStrictEqual(requestedFileList, ["cloud://env/d.jpg"]);
  assert.deepStrictEqual(fallbackUrls, [
    "wxfile://tmp/d.jpg",
    "/assets/e.jpg"
  ]);

  console.log("cloud image tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
