const assert = require("assert");
const auth = require("../miniprogram/utils/auth");

assert.deepStrictEqual(auth.normalizeProfile({
  nickName: "  贝贝店主  ",
  avatarUrl: "https://example.com/avatar.jpg",
  extra: "ignored"
}), {
  nickName: "贝贝店主",
  avatarUrl: "https://example.com/avatar.jpg"
});

assert.deepStrictEqual(auth.normalizeProfile(null), {
  nickName: "",
  avatarUrl: ""
});

console.log("user profile tests passed");
