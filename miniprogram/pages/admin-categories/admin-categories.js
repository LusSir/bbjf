const auth = require("../../utils/auth");
const settingsService = require("../../utils/settings-service");
const settingsModel = require("../../utils/settings-model");

const emptyForm = {
  id: "",
  name: "",
  description: "",
  sort: 10,
  status: "active"
};

Page({
  data: {
    checking: true,
    allowed: false,
    loading: false,
    saving: false,
    categories: [],
    form: { ...emptyForm },
    editing: false
  },
  onShow() {
    this.checkAdmin();
  },
  checkAdmin() {
    this.setData({ checking: true });
    auth.requireAdmin()
      .then(() => {
        this.setData({ checking: false, allowed: true });
        this.loadCategories();
      })
      .catch(() => {
        this.setData({ checking: false, allowed: false });
        wx.showToast({ title: "仅管理员可进入", icon: "none" });
      });
  },
  loadCategories() {
    this.setData({ loading: true });
    settingsService.listCategories({ includeDisabled: true })
      .then((categories) => {
        this.setData({ categories });
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
  updateStatus(event) {
    this.setData({
      "form.status": event.detail.value ? "active" : "disabled"
    });
  },
  editCategory(event) {
    const id = event.currentTarget.dataset.id;
    const category = this.data.categories.find((item) => item.id === id);
    if (!category) return;
    this.setData({
      form: { ...category },
      editing: true
    });
  },
  resetForm() {
    this.setData({
      form: { ...emptyForm },
      editing: false
    });
  },
  saveCategory() {
    let category;
    try {
      category = settingsModel.normalizeCategoryInput(this.data.form);
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    settingsService.saveCategory(category)
      .then(() => {
        wx.showToast({ title: "分类已保存", icon: "success" });
        this.resetForm();
        this.loadCategories();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "保存失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ saving: false });
      });
  },
  toggleCategory(event) {
    const id = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status === "disabled" ? "active" : "disabled";
    settingsService.setCategoryStatus(id, status)
      .then(() => {
        wx.showToast({ title: status === "active" ? "已启用" : "已停用", icon: "success" });
        this.loadCategories();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "操作失败", icon: "none" });
      });
  }
});
