const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, done) => {
    let ext = path.extname(file.originalname);

    if (
      ext !== ".jpg" &&
      ext !== ".png" &&
      ext !== ".jpeg" &&
      ext !== ".tiff" &&
      ext !== ".svg" &&
      ext !== ".gif" &&
      ext !== ".mp4" &&
      ext !== ".m4a" &&
      ext !== ".3gp"
    ) {
      done(new Error("File type is not supported!"), false);
      return;
    }
    done(null, true);
  },
});
