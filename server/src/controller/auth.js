const passport = require("passport");
const _ = require("lodash");
const validator = require("validator");
const {
  generateFromEmail,
  generateUsername,
} = require("unique-username-generator");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const mailChecker = require("mailchecker");
// const rateLimit = require("express-rate-limit");
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
  if (
    !validator.isEmail(req.body.email) &&
    !mailChecker.isValid(req.body.email)
  )
    validationErrors.push({
      msg: "The email you entered is either not a working email or it is an invalid mail address, please use another email address.",
    });
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  if (!validator.isLength(req.body.username, { min: 4, max: 30 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  if (!validator.isLength(req.body.country, { min: 3, max: 50 }))
    validationErrors.push({
      msg: "country must be real nation on earth or 3 characters minimum",
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
    username: req.body.username,
    occupation: req.body.occupation,
    country: req.body.country,
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

// API endpoint to handle password reset request
exports.resetPassword = async (req, res) => {
  try {
    // Check if the provided email is valid
    if (
      !validator.isEmail(req.body.email) &&
      !mailChecker.isValid(req.body.email)
    ) {
      return res
        .status(400)
        .send({ message: "Please provide a valid email address" });
    }
    // Find the user by the email they provided
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    // Generate a random token for the user
    const token = crypto.randomBytes(20).toString("hex");
    // Save the token in the user's model
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // Send an email to the user with a link to reset their password
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const emailOptions = {
      from: "noreply@snapme.com",
      to: user.email,
      subject: "Snapme Password Reset",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n Please click on the following link, or paste this into your browser to complete the process:\n\n http://localhost:5000/reset-password/${token}\n\n If you did not request this, please ignore this email and your password will remain unchanged.\n,`,
    };
    sgMail.send(emailOptions);
    // Send a success message to the client
    res.send({ message: "Password reset email sent!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

exports.resetToken = async (req, res) => {
  try {
    // Find the user by the token and check if the token is still valid
    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).send({ message: "Invalid token or expired" });
    }
    // Hash the new password and save it in the user's model
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = bcrypt.hash(req.body.password, salt);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // Send a success message to the client
    res.send({ message: "Password reset successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
