const { Router } = require("express");
const passport = require("passport");
const upload = require("./../utils/multer");
const passportConfig = require("../config/passport");
const {
  getUser,
  myProfile,
  updateProfile,
  follow,
  unfollow,
  deleteAccount,
} = require("../controller/user");

const userRoute = Router();

userRoute.get("/:username", passportConfig.isAuthenticated, getUser);

userRoute.get("/user/profile", passportConfig.isAuthenticated, myProfile);

userRoute.patch(
  "/update-profile/:username",
  upload.single("picture"),
  passportConfig.isAuthenticated,
  updateProfile
);

userRoute.put("/:username/follow", passportConfig.isAuthenticated, follow);
userRoute.put("/:username/unfollow", passportConfig.isAuthenticated, unfollow);

userRoute.delete(
  "/account/delete",
  passportConfig.isAuthenticated,
  deleteAccount
);

module.exports = userRoute;
