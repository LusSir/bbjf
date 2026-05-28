const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeUser(doc, openid) {
  return {
    id: doc._id || "",
    openid,
    nickName: doc.nickName || "",
    avatarUrl: doc.avatarUrl || "",
    role: doc.role || "user",
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const profile = event && event.profile ? event.profile : {};
  const users = db.collection("users");
  const existed = await users.where({ _openid: openid }).limit(1).get();

  if (!existed.data.length) {
    const user = {
      _openid: openid,
      nickName: profile.nickName || "",
      avatarUrl: profile.avatarUrl || "",
      role: "user",
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    const created = await users.add({ data: user });
    return {
      openid,
      user: normalizeUser({ ...user, _id: created._id }, openid)
    };
  }

  const current = existed.data[0];
  const updateData = {
    updatedAt: db.serverDate()
  };

  if (profile.nickName && profile.nickName !== current.nickName) {
    updateData.nickName = profile.nickName;
  }
  if (profile.avatarUrl && profile.avatarUrl !== current.avatarUrl) {
    updateData.avatarUrl = profile.avatarUrl;
  }

  await users.doc(current._id).update({ data: updateData });

  return {
    openid,
    user: normalizeUser({ ...current, ...updateData }, openid)
  };
};
