const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;
const bcrypt = require("bcryptjs");
// const USER_TYPES = require("./../utils/constants");

// user schema definition
const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: [true, "email already registered"],
      maxlength: 50,
      index: true,
      required: true,
    },
    tokens: Array,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: Boolean,
    picture: {
      type: String,
      default:
        "https://www.shutterstock.com/image-vector/flat-vector-icon-profile-face-user-1913139877",
    },
    cloudinary_id: {
      type: String,
      default: "",
    },
    facebook: String,
    twitter: String,
    google: String,
    instagram: String,
    lastVisited: {
      type: Date,
      default: new Date(),
    },
    role: {
      type: String,
      required: true,
      default: "normal",
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
    },
    birthday: {
      type: String,
    },
    country: {
      type: String,
    },
    occupation: {
      type: String,
    },
    posts: {
      type: Array,
      default: [],
    },
    catalog_preferences: {
      type: Array,
    },
    saved: {
      type: Array,
      default: [],
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  try {
    // check method of registration
    const user = this;
    if (!user.isModified("password")) next();
    // generate salt
    const salt = await bcrypt.genSalt(10);
    // hash the password
    const hashedPassword = await bcrypt.hash(this.password, salt);
    // replace the plain ext password with the hashed password
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
    console.log(error);
  }
});

UserSchema.methods.matchPassword = async function (password, done) {
  try {
    const isMatch = await bcrypt.compare(password, this.password);
    if (isMatch) {
      return done(null, this);
    }
    return done(null, false, { msg: "Invalid email or password." });
  } catch (error) {
    console.log("Password does not match!");
    return done(error);
  }
};

const UserModel = model("User", UserSchema);
module.exports = UserModel;
