import { v2 as cloudinary } from 'cloudinary';
import { env } from '../configs/env'; // تأكد إن مسار الـ env صحيح عندك

// إعداد الاتصال بخدمة Cloudinary
cloudinary.config({
  cloud_name: env.cloudinaryName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export const uploadService = {
  /**
   * دالة لرفع الصورة للسحابة وإرجاع رابطها (URL)
   * @param fileBuffer - الصورة وهي على شكل Buffer (تجي من multer)
   * @param folderName - اسم المجلد في السحابة (مثلاً: 'avatars' أو 'meals')
   */
  async uploadImage(fileBuffer: Buffer, folderName: string = 'njerka_general'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderName },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new Error('Failed to upload image'));
          }
          if (!result) {
            return reject(new Error('No result from Cloudinary'));
          }
          // نرجع الرابط الآمن للصورة عشان تحفظه في الداتا بيس
          resolve(result.secure_url);
        }
      );

      // تمرير الملف للسحابة
      uploadStream.end(fileBuffer);
    });
  },

  /**
   * دالة لحذف الصورة من السحابة (مفيدة لو اليوزر غير صورته وتبي تحذف القديمة)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // استخراج الـ public_id من الرابط عشان نحذفه
      const urlParts = imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const publicId = `${folder}/${publicIdWithExtension.split('.')[0]}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary Delete Error:', error);
    }
  }
};