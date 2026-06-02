const fallbackStore = require("../config/store");
const cloudImage = require("./cloud-image");

function getStore(store) {
  return store || fallbackStore;
}

function openWechatQrCode(store) {
  const currentStore = getStore(store);
  if (!currentStore.wechatQrCode) {
    wx.showModal({
      title: "微信咨询",
      content: "微信二维码还未配置，请在商铺管理里上传二维码。",
      showCancel: false
    });
    return;
  }

  cloudImage.resolveCloudFileUrl(currentStore.wechatQrCode).then((src) => {
    wx.getImageInfo({
      src,
      success(res) {
        wx.previewImage({
          current: res.path,
          urls: [res.path]
        });
      },
      fail() {
        wx.showModal({
          title: "二维码加载失败",
          content: "请确认微信二维码图片已上传成功，或本地路径配置正确。",
          showCancel: false
        });
      }
    });
  });
}

function callStore(store) {
  const currentStore = getStore(store);
  if (!currentStore.phone) {
    wx.showModal({
      title: "电话联系",
      content: "联系电话还未配置，请在商铺管理里补充门店电话。",
      showCancel: false
    });
    return;
  }

  wx.makePhoneCall({ phoneNumber: currentStore.phone });
}

function openStoreLocation(store) {
  const currentStore = getStore(store);
  if (typeof currentStore.latitude !== "number" || typeof currentStore.longitude !== "number") {
    wx.showModal({
      title: "导航到店",
      content: "门店经纬度还未配置，请在商铺管理里补充准确位置。",
      showCancel: false
    });
    return;
  }

  wx.openLocation({
    latitude: currentStore.latitude,
    longitude: currentStore.longitude,
    name: currentStore.name,
    address: currentStore.address,
    scale: 18
  });
}

module.exports = {
  openWechatQrCode,
  callStore,
  openStoreLocation
};
