const { Router } = require("express");
const passportConfig = require("../config/passport");
const upload = require("../utils/multer");
const {
  checkUserRole,
  createPost,
  postDetail,
  postsCatalog,
  myPosts,
  allPosts,
  timeline,
  download,
  like,
  savePost,
  addComment,
  deletePost,
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
postsRoute.get("/pins/:catalog", postsCatalog);
postsRoute.get("/pin-details/:id", postDetail);
postsRoute.get("/pins/download/:id", passportConfig.isAuthenticated, download);
postsRoute.get("/", allPosts);
postsRoute.get("/pins/timeline", passportConfig.isAuthenticated, timeline);
postsRoute.get("/pins/my-pins", passportConfig.isAuthenticated, myPosts);
postsRoute.post("/pins/save/:id", passportConfig.isAuthenticated, savePost);
postsRoute.post(
  "/pins/comment/:id",
  passportConfig.isAuthenticated,
  addComment
);
postsRoute.delete(
  "/pins/comment/:postId/:commentId",
  passportConfig.isAuthenticated,
  deleteComment
);
postsRoute.delete("/pins/:id", passportConfig.isAuthenticated, deletePost);
postsRoute.post("/search", search);

module.exports = postsRoute;
