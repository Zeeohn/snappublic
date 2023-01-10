const cloudinary = require("../utils/cloudinary");
const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const validator = require("validator");

exports.checkUserRole = (req, res, next) => {
  const { categories } = req.body;
  User.findById(req.user._id)
    .then((user) => {
      //check the user role
      console.log(user.role);
      if (
        user.role === "subscribed" &&
        (categories === "food" ||
          categories === "fashion" ||
          categories === "fitness" ||
          categories === "cars" ||
          categories === "art" ||
          categories === "museum" ||
          categories === "wallpaper" ||
          categories === "shows & concerts")
      ) {
        //user has the role and can create post on these categories
        next();
      } else if (
        // user's role doesn't matter for these categories
        user.role === "normal" ||
        (user.role === "subscribed" &&
          (categories === "photo" ||
            categories === "quotes" ||
            categories === "websites" ||
            categories === "dogs" ||
            categories === "cats" ||
            categories === "travel"))
      ) {
        next();
      } else {
        //user role is normal or the category is not in the authorized list
        return res.status(403).json({
          error: "Not authorized to create post on this category",
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        error: err,
      });
    });
};

exports.createPost = async (req, res) => {
  try {
    //Uploading image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "Posts-Media",
    });
    // Find user by the given username
    let currentUser = await User.findById(req.user.id);

    if (result.secure_url) {
      // Destructure the fields from the request body
      const { caption, message, link, comment } = req.body;

      // Initialize an array to store errors
      const errors = [];

      // Validate the fields
      if (validator.isEmpty(caption)) {
        errors.push({ param: "caption", msg: "Caption field is required" });
      }
      if (validator.isEmpty(message)) {
        errors.push({
          param: "message",
          msg: "Message/post field is required",
        });
      }
      if (validator.isEmpty(req.params.catalog)) {
        errors.push({
          param: "catalog",
          msg: "catalog field is required",
        });
      }

      if (errors.length > 0) {
        // If there are errors, destroy the image on Cloudinary and return the errors
        await cloudinary.uploader.destroy(result.public_id);
        res.json({ errors });
      } else {
        // If there are no errors, create a new Post object and save it to the database
        let post = new Post({
          user: currentUser.id,
          caption,
          message,
          link,
          catalog: req.params.catalog,
          media: result.secure_url,
          cloudinary_id: result.public_id,
          date: new Date(),
          comment,
        });
        post.save().then((poste) => {
          // Update the user's 'posts' array to include the new post
          User.findOneAndUpdate(
            { _id: currentUser._id },
            { $addToSet: { posts: poste._id } }
          ).then((result) => {
            res.json({ created: true, postId: poste._id });
          });
        });
      }
    } else {
      // If the image was not uploaded to Cloudinary, return an error
      res.json({ created: false });
    }
  } catch (error) {
    res.status(500).json({ error });
    console.log(error);
  }
};

exports.getPosts = async (req, res) => {
  const { username } = req.params;
  try {
    // query the Post model using the `id` field
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    const user = await User.findOne({ _id: post.user });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res
      .status(200)
      .json({ post, postUser: user, comments: post.comments || [] });
  } catch (err) {
    res.status(500).send(err);
    console.log(err);
  }
};

exports.getAllPosts = async (req, res) => {
  console.log(req.user);
  try {
    // query the User model using the `username` field
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // query the Post model using the `user` field
    const userPosts = await Post.find({ user: user._id });
    if (!userPosts || userPosts.length === 0) {
      return res.status(404).send({ error: "No posts found for this user" });
    }

    // query the Post model using the `_id` field
    const friendPosts = await Promise.all(
      user?.following?.map((friendId) => {
        return Post.find({ _id: friendId });
      })
    );
    if (!friendPosts || friendPosts.length === 0) {
      return res
        .status(404)
        .send({ error: "No posts found for these friends" });
    }

    // return the user's posts and the posts of their friends to the client
    res.json(userPosts.concat(...friendPosts));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.like = async (req, res) => {
  console.log(req.user);
  try {
    // query the Post model using the `req.params.id` parameter
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    // toggle the `id` field of the `req.body` object in the `likes` array
    if (!post.likes.includes(req.user.id)) {
      post.likes.push(req.user.id);
      await post.save();
      res.status(200).json({ message: "Post has been liked!" });
    } else {
      post.likes = post.likes.filter((like) => like !== req.user.id);
      await post.save();
      res.status(200).json({ message: "Post has been disliked!" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (!text) {
      return res.status(404).json({ error: "Comment text required" });
    }
    let comment = {
      user: req.user._id,
      text,
      date: new Date(),
    };
    post.comment.push(comment);
    await post.save();
    res.json({ message: "Comment added successfully", comment });
  } catch (error) {
    console.log(error, "here");
    res.status(500).json({ error });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (post.comments[commentIndex].user.toString() !== req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.json({ message: "Comment removed" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// exports.addComment = async (req, res) => {
//   try {
//     // query the Post model using the `req.params.id` parameter
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).send({ error: "Post not found" });
//     }

//     // check if the req.body object contains the required fields
//     if (!req.body.userId || !req.body.content) {
//       return res
//         .status(400)
//         .send({ error: "userId and content fields are required" });
//     }

//     // add the comment to the post
//     post.comment.push({ userId: req.body.userId, content: req.body.content });
//     await post.save();
//     res.status(200).json({ message: "Comment has been added successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json(err);
//   }
// };

// exports.deleteComment = async (req, res) => {
//   try {
//     const { userId, content } = req.body;
//     if (!userId || !content) {
//       res
//         .status(400)
//         .send({ error: "Invalid request. User ID and content are required." });
//       return;
//     }

//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       res.status(404).send({ error: "Post not found." });
//       return;
//     }

//     const commentIndex = post.comment.findIndex(
//       (comment) => comment.userId === userId && comment.content === content
//     );
//     if (commentIndex === -1) {
//       res.status(404).send({ error: "Comment not found." });
//       return;
//     }

//     post.comment.splice(commentIndex, 1);
//     await post.save();
//     res.status(200).json("Comment has been deleted successfully!");
//   } catch (err) {
//     console.log(err);
//     res.status(500).json(err);
//   }
// };

exports.search = async (req, res) => {
  const queryString = req.body.query;
  const queryStrings = queryString.split("");
  allQueries = [];
  queryStrings.forEach((element) => {
    allQueries.push({ catalog: { $regex: String(element), $options: "i" } });
  });
  const searchPost = await Post.find({
    caption: req.body.caption,
    $or: allQueries,
  });
  if (!searchPost || searchPost.length === 0) {
    res.status(400).send({ error: "No search result!" });
  } else {
    res.status(200).send(searchPost);
  }
};
