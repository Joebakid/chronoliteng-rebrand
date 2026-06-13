// src/lib/config.js
export const appConfig = {
  adminEmail: process.env.NEXT_PUBLIC_MAIN_ADMIN_EMAIL || "josephbawo@gmail.com",
  cloudinaryName: process.env.NEXT_PUBLIC_CLOUDINARY_NAME,
  cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};