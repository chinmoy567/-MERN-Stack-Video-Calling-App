// Cloudinary configuration + upload helpers.
// Credentials come exclusively from environment variables — never hardcode them.
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

/**
 * Upload an in-memory image buffer to Cloudinary.
 * @param {Buffer} buffer file contents from multer memory storage
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadImageBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "profile_images",
        resource_type: "image",
        // Normalize output: cap dimensions, auto quality/format.
        transformation: [
          { width: 512, height: 512, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

/**
 * Delete an image by public_id. Failures are logged, never thrown —
 * a stale orphan in Cloudinary must not break the user request.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Cloudinary delete failed:", publicId, error.message);
  }
};

module.exports = { cloudinary, isConfigured, uploadImageBuffer, deleteImage };
