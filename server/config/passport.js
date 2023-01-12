const passport = require("passport");
const refresh = require("passport-oauth2-refresh");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { Strategy: InstagramStrategy } = require("passport-instagram");
const { Strategy: TwitterStrategy } = require("passport-twitter");
const { OAuth2Strategy: GoogleStrategy } = require("passport-google-oauth");
const _ = require("lodash");
const {
  generateFromEmail,
  generateUsername,
} = require("unique-username-generator");
const moment = require("moment");

const User = require("../models/UserModel");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    (email, password, done) => {
      User.findOne({ email: email.toLowerCase() }, (err, user) => {
        console.log("Getting here..1a");
        if (err) {
          return done(err);
        }
        if (!user) {
          console.log("No User");
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
          console.log("No password");
          return done(null, false, {
            msg: "Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.",
          });
        }
        user.matchPassword(password, (err, isMatch) => {
          console.log("Matching passwords");
          if (err) {
            return done(err);
          }
          if (!isMatch) {
            console.log("No match!");
            return done(null, false, { msg: "Invalid email or password." });
          }
          return done(null, user);
        });
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["name", "email", "displayName", "locale", "timezone"],
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, done) => {
      if (req.user) {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(err, false, {
              msg: "There is already a Facebook account that belongs to you. Sign in with that account and then link it with your current account!",
            });
          } else {
            User.findById(req.user.id, (err, user) => {
              if (err) {
                return done(err);
              }
              user.facebook = profile.id;
              user.username =
                user.username || profile._json.email
                  ? generateFromEmail(profile._json.email, 2)
                  : generateUsername("", 2);
              user.tokens.push({
                kind: "facebook",
                accessToken,
              });
              user.name =
                user.name ||
                `${profile.name.givenName} ${profile.name.familyName}`;
              user.picture =
                user.picture ||
                `https://graph.facebook.com/${profile.id}/picture?type=large`;
              user.save((err) => {
                done(err, user);
              });
            });
          }
        });
      } else {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(null, existingUser);
          }
          User.findOne(
            { email: profile._json.email },
            (err, existingEmailUser) => {
              if (err) {
                return done(err);
              }
              if (existingEmailUser) {
                return done(err, false, {
                  msg: "There is an existing account with this email address, sign in to that account and connect your facebook account manually from account settings",
                });
              } else {
                const user = new User();
                user.email =
                  profile._json.email ||
                  `${profile.name.givenName}@facebook.com`;
                user.username = profile._json.email
                  ? generateFromEmail(profile._json.email, 2)
                  : generateUsername("", 2);
                user.facebook = profile.id;
                user.role = "normal";
                user.tokens.push({ kind: "facebook", accessToken });
                user.name = `${profile.name.givenName} ${profile.name.familyName}`;
                user.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
                user.save((err) => {
                  done(err, user);
                });
              }
            }
          );
        });
      }
    }
  )
);

// Twitter Sign in
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK,
      passReqToCallback: true,
    },
    (req, accessToken, tokenSecret, profile, done) => {
      if (req.user) {
        User.findOne({ twitter: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(err, false, {
              msg: "There is a twitter account that belongs to you already! Sign in with that account or delete it and link the twitter to your current account!",
            });
          } else {
            User.findById(req.user.id, (err, user) => {
              if (err) {
                return done(err);
              }
              user.twitter = profile.id;
              user.username = user.username || generateUsername("", 2);
              user.tokens.push({ kind: "twitter", accessToken, tokenSecret });
              user.name = user.name || profile.displayName;
              user.picture =
                user.picture || profile._json.profile_image_url_https;
              user.save((err) => {
                if (err) {
                  return done(err);
                }
                return done(err, user, {
                  msg: "Twitter account has been linked!",
                });
              });
            });
          }
        });
      } else {
        User.findOne({ twitter: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(null, existingUser);
          }
          const user = new User();
          user.username = profile.username;
          user.email = profile.email || profile._json.email;
          user.twitter = profile.id;
          user.role = "normal";
          user.tokens.push({ kind: "twitter", accessToken, tokenSecret });
          user.name = profile.displayName;
          user.picture = profile._json.profile_image_url_https;
          user.save((err) => {
            done(err, user);
          });
        });
      }
    }
  )
);

// Sign in with Google

const googleStrategyConfig = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    if (req.user) {
      await User.findOne({ google: profile.id }, (err, existingUser) => {
        if (err) {
          return done(err);
        }
        if (existingUser && existingUser.id !== req.user.id) {
          return done(err, false, {
            msg: "There is already a Google account that belongs to you. Sign in with that account!",
          });
        } else {
          User.findById(req.user.id, (err, user) => {
            if (err) {
              return done(err);
            }
            user.google = profile.id;
            user.tokens.push({
              kind: "google",
              accessToken,
              accessTokenExpires: moment()
                .add(params.expires_in, "seconds")
                .format(),
              refreshToken,
            });
            user.username =
              user.username || generateFromEmail(profile.emails[0].value, 2);
            user.name = user.name || profile.displayName;
            user.picture = user.picture || profile._json.picture;
            user.save((err) => {
              return done(err, user, {
                msg: "Google account has been linked.",
              });
            });
          });
        }
      });
    } else {
      User.findOne({ google: profile.id }, (err, existingUser) => {
        if (err) {
          return done(err);
        }
        if (existingUser) {
          return done(null, existingUser);
        }
        User.findOne(
          { email: profile.emails[0].value },
          (err, existingEmailUser) => {
            if (err) {
              return done(err);
            }
            if (existingEmailUser) {
              return done(err, false, {
                msg: "There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.",
              });
            } else {
              const user = new User();
              user.email = profile.emails[0].value;
              user.google = profile.id;
              user.tokens.push({
                kind: "google",
                accessToken,
                accessTokenExpires: moment()
                  .add(params.expires_in, "seconds")
                  .format(),
                refreshToken,
              });
              user.name = profile.displayName;
              user.role = "normal";
              user.username = generateFromEmail(profile.emails[0].value, 2);
              user.picture = profile._json.picture;
              user.save((err) => {
                done(err, user);
              });
            }
          }
        );
      });
    }
  }
);
passport.use("google", googleStrategyConfig);
refresh.use("google", googleStrategyConfig);

// Instagram Sign in

passport.use(
  new InstagramStrategy(
    {
      clientID: process.env.INSTAGRAM_ID,
      clientSecret: process.env.INSTAGRAM_SECRET,
      callbackURL: process.env.INSTAGRAM_CALLBACK,
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, done) => {
      if (req.user) {
        User.findOne({ instagram: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(err, false, {
              msg: "There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.",
            });
          } else {
            User.findById(req.user.id, (err, user) => {
              if (err) {
                return done(err);
              }
              user.instagram = profile.id;
              user.tokens.push({ kind: "instagram", accessToken });
              user.name = user.name || profile.displayName;
              user.role = "normal";
              user.picture = user.picture || profile._json.data.profile_picture;
              user.save((err) => {
                return done(err, user, {
                  msg: "Instagram account has been linked.",
                });
              });
            });
          }
        });
      } else {
        User.findOne({ instagram: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(null, existingUser);
          }
          const user = new User();
          user.instagram = profile.id;
          user.tokens.push({ kind: "instagram", accessToken });
          user.username = profile.username;
          user.name = profile.displayName;
          user.email = `${profile.username}@instagram.com`;
          user.picture = profile._json.data.profile_picture;
          user.save((err) => {
            done(err, user);
          });
        });
      }
    }
  )
);

// Login required
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.send({
    err: "You are unauthorized to access this route! Please login or sign up first!",
  });
};
