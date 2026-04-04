import { v2 as cloudinary } from "cloudinary";
import AppError from "./AppError.js";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    throw new AppError("File upload failed", 500);
  }
};
export const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
        if (error) reject(new AppError("File upload failed", 500));
        else resolve(result);
      })
      .end(buffer);
  });
};
export const deleteFromCloudinary = async(publicId) => {
  try{
    await cloudinary.uploader.destroy(publicId)
  }catch(error){
    throw new AppError("File Deletion Failed", 500)
  }
}