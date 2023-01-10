const mongoose = require("mongoose");
const { Schema, model, models, Types } = mongoose;

const PostSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    catalog: {
      type: String,
      required: true,
    },
    media: {
      type: String,
      required: true,
    },
    cloudinary_id: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: new Date(),
    },
    likes: {
      type: Array,
      default: [],
    },
    comment: {
      type: [Object],
    },
    // [
    //   {
    //     type: Types.ObjectId,
    //     ref: "Comment",
    //   },
    // ],
  },
  { timestamps: true }
);

const PostModel = model("Post", PostSchema);
module.exports = PostModel;
