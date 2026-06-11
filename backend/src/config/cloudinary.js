import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// 1. Configure Cloudinary SDK using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer directly to Cloudinary using readable streams.
 * Eliminates the need to write temporary files to disk.
 * 
 * @param {Buffer} fileBuffer - Raw binary file buffer
 * @param {string} folder - Destination folder in Cloudinary (e.g. 'rentease/properties')
 * @param {string} resourceType - 'image' | 'video' | 'auto'
 * @returns {Promise<Object>} - Resolves with Cloudinary upload response containing URL
 */
export const uploadToCloudinary = (fileBuffer, folder = "rentease/properties", resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    // FALLBACK MOCK CHECK:
    // If credentials are left as placeholders, we bypass Cloudinary 
    // and return mock Unsplash images to keep the application fully functional for testing
    if (
      !process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_API_SECRET === "your_cloudinary_secret_key"
    ) {
      console.warn("⚠️ [Cloudinary config]: Placeholder credentials detected. Simulating file upload...");
      setTimeout(() => {
        // Return a premium mock image or video URL
        const mockUrl = resourceType === "video" 
          ? "https://res.cloudinary.com/demo/video/upload/dog.mp4"
          : `https://images.unsplash.com/photo-${Date.now() % 2 === 0 ? "1564013799919-ab600027ffc6" : "1580587771525-78b9dba3b914"}?auto=format&fit=crop&w=800&q=80`;
        resolve({ secure_url: mockUrl });
      }, 500);
      return;
    }

    // Standard stream pipeline upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) {
          console.error("💥 [Cloudinary Stream Upload Error]:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    // Create a readable stream from the buffer and pipe it to the Cloudinary upload stream
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null); // Signals the end of the stream
    readableStream.pipe(uploadStream);
  });
};

export default cloudinary;
