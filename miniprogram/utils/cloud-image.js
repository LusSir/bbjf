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

function warnCloudImage(message, detail) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[bbjf] ${message}`, detail || "");
  }
}

function normalizeCloudFileList(fileIDs) {
  return Array.from(new Set(fileIDs)).map((fileID) => ({
    fileID,
    maxAge: 60 * 60
  }));
}

function resolveCloudFileUrls(urls) {
  const sourceUrls = Array.isArray(urls) ? urls : [];
  const cloudUrls = sourceUrls.filter(isCloudFileId);

  if (!cloudUrls.length || typeof wx === "undefined" || !wx.cloud || !wx.cloud.getTempFileURL) {
    return Promise.resolve(sourceUrls);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timerId = null;
    const settle = (resolvedUrls) => {
      if (settled) return;
      settled = true;
      if (timerId) clearTimeout(timerId);
      resolve(resolvedUrls);
    };
    const finishWithFallback = (resolvedUrls) => {
      const unresolvedCloudUrls = resolvedUrls.filter(isCloudFileId);
      if (unresolvedCloudUrls.length) {
        warnCloudImage("cloud image unresolved", unresolvedCloudUrls);
      }
      settle(resolvedUrls);
    };

    const finish = (result) => {
      const urlMap = {};
      const fileList = result && Array.isArray(result.fileList) ? result.fileList : [];
      fileList.forEach((item) => {
        if (item && item.fileID && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        } else if (item && item.fileID) {
          warnCloudImage("getTempFileURL empty item", {
            fileID: item.fileID,
            status: item.status,
            errMsg: item.errMsg
          });
        }
      });
      finishWithFallback(sourceUrls.map((url) => urlMap[url] || url));
    };

    try {
      const fileList = normalizeCloudFileList(cloudUrls);
      const task = wx.cloud.getTempFileURL({
        fileList,
        success: finish,
        fail: (error) => {
          warnCloudImage("getTempFileURL failed", { fileList, error });
          finishWithFallback(sourceUrls);
        }
      });

      if (task && typeof task.then === "function") {
        task.then(finish).catch((error) => {
          warnCloudImage("getTempFileURL promise failed", { fileList, error });
          finishWithFallback(sourceUrls);
        });
      }
    } catch (error) {
      warnCloudImage("getTempFileURL threw", { fileList: normalizeCloudFileList(cloudUrls), error });
      finishWithFallback(sourceUrls);
    }

    timerId = setTimeout(() => {
      if (!settled) {
        warnCloudImage("resolve cloud image timeout", cloudUrls);
        finishWithFallback(sourceUrls);
      }
    }, 3000);
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
