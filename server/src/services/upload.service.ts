import cloudinary from "../configs/cloudinary";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "uploads"
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
};