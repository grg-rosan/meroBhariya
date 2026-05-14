import cloudinary from "../../config/cloudinary.config.js";
import AppError from "../error/appError.js";
import logger from "./logger.js";

export const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    logger.error("[Cloudinary Error]", error.message, error.http_code);
    throw new AppError("File upload failed", 500);
  }
};
export const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
        if (error) {
          logger.error({ err: error }, "[Cloudinary] Buffer upload failed");
          reject(new AppError("File upload failed", 500));
        }
        else resolve(result);
      })
      .end(buffer);
  });
};
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
      throw new AppError(`Cloudinary deletion failed: ${result.result}`, 500);
    }
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("File Deletion Failed", 500);
  }
};