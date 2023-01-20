import { FileUpload } from "graphql-upload";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import sharp from "sharp";

export const uploadImage = async (
  imageFile: FileUpload,
  folder: string
): Promise<UploadApiResponse> => {
  //  compress image pipeline
  const pipeline = sharp().webp({ quality: 20 });
  return await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, tags: "product image" },
      (err, image) => {
        if (err) {
          console.warn(err);
          reject(err);
        }
        resolve(image as UploadApiResponse);
      }
    );
    imageFile
      .createReadStream()
      .pipe(pipeline)
      .pipe(uploadStream)
      .on("finish", () => {
        // finish
      })
      .on("error", () => {
        // error occured
      });
  });
};

export const uploadImages = async (
  images: FileUpload[],
  folder: string
): Promise<UploadApiResponse[]> => {
  const uploads: UploadApiResponse[] = [];
  for (let i = 0; i < images.length; i++) {
    const res = await uploadImage(images[i], folder);
    uploads.push(res);
  }
  return uploads;
};

export const updateImage = async (
  imageFile: FileUpload,
  publicId: string
): Promise<UploadApiResponse> => {
  return await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, invalidate: true },
      (err, image) => {
        if (err) {
          reject(err);
        }
        resolve(image as UploadApiResponse);
      }
    );
    imageFile
      .createReadStream()
      .pipe(uploadStream)
      .on("finish", () => {
        // finish
      })
      .on("error", () => {
        // error occured
      });
  });
};
