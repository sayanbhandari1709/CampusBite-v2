const crypto = require("crypto");

function generateToken(length = 8) {
  return crypto
    .randomBytes(length)
    .toString("hex")
    .toUpperCase()
    .substring(0, length);
}

module.exports = generateToken;