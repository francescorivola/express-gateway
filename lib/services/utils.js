const bcrypt = require("bcryptjs");

const config = require("../config");

function appendCreatedAt(obj) {
  Object.assign(obj, {
    createdAt: new Date().toString(),
  });
}

function appendUpdatedAt(obj) {
  Object.assign(obj, {
    updatedAt: new Date().toString(),
  });
}

function compareSaltAndHashed(password, hash) {
  return !password || !hash ? null : bcrypt.compare(password, hash);
}

function saltAndHash(password) {
  if (!password || typeof password !== "string") {
    return Promise.reject(new Error("invalid arguments"));
  }

  return bcrypt
    .genSalt(config.systemConfig.crypto.saltRounds)
    .then((salt) => bcrypt.hash(password, salt));
}

module.exports = {
  appendCreatedAt,
  appendUpdatedAt,
  compareSaltAndHashed,
  saltAndHash,
};
