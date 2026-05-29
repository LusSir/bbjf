const auth = require("../../utils/auth");
const settingsService = require("../../utils/settings-service");
const settingsModel = require("../../utils/settings-model");

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    saving: false,
    uploadingQr: false,
    uploadingPhotos: false,
    form: settingsModel.normalizeStore({})
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    this.setData({ checking: true });
    auth.requireAdmin()
      .then(() => {
        this.setData({ checking: false, allowed: true });
        this.loadStore();
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadStore() {
    this.setData({ loading: true });
    settingsService.getStore()
      .then((store) => {
        this.setData({ form: store });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },
  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },
  chooseWechatQr() {
    if (this.data.uploadingQr) return;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (path) this.uploadImage(path, "wechat-qr");
      }
    });
  },
  chooseStorePhotos() {
    if (this.data.uploadingPhotos) return;
    wx.chooseImage({
      count: 9,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.uploadPhotoQueue(res.tempFilePaths || [], 0, []);
      }
    });
  },
  uploadImage(tempPath, type) {
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const cloudPath = `store/${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    this.setData({ uploadingQr: type === "wechat-qr" });
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        this.setData({ "form.wechatQrCode": res.fileID });
        wx.showToast({ title: "二维码已上传", icon: "success" });
      },
      fail: () => {
        wx.showToast({ title: "图片上传失败", icon: "none" });
      },
      complete: () => {
        this.setData({ uploadingQr: false });
      }
    });
  },
  uploadPhotoQueue(tempPaths, index, uploadedImages) {
    if (index >= tempPaths.length) {
      const photos = settingsModel.mergeImageList(this.data.form.storePhotos, uploadedImages);
      this.setData({
        "form.storePhotos": photos,
        uploadingPhotos: false
      });
      if (uploadedImages.length) {
        wx.showToast({ title: "门店图已上传", icon: "success" });
      }
      return;
    }

    this.setData({ uploadingPhotos: true });
    const tempPath = tempPaths[index];
    const extMatch = tempPath.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const cloudPath = `store/photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}.${ext}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        uploadedImages.push(res.fileID);
        this.uploadPhotoQueue(tempPaths, index + 1, uploadedImages);
      },
      fail: () => {
        wx.showToast({ title: "图片上传失败", icon: "none" });
        this.uploadPhotoQueue(tempPaths, index + 1, uploadedImages);
      }
    });
  },
  removeStorePhoto(event) {
    const index = Number(event.currentTarget.dataset.index);
    const photos = (this.data.form.storePhotos || []).filter((_, itemIndex) => itemIndex !== index);
    this.setData({ "form.storePhotos": photos });
  },
  saveStore() {
    const store = settingsModel.normalizeStore(this.data.form);
    this.setData({ saving: true });
    settingsService.saveStore(store)
      .then((savedStore) => {
        this.setData({ form: savedStore });
        wx.showToast({ title: "门店信息已保存", icon: "success" });
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "保存失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ saving: false });
      });
  }
});
