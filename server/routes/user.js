const { Router } = require("express");
const passport = require("passport");
const upload = require("./../utils/multer");
const passportConfig = require("../config/passport");
const {
  updateProfile,
  getUser,
  follow,
  unfollow,
  deleteAccount,
} = require("../controller/user");

const userRoute = Router();

userRoute.patch(
  "/update-profile/:username",
  upload.single("picture"),
  passportConfig.isAuthenticated,
  updateProfile
);

userRoute.get("/:username", passportConfig.isAuthenticated, getUser);
userRoute.put("/:username/follow", passportConfig.isAuthenticated, follow);
userRoute.put("/:username/unfollow", passportConfig.isAuthenticated, unfollow);

// userRoute.post(
//   "/:username/delete",
//   passportConfig.isAuthenticated,
//   deleteAccount
// );

module.exports = userRoute;
