const store = require("../config/store");

function openWechatQrCode() {
  if (!store.wechatQrCode) {
    wx.showModal({
      title: "微信咨询",
      content: "微信二维码还未配置。请把二维码图片放到 miniprogram/assets/ 下，并在 store.js 配置 wechatQrCode。",
      showCancel: false
    });
    return;
  }

  wx.getImageInfo({
    src: store.wechatQrCode,
    success(res) {
      wx.previewImage({
        current: res.path,
        urls: [res.path]
      });
    },
    fail() {
      wx.showModal({
        title: "二维码加载失败",
        content: "请确认微信二维码图片已放入 miniprogram/assets/，并且 store.js 中的 wechatQrCode 路径正确。",
        showCancel: false
      });
    }
  });
}

function callStore() {
  if (!store.phone) {
    wx.showModal({
      title: "电话联系",
      content: "联系电话还未配置。正式发布前请补充门店电话。",
      showCancel: false
    });
    return;
  }

  wx.makePhoneCall({ phoneNumber: store.phone });
}

function openStoreLocation() {
  if (typeof store.latitude !== "number" || typeof store.longitude !== "number") {
    wx.showModal({
      title: "导航到店",
      content: "门店经纬度还未配置。正式发布前请补充准确位置。",
      showCancel: false
    });
    return;
  }

  wx.openLocation({
    latitude: store.latitude,
    longitude: store.longitude,
    name: store.name,
    address: store.address,
    scale: 18
  });
}

module.exports = {
  openWechatQrCode,
  callStore,
  openStoreLocation
};
