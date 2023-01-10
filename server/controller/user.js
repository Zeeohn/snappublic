const _ = require("lodash");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const User = require("../models/UserModel");

exports.getUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await User.findOne(
      { username: username },
      "username name email tokens picture cloudinary_id lastVisited role posts saved followers following"
    );
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: "User not found!" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // Find the user by their username
    let currentUser = await User.findOne({ username: req.params.username });
    // Make sure that the user exists
    if (!currentUser) {
      return res.status(404).send({ msg: "The specified user was not found" });
    }
    // Make sure that the user is the one making the request
    if (currentUser._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .send({ msg: "You are not authorized to update this user's profile" });
    }
    // Upload the profile picture to Cloudinary (if provided)
    let result;
    if (req.file && req.file.path) {
      result = await cloudinary.uploader.upload(req.file.path, {
        folder: "Profile-Pictures",
      });
    }
    // Set the email verification status to false if the email is being changed
    if (req.user.email !== req.body.email) {
      currentUser.emailVerified = false;
    }
    // Update the user's profile
    const data = {
      email: req.body.email || currentUser.email,
      name: req.body.name || currentUser.name,
      username: req.body.username || currentUser.username,
      picture: result ? result.secure_url : currentUser.picture,
      cloudinary_id: result ? result.public_id : currentUser.cloudinary_id,
    };
    user = await User.findByIdAndUpdate(currentUser._id, data, {
      new: true,
    });
    // Send the updated user profile as the response
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ msg: "Error updating your profile! Please try again later" });
  }
};

exports.follow = async (req, res) => {
  if (req.body.username !== req.params.username) {
    try {
      // Find the user to be followed by their username
      const user = await User.findOne({ username: req.params.username });
      // Make sure that the user exists
      if (!user) {
        return res
          .status(404)
          .send({ msg: "The specified user was not found" });
      }
      // Find the current user by their username
      const currentUser = await User.findOne({
        username: req.body.username,
      });
      // Make sure that the current user exists
      if (!currentUser) {
        return res.status(404).send({ msg: "The current user was not found" });
      }
      // Check if the current user is already following the user to be followed
      if (!user.followers.includes(currentUser._id)) {
        // Update the user to be followed's followers array
        await user.updateOne({ $push: { followers: currentUser._id } });
        // Update the current user's following array
        await currentUser.updateOne({
          $push: { following: user._id },
        });
        // Send a success response
        res.status(200).json("User has been followed!");
      } else {
        // Send a failure response
        res.status(403).json("You already follow this user!");
      }
    } catch (err) {
      // Send an error response
      res.status(500).json(err);
    }
  } else {
    // Send a failure response
    res.status(403).json("You can't follow yourself!");
  }
};

exports.unfollow = async (req, res) => {
  if (req.body.username !== req.params.username) {
    try {
      // Find the user to be followed by their username
      const user = await User.findOne({ username: req.params.username });
      // Make sure that the user exists
      if (!user) {
        return res
          .status(404)
          .send({ msg: "The specified user was not found" });
      }
      // Find the current user by their username
      const currentUser = await User.findOne({
        username: req.body.username,
      });
      // Make sure that the current user exists
      if (!currentUser) {
        return res.status(404).send({ msg: "The current user was not found" });
      }
      // Check if the current user is already following the user to be followed
      if (user.followers.includes(currentUser._id)) {
        // Update the user to be followed's followers array
        await user.updateOne({ $pull: { followers: currentUser._id } });
        // Update the current user's following array
        await currentUser.updateOne({
          $pull: { following: user._id },
        });
        // Send a success response
        res.status(200).json("User has been unfollowed!");
      } else {
        // Send a failure response
        res.status(403).json("You don't follow this user!");
      }
    } catch (err) {
      // Send an error response
      res.status(500).json(err);
    }
  } else {
    // Send a failure response
    res.status(403).json("You can't unfollow yourself!");
  }
};

exports.deleteAccount = (req, res, next) => {
  User.deleteOne({ username: req.params.username, _id: req.user.id }, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    res.clearCookie("connect.sid");
    res.status(200).send({ msg: "Account deleted successfully!" });
  });
};
