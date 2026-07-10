const BE_URL = import.meta.env.VITE_API_BE_URL;

// Profile images are either full Cloudinary URLs (new) or legacy
// backend-relative paths like "images/xyz.png".
export const resolveAvatar = (image) => {
  if (!image) return "";
  return /^https?:\/\//i.test(image) ? image : `${BE_URL}${image}`;
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// Returns an error message, or null if the file is a valid profile image.
export const validateImageFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, JPEG, PNG and WEBP images are allowed.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image is too large. Maximum size is 5 MB.";
  }
  return null;
};
