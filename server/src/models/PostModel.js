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
    shares: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    comment: {
      type: [Object],
    },
  },
  { timestamps: true }
);

PostSchema.post("save", async function () {
  await this.constructor.collection.createIndex({
    caption: "text",
    catalog: "text",
  });
});

const PostModel = model("Post", PostSchema);
module.exports = PostModel;
