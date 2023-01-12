const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const MongoStore = require("connect-mongo");
const morgan = require("morgan");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

dotenv.config();
// Import the User model
// const User = require("./models/UserModel");

const authController = require("./controller/auth");
const passportConfig = require("./config/passport");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");

const app = express();

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1209600000 }, // Two weeks in milliseconds
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many password reset requests, please try again later",
});

app.post("/api/v1/login", authController.postLogin);
app.post("/api/v1/signup", authController.postSignup);
app.get("/api/v1/logout", authController.logout);
app.post("/api/v1/reset-password", resetLimiter, authController.resetPassword);
app.post("api/v1/reset-password/:token", authController.resetToken);

app.get(
  "/api/v1/auth/facebook",
  passport.authenticate("facebook", { scope: ["email", "public_profile"] })
);
app.get("/api/v1/auth/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    if (err || !user) {
      // handle error
      console.log("Error:", err);
      console.log("User:", user);
      console.log("Info:", info);
      return res
        .status(400)
        .send({ msg: "An error occurred during authentication" });
    }
    req.login(user, (err) => {
      if (err) {
        console.log("Error:", err);
        return res
          .status(400)
          .send({ msg: "An error occurred during authentication" });
      }
      // send user information to client
      return res.send({ user });
    });
  })(req, res, next);
});

app.get("/api/v1/auth/twitter", passport.authenticate("twitter"));
app.get("/api/v1/auth/twitter/callback", (req, res, next) => {
  passport.authenticate("twitter", (err, user, info) => {
    if (err || !user) {
      // handle error
      console.log("Error:", err);
      console.log("User:", user);
      console.log("Info:", info);
      return res
        .status(400)
        .send({ msg: "An error occurred during authentication" });
    }
    req.login(user, (err) => {
      if (err) {
        console.log("Error:", err);
        return res
          .status(400)
          .send({ msg: "An error occurred during authentication" });
      }
      // send user information to client
      return res.send({ user });
    });
  })(req, res, next);
});

app.get(
  "/api/v1/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get("/api/v1/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      // handle error
      console.log("Error:", err);
      console.log("User:", user);
      console.log("Info:", info);
      return res
        .status(400)
        .send({ msg: "An error occurred during authentication" });
    }
    req.login(user, (err) => {
      if (err) {
        console.log("Error:", err);
        return res
          .status(400)
          .send({ msg: "An error occurred during authentication" });
      }
      // send user information to client
      return res.send({ user });
    });
  })(req, res, next);
});

app.get(
  "/api/v1/auth/instagram",
  passport.authenticate("instagram", { scope: ["basic", "public_content"] })
);
app.get("/api/v1/auth/instagram/callback", (req, res, next) => {
  passport.authenticate("instagram", (err, user, info) => {
    if (err || !user) {
      // handle error
      console.log("Error:", err);
      console.log("User:", user);
      console.log("Info:", info);
      return res
        .status(400)
        .send({ msg: "An error occurred during authentication" });
    }
    req.login(user, (err) => {
      if (err) {
        console.log("Error:", err);
        return res
          .status(400)
          .send({ msg: "An error occurred during authentication" });
      }
      // send user information to client
      return res.send({ user });
    });
  })(req, res, next);
});

app.use("/api/v1", userRoute);
app.use("/api/v1", postRoute);

app.get("/", (req, res) => {
  res.send("Welcome to the server side :)");
});

const PORT = process.env.PORT || 5000;

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
  )
  .catch((err) => console.log(err));

module.exports = app;
