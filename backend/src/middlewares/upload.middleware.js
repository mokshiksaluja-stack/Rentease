import multer from "multer";

// 1. Configure Memory Storage (hold file buffers in RAM temporarily)
const storage = multer.memoryStorage();

// 2. Configure File Type Filter (Only allow images and videos)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Image mime-types
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    // Video mime-types
    "video/mp4",
    "video/webm"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Approve file
  } else {
    cb(new Error("Unsupported file format. Only JPEG, PNG, WEBP images and MP4, WEBM videos are allowed."), false); // Reject file
  }
};

// 3. Instantiate Multer configurations
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit individual file size to 10MB (protect server RAM)
  }
});
