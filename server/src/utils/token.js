const jwt = require("jsonwebtoken");

exports.generateToken = (data) => {
  const key = process.env.JWT_SECRET_KEY;
  return jwt.sign(data, key, { expiresIn: "1d", subject: "User Access Token" });
};

exports.verifyToken = (token) => {
  const key = process.env.JWT_SECRET_KEY;
  return jwt.verify(token, key);
};
