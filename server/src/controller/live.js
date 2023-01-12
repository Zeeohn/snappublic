const Live = require("../models/LiveModel");
const cloudinary = require("../utils/cloudinary");

exports.startStream = async (req, res) => {
  try {
    const existingLiveStream = await Live.findOne({
      title: req.body.title,
      user: req.user._id,
    });

    if (existingLiveStream) {
      return res
        .status(400)
        .send({ err: "A live stream with this title already exists!" });
    }

    const result = await cloudinary.v2.uploader.create_streaming_profile(
      "rtmp_profile"
    );
    const rtmpUrl = result.secure_streaming_url;
    const streamKey = result.key;

    const liveStream = new Live({
      title: req.body.title,
      description: req.body.description,
      user: req.user._id,
      startTime: new Date(),
      rtmpUrl,
      streamKey,
    });

    await liveStream.save();
    res.send({
      title,
      description,
      user,
      startTime,
      rtmpUrl: rtmpUrl,
      streamKey: streamKey,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};

exports.endStream = async (req, res) => {
  try {
    const liveStream = await Live.findOne({ streamKey: req.body.streamKey });

    if (!liveStream) {
      return res.status(404).send({ err: "Live stream not found!" });
    }

    if (liveStream.endTime) {
      return res.status(400).send({ err: "Live Stream has already ended!" });
    }

    liveStream.endTime = new Date();
    await liveStream.save();

    res.send({ msg: "Live stream ended successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

exports.getLiveStreams = async (req, res) => {
  try {
    const liveStream = await Live.find({ endTime: { $exists: false } });
    res.send(liveStream);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};

exports.getSingleStream = async (req, res) => {
  try {
    const streamKey = req.params.streamKey;
    const liveStream = await Live.findOne({ streamKey: streamKey });

    res.send(liveStream);
  } catch (err) {
    res.status(500).send(err);
  }
};
