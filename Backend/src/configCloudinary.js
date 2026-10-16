const multer = require('multer');

// In-memory multer storage to avoid external Cloudinary dependency
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;