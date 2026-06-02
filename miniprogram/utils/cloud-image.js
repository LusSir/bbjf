function isCloudFileId(url) {
  return String(url || "").trim().startsWith("cloud://");
}

function resolveCloudFileUrls(urls) {
  const sourceUrls = Array.isArray(urls) ? urls : [];
  const cloudUrls = sourceUrls.filter(isCloudFileId);

  if (!cloudUrls.length || typeof wx === "undefined" || !wx.cloud || !wx.cloud.getTempFileURL) {
    return Promise.resolve(sourceUrls);
  }

  return wx.cloud.getTempFileURL({ fileList: cloudUrls })
    .then((result) => {
      const urlMap = {};
      const fileList = result && Array.isArray(result.fileList) ? result.fileList : [];
      fileList.forEach((item) => {
        if (item && item.fileID && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        }
      });
      return sourceUrls.map((url) => urlMap[url] || url);
    })
    .catch(() => sourceUrls);
}

function resolveCloudFileUrl(url) {
  return resolveCloudFileUrls([url]).then((urls) => urls[0] || url);
}

module.exports = {
  isCloudFileId,
  resolveCloudFileUrl,
  resolveCloudFileUrls
};
