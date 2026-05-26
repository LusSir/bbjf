const contact = require("../../utils/contact");

Component({
  methods: {
    handleWechat() {
      contact.openWechatQrCode();
    },
    handlePhone() {
      contact.callStore();
    },
    handleLocation() {
      contact.openStoreLocation();
    }
  }
});
