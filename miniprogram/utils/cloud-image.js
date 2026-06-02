function isCloudFileId(url) {
  return String(url || "").trim().startsWith("cloud://");
}

function isRenderableImageUrl(url) {
  const value = String(url || "").trim();
  if (!value || value.includes("<") || value.includes(">")) return false;
  return value.startsWith("/")
    || value.startsWith("http://")
    || value.startsWith("https://");
}

function resolveCloudFileUrls(urls) {
  const sourceUrls = Array.isArray(urls) ? urls : [];
  const cloudUrls = sourceUrls.filter(isCloudFileId);

  if (!cloudUrls.length || typeof wx === "undefined" || !wx.cloud || !wx.cloud.getTempFileURL) {
    return Promise.resolve(sourceUrls);
  }

  return new Promise((resolve) => {
    const finish = (result) => {
      const urlMap = {};
      const fileList = result && Array.isArray(result.fileList) ? result.fileList : [];
      fileList.forEach((item) => {
        if (item && item.fileID && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        }
      });
      resolve(sourceUrls.map((url) => urlMap[url] || url));
    };

    try {
      const task = wx.cloud.getTempFileURL({
        fileList: cloudUrls,
        success: finish,
        fail: () => resolve(sourceUrls)
      });

      if (task && typeof task.then === "function") {
        task.then(finish).catch(() => resolve(sourceUrls));
      }
    } catch (error) {
      resolve(sourceUrls);
    }
  });
}

function resolveCloudFileUrl(url) {
  return resolveCloudFileUrls([url]).then((urls) => urls[0] || url);
}

module.exports = {
  isCloudFileId,
  isRenderableImageUrl,
  resolveCloudFileUrl,
  resolveCloudFileUrls
};
