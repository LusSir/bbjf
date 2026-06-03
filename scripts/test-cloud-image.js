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

  assert.deepStrictEqual(requestedFileList, [
    { fileID: "cloud://env/a.jpg", maxAge: 3600 },
    { fileID: "cloud://env/b.jpg", maxAge: 3600 }
  ]);
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
  assert.deepStrictEqual(requestedFileList, [{ fileID: "cloud://env/c.jpg", maxAge: 3600 }]);
  assert.deepStrictEqual(callbackUrls, ["https://tmp.example/c.jpg"]);

  global.wx.cloud.getTempFileURL = (options) => {
    requestedFileList = options.fileList;
    options.fail();
  };
  const failedUrls = await cloudImage.resolveCloudFileUrls([
    "cloud://env/d.jpg",
    "/assets/e.jpg"
  ]);
  assert.deepStrictEqual(requestedFileList, [{ fileID: "cloud://env/d.jpg", maxAge: 3600 }]);
  assert.deepStrictEqual(failedUrls, [
    "cloud://env/d.jpg",
    "/assets/e.jpg"
  ]);

  global.wx.cloud.getTempFileURL = (options) => {
    requestedFileList = options.fileList;
    return Promise.resolve({
      fileList: [
        {
          fileID: "cloud://env/f.jpg",
          status: -1,
          errMsg: "empty download url"
        }
      ]
    });
  };
  const emptyUrls = await cloudImage.resolveCloudFileUrls(["cloud://env/f.jpg"]);
  assert.deepStrictEqual(requestedFileList, [{ fileID: "cloud://env/f.jpg", maxAge: 3600 }]);
  assert.deepStrictEqual(emptyUrls, ["cloud://env/f.jpg"]);

  console.log("cloud image tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
