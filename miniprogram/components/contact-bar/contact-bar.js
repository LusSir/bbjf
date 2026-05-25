const contact = require("../../utils/contact");

Component({
  methods: {
    handleWechat() {
      contact.copyWechat();
    },
    handlePhone() {
      contact.callStore();
    },
    handleLocation() {
      contact.openStoreLocation();
    }
  }
});
