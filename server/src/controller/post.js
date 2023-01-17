const cloudinary = require("../utils/cloudinary");
const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const validator = require("validator");
const mongoose = require("mongoose");
const shortid = require("shortid");

exports.checkUserRole = (req, res, next) => {
  const { catalog } = req.body;
  User.findById(req.user._id)
    .then((user) => {
      //check the user role
      // console.log(user.role);
      if (
        user.role === "subscribed" &&
        (catalog === "food" ||
          catalog === "fashion" ||
          catalog === "fitness" ||
          catalog === "cars" ||
          catalog === "art" ||
          catalog === "museums" ||
          catalog === "wallpaper" ||
          catalog === "shows & concerts" ||
          catalog === "photography" ||
          catalog === "house decoration" ||
          catalog === "tourism")
      ) {
        //user has the role and can create post on these catalog
        next();
      } else if (
        // user's role doesn't matter for these catalog
        user.role === "normal" ||
        (user.role === "subscribed" &&
          (catalog === "photo" ||
            catalog === "quotes" ||
            catalog === "websites" ||
            catalog === "dogs" ||
            catalog === "cats" ||
            catalog === "travel"))
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
    // Check if the uploaded file is an image or video
    let resourceType;
    if (req.file.mimetype.startsWith("image")) {
      resourceType = "image";
    } else if (req.file.mimetype.startsWith("video")) {
      resourceType = "video";
    } else {
      res.status(400).json({ error: "Invalid file type" });
      return;
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      folder: "Posts-Media",
    });
    // const result = await cloudinary.uploader.upload(req.file.path, {
    //   folder: "Posts-Media",
    // });
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
      if (!validator.isLength(message, { max: 300 })) {
        errors.push({
          param: "message",
          msg: "You have exceeded the text limit of 300 characters",
        });
      }
      if (validator.isEmpty(req.params.catalog)) {
        errors.push({
          param: "catalog",
          msg: "catalog field is required in the request header",
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

exports.postDetail = async (req, res) => {
  try {
    // Find the post by the given id
    const post = await Post.findById(req.params.id).populate("user", [
      "username",
      "name",
      "picture",
    ]);

    // If the post was not found, return a 404 error
    if (!post) return res.status(404).json({ post: "Post not found" });

    // increment the view count
    post.views++;
    post.save();

    // If the post was found, return it
    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.postsCatalog = async (req, res) => {
  try {
    // Find all posts in the given catalog
    const posts = await Post.find({ catalog: req.params.catalog }).populate(
      "user",
      ["username", "name", "picture"]
    );

    // If no posts are found, return a 404 error
    if (!posts)
      return res.status(404).json({ posts: "No posts found in that catalog" });

    // If posts are found, return them
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.myPosts = async (req, res) => {
  try {
    // Find all posts created by the currently signed in user
    const posts = await Post.find({ user: req.user._id }).populate("user", [
      "username",
      "name",
      "picture",
    ]);

    // If no posts are found, return a 404 error
    if (!posts)
      return res
        .status(404)
        .json({ posts: "You have not created any posts yet" });

    // If posts are found, return them
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.timeline = async (req, res) => {
  try {
    let page = req.query.page || 1;
    const limit = 10;
    let skip = (page - 1) * limit;

    // Find all posts created by the users the currently signed in user is following
    let following = await User.findById(req.user._id).select("following");
    let userFeed = await Post.find({ user: { $in: following } })
      .populate("user", ["username", "name", "picture"])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Find all posts created by the currently signed in user
    let userPosts = await Post.find({ user: req.user._id })
      .populate("user", ["username", "name", "picture"])
      .sort({ createdAt: -1 });

    // Concatenate the user's own posts with the posts from the users they are following
    userFeed = userFeed.concat(userPosts);

    // Sort the resulting array by the date the posts were created
    userFeed.sort((a, b) => b.createdAt - a.createdAt);

    // If no posts are found, return an empty array
    if (!userFeed) return res.status(200).json([]);
    res.json(userFeed);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.allPosts = async (req, res) => {
  try {
    let page = req.query.page || 1;
    const limit = 10;
    let skip = (page - 1) * limit;

    let allPosts = await Post.find()
      .populate("user", ["username", "name", "picture"])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // If no posts are found, return an empty array
    if (!allPosts) return res.status(200).json([]);
    res.json(allPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ url: post.media });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.savePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $addToSet: { saved: post._id } }
    );
    res.json({ message: "Post saved successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // share logic for different platforms
    if (platform === "facebook") {
      const postUrl = `https://your-website.com/post/${post._id}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
      res.json({ url: facebookUrl });
    } else if (platform === "twitter") {
      const postUrl = `https://your-website.com/post/${post._id}`;
      const postTitle = post.title;
      const twitterUrl = `https://twitter.com/intent/tweet?url=${postUrl}&text=${postTitle}`;
      res.json({ url: twitterUrl });
    } else if (platform === "instagram") {
      // share to Instagram
      const postImageUrl = post.media;
      const instagramUrl = `instagram://library?AssetPath=${postImageUrl}`;
      window.location.href = instagramUrl;
      res.json({ url: instagramUrl });
    } else if (platform === "whatsapp") {
      // share to WhatsApp
      const postUrl = `https://your-website.com/post/${post._id}`;
      const message = `Check out this post: ${postUrl}`;
      const encodedMessage = encodeURI(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      res.json({ url: whatsappUrl });
    } else if (platform === "telegram") {
      // share to Telegram
      const postUrl = `https://your-website.com/post/${post._id}`;
      const telegramUrl = `https://t.me/share/url?url=${postUrl}`;
      res.json({ url: telegramUrl });
    } else {
      return res.status(404).json({ error: "Invalid platform" });
    }

    // increment the shares count of the post
    post.shares = post.shares + 1;
    await post.save();

    // send back the updated shares count to the frontend
    res.json({ message: "Post shared successfully", shares: post.shares });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.followCatalog = async (req, res) => {
  try {
    User.findOne({ _id: req.user._id }, (err, user) => {
      if (err) return res.status(404).send({ msg: "User not found" });
      user.catalog_preferences.push(req.params.catalogName);
      user.save((error, user) => {
        if (error)
          return res.status(500).send({
            msg: "An error occurred while following catalog",
            error: err,
          });
        return res.status(200).send({
          msg: "Successfully followed catalog",
          catalog: req.params.catalogName,
        });
      });
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ msg: "An error occurred while following catalog", error: err });
  }
};

exports.suggestedCatalogs = async (req, res) => {
  try {
    // Find the user
    const user = await User.findOne({ _id: req.user._id });
    if (!user) return res.status(404).send({ msg: "User not found" });

    // Get the catalogs the user is following
    const followedCatalogs = user.catalog_preferences;

    // Find posts from the followed catalogs
    const suggestedPosts = await Post.find({
      catalog: { $in: followedCatalogs },
    })
      .limit(req.query.limit)
      .skip(req.query.skip);

    // Send the suggested posts as a response
    return res.status(200).send({ suggestedPosts });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      msg: "An error occurred while getting suggested posts",
      error: err,
    });
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

// add comment route
exports.addComment = async (req, res) => {
  try {
    // Find the post by the given id
    const post = await Post.findById(req.params.id);

    // If the post was not found, return a 404 error
    if (!post) return res.status(404).json({ post: "Post not found" });

    // Find the user by the given id
    const user = await User.findById(req.user._id);

    // If the user was not found, return a 404 error
    if (!user) return res.status(404).json({ user: "User not found" });

    // Destructure the comment field from the request body
    const { comment } = req.body;

    // Initialize an array to store errors
    const errors = [];

    // Validate the fields
    if (validator.isEmpty(comment)) {
      errors.push({ param: "comment", msg: "Comment field is required" });
    }

    if (errors.length > 0) {
      res.json({ errors });
    } else {
      // create unique id
      const commentId = shortid.generate();
      // If there are no errors, create a new Comment object and save it to the post
      post.comment.push({
        user: user._id,
        comment,
        commentId,
        date: new Date(),
      });
      post.save();
      res.json({ commentId });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

// delete comment route
exports.deleteComment = async (req, res) => {
  try {
    // Find the post by the given id
    const post = await Post.findById(req.params.id);

    // If the post was not found, return a 404 error
    if (!post) return res.status(404).json({ post: "Post not found" });

    // Find the user by the given id
    const user = await User.findById(req.user._id);

    // If the user was not found, return a 404 error
    if (!user) return res.status(404).json({ user: "User not found" });

    // Find the comment by the given commentId
    const comment = post.comment.find(
      (c) => c.commentId === req.params.commentId
    );

    // If the comment was not found, return a 404 error
    if (!comment) return res.status(404).json({ comment: "Comment not found" });

    // check if user created the post or the comment
    if (
      String(comment.user) !== String(user._id) &&
      String(post.user) !== String(user._id)
    )
      return res.status(401).json({
        unauthorized: "You are not authorized to delete this comment",
      });
    // If the user is authorized, remove the comment from the post and save the post
    post.comment = post.comment.filter(
      (c) => c.commentId !== req.params.commentId
    );
    post.save();

    // Return a message to indicate that the comment has been deleted
    res.json({ deleted: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.search = async (req, res) => {
  try {
    const { query, page, limit } = req.query;
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };
    // Check if query is provided
    if (!query) return res.status(404).json({ message: "No query provided" });

    // // create text index on catalog and caption fields
    // await Post.createIndexes({ caption: "text", catalog: "text" });
    // search for posts by catalog and caption using text index
    const posts = await Post.find({ $text: { $search: query } })
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);
    // If no posts are found, return a 404 error
    if (!posts || posts.length === 0)
      return res.status(404).json({ message: "No posts found" });

    // If posts are found, return them
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user.toString() !== req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await post.remove();
    res.json({ message: "Post removed" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// exports.userTimeline = async (req, res) => {
//   try {
//     // Check if the current user exists
//     const currentUser = await User.findById(req.user._id);
//     if (!currentUser) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     // Get the ids of the users that the current user is following, and include the current user's id
//     const following = currentUser.following;
//     following.push(req.user._id);
//     // Find all the posts created by the users that the current user is following
//     const posts = await Post.find({ user: { $in: following } })
//       .populate("user", "username name picture")
//       .sort({ createdAt: -1 }) // sort the posts by most recent
//       .exec();
//     if (!posts || posts.length === 0) {
//       return res.status(404).json({ error: "No posts found" });
//     }
//     res.status(200).json({ posts });
//   } catch (error) {
//     res.status(500).json({ error });
//   }
// };

// exports.getAllPosts = async (req, res) => {
//   console.log(req.user);
//   try {
//     // query the User model using the `username` field
//     const user = await User.findOne({ username: req.params.username });
//     if (!user) {
//       return res.status(404).send({ error: "User not found" });
//     }

//     // query the Post model using the `user` field
//     const userPosts = await Post.find({ user: user._id });
//     if (!userPosts || userPosts.length === 0) {
//       return res.status(404).send({ error: "No posts found for this user" });
//     }

//     // query the Post model using the `_id` field
//     const friendPosts = await Promise.all(
//       user?.following?.map((friendId) => {
//         return Post.find({ _id: friendId });
//       })
//     );
//     if (!friendPosts || friendPosts.length === 0) {
//       return res
//         .status(404)
//         .send({ error: "No posts found for these friends" });
//     }

//     // return the user's posts and the posts of their friends to the client
//     res.json(userPosts.concat(...friendPosts));
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.addComment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { text } = req.body;
//     const post = await Post.findById(id);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }
//     if (!text) {
//       return res.status(404).json({ error: "Comment text required" });
//     }
//     let comment = {
//       user: req.user._id,
//       text,
//       date: new Date(),
//     };
//     post.comment.push(comment);
//     await post.save();
//     res.json({ message: "Comment added successfully", comment });
//   } catch (error) {
//     console.log(error, "here");
//     res.status(500).json({ error });
//   }
// };

// exports.deleteComment = async (req, res) => {
//   try {
//     //get postId and commentId from req.params
//     const { postId, commentId } = req.params;
//     //validate postId
//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(404).json({ error: "Invalid postId" });
//     }
//     //validate commentId
//     if (!mongoose.Types.ObjectId.isValid(commentId)) {
//       return res.status(404).json({ error: "Invalid commentId" });
//     }
//     //find the post
//     const post = await PostModel.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }
//     //find the comment
//     const comment = post.comment.find((c) => c._id.equals(commentId));
//     if (!comment) {
//       return res.status(404).json({ error: "Comment not found" });
//     }
//     //check that the user trying to delete the comment is the one who created the comment
//     if (!req.user._id.equals(comment.user)) {
//       return res
//         .status(401)
//         .json({ error: "Unauthorized to delete this comment" });
//     }
//     //remove the comment
//     post.comment = post.comment.filter((c) => !c._id.equals(commentId));
//     await post.save();
//     res.json({ message: "Comment deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error });
//   }
// };

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

// exports.getPosts = async (req, res) => {
//   console.log("Entering here...");
//   try {
//     // Find all posts created by the currently signed in user
//     const posts = await Post.find({ user: req.user._id });
//     // If no posts are found, return a 404 error
//     if (!posts) {
//       return res.status(404).json({ error: "No posts found for this user" });
//     }
//     // Find the user associated with each post
//     const postUsers = await User.find({
//       _id: { $in: posts.map((post) => post.user) },
//     });
//     // Create a map of users, so we can easily look up the user associated with each post
//     const userMap = postUsers.reduce((map, user) => {
//       map[user._id] = user;
//       return map;
//     }, {});
//     // Add the user information to each post and send the response
//     const response = posts.map((post) => ({
//       ...post._doc,
//       user: userMap[post.user],
//     }));
//     res.json(response);
//   } catch (err) {
//     res.status(500).json(err);
//     console.log(err);
//   }
// };

// exports.getAllPins = async (req, res) => {
//   console.log("Outside here..");
//   try {
//     console.log("Getting here");
//     const posts = await Post.find()
//       .populate("user", "username name picture")
//       .exec();
//     console.log(posts);
//     res.json({ posts });
//   } catch (error) {
//     console.log(error, " Getting error");
//     res.status(500).json({ error });
//   }
// };

// exports.search = async (req, res) => {
//   try {
//     const queryString = req.query.query;
//     if (!queryString)
//       return res.status(400).json({ error: "Query param is missing" });
//     if (typeof queryString !== "string")
//       return res.status(400).json({ error: "Query param should be a string" });
//     // search for posts with a matching caption or catalog field
//     const searchPost = await Post.find({
//       $or: [
//         { caption: { $regex: queryString, $options: "i" } },
//         { catalog: { $regex: queryString, $options: "i" } },
//       ],
//     });

//     // return the search results to the client
//     res.status(200).send(searchPost);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error);
//   }
// };
