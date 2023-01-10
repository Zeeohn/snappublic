const passport = require("passport");
const _ = require("lodash");
const validator = require("validator");
const {
  generateFromEmail,
  generateUsername,
} = require("unique-username-generator");
const User = require("../models/UserModel");

exports.postLogin = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Password cannot be blank." });
  // if (req.body.password !== req.body.matchPassword)
  //   validationErrors.push({ msg: "Passwords do not match" });

  if (validationErrors.length) {
    return res
      .status(401)
      .send({ msg: "There are some errors in your form input" });
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send(info);
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.send(user);
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log("Error : Failed to logout.", err);
      return res.status(500).send({ msg: "Error : Failed to logout." });
    }
    req.session.destroy((err) => {
      if (err)
        console.log(
          "Error : Failed to destroy the session during logout.",
          err
        );
      req.user = null;
      res.clearCookie("connect.sid");
      res.status(200).send({ msg: "User logged out successfully" });
    });
  });
};

exports.postSignup = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  //

  if (validationErrors.length > 0) {
    return res
      .status(401)
      .send({ msg: "There are some errors in your form input" });
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    username: generateFromEmail(req.body.email, 2),
    picture:
      "https://www.shutterstock.com/image-vector/flat-vector-icon-profile-face-user-1913139877",
    role: "normal",
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      return res
        .status(401)
        .send({ msg: "Account with that email address already exists." });
    }
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.send(user);
      });
    });
  });
};
