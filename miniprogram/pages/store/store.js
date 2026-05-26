const store = require("../../config/store");
const contact = require("../../utils/contact");

Page({
  data: {
    store,
    faqs: [
      "支持到店看实物，花色和尺寸以门店现货为准。",
      "普通商品可微信咨询，特价商品建议尽快到店确认。",
      "第一版小程序不支持线上支付，下单和付款请联系门店。"
    ]
  },
  onShareAppMessage() {
    return {
      title: store.shareTitle,
      path: "/pages/store/store"
    };
  },
  handleWechat() {
    contact.openWechatQrCode();
  },
  previewWechatQr() {
    contact.openWechatQrCode();
  },
  handlePhone() {
    contact.callStore();
  },
  handleLocation() {
    contact.openStoreLocation();
  }
});
