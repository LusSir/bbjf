function isCloudFileId(url) {
  return String(url || "").trim().startsWith("cloud://");
}

function isRenderableImageUrl(url) {
  const value = String(url || "").trim();
  if (!value || value.includes("<") || value.includes(">")) return false;
  return value.startsWith("/")
    || value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("wxfile://");
}

function resolveCloudFileUrls(urls) {
  const sourceUrls = Array.isArray(urls) ? urls : [];
  const cloudUrls = sourceUrls.filter(isCloudFileId);

  if (!cloudUrls.length || typeof wx === "undefined" || !wx.cloud || !wx.cloud.getTempFileURL) {
    return Promise.resolve(sourceUrls);
  }

  return new Promise((resolve) => {
    const finishWithFallback = (resolvedUrls) => {
      const unresolvedCloudUrls = resolvedUrls.filter(isCloudFileId);
      if (!unresolvedCloudUrls.length || !wx.cloud.downloadFile) {
        resolve(resolvedUrls);
        return;
      }

      Promise.all(unresolvedCloudUrls.map((fileID) => new Promise((downloadResolve) => {
        wx.cloud.downloadFile({
          fileID,
          success: (res) => downloadResolve([fileID, res.tempFilePath || ""]),
          fail: () => downloadResolve([fileID, ""])
        });
      }))).then((entries) => {
        const downloadMap = {};
        entries.forEach((entry) => {
          if (entry[1]) downloadMap[entry[0]] = entry[1];
        });
        resolve(resolvedUrls.map((url) => downloadMap[url] || url));
      }).catch(() => resolve(resolvedUrls));
    };

    const finish = (result) => {
      const urlMap = {};
      const fileList = result && Array.isArray(result.fileList) ? result.fileList : [];
      fileList.forEach((item) => {
        if (item && item.fileID && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        }
      });
      finishWithFallback(sourceUrls.map((url) => urlMap[url] || url));
    };

    try {
      const task = wx.cloud.getTempFileURL({
        fileList: cloudUrls,
        success: finish,
        fail: () => finishWithFallback(sourceUrls)
      });

      if (task && typeof task.then === "function") {
        task.then(finish).catch(() => finishWithFallback(sourceUrls));
      }
    } catch (error) {
      finishWithFallback(sourceUrls);
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
