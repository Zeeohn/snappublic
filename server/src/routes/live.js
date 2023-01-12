const { Router } = require("express");
const {
  startStream,
  endStream,
  getLiveStreams,
  getSingleStream,
} = require("../controller/live");

const streamRoute = Router();

streamRoute.post("/live/start", startStream);

streamRoute.post("/live/end", endStream);

streamRoute.get("/live/", getLiveStreams);

streamRoute.get("/live/:streamKey", getSingleStream);

module.exports = streamRoute;
