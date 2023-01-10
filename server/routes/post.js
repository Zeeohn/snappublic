const { Router } = require("express");
const passportConfig = require("../config/passport");
const upload = require("../utils/multer");
const {
  checkUserRole,
  createPost,
  getPosts,
  getAllPosts,
  like,
  addComment,
  deleteComment,
  search,
} = require("../controller/post");

const postsRoute = Router();

postsRoute.post(
  "/create-pin/:catalog",
  passportConfig.isAuthenticated,
  checkUserRole,
  upload.single("media"),
  createPost
);
postsRoute.put("/:id/like", passportConfig.isAuthenticated, like);
postsRoute.get("/pins/:catalog", getPosts);
postsRoute.get("/all-pins", getAllPosts);
postsRoute.post(
  "/pins/comment/:id",
  passportConfig.isAuthenticated,
  addComment
);
postsRoute.delete(
  "/pins/comment/:id/:commentId",
  passportConfig.isAuthenticated,
  deleteComment
);
postsRoute.post("/search", search);

module.exports = postsRoute;
