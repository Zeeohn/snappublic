const mongoose = require("mongoose");
const { Schema, model, models, Types } = mongoose;

const LiveSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: Date,
  endTime: Date,
  rtmpUrl: String,
  streamKey: String,
});

const LiveModel = model("Live", LiveSchema);
module.exports = LiveModel;
