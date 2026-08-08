/**
 * Client-side image preparation for upload.
 *
 * Validates the selected file (type + size), then downscales it via canvas
 * so the longest edge is at most MAX_DIMENSION px, exporting a JPEG data URL.
 * This also has the side effect of normalizing formats the canvas can decode
 * but the API might not want raw (e.g. iOS Safari's HEIC photos get
 * transparently converted to JPEG when drawn through the canvas).
 */

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

const UNSUPPORTED_FORMAT_MESSAGE =
  "This image format isn't supported — please use a JPEG or PNG.";

/**
 * Validates and downscales an image file, returning a JPEG data URL
 * suitable for sending to the analysis API.
 *
 * @throws {Error} if the file isn't an image, exceeds the size limit, or
 * can't be decoded by the browser.
 */
export async function prepareImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPEG or PNG).");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `Image is too large (${sizeMb}MB). Please choose a file under 15MB.`
    );
  }

  const bitmap = await decodeImage(file);

  try {
    return downscaleToJpeg(bitmap);
  } finally {
    if (bitmap instanceof ImageBitmap) {
      bitmap.close();
    }
  }
}

type DecodedImage = ImageBitmap | HTMLImageElement;

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path below — some browsers support
      // createImageBitmap but still fail on certain formats (e.g. HEIC).
    }
  }

  return decodeViaImageElement(file);
}

function decodeViaImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(UNSUPPORTED_FORMAT_MESSAGE));
    };

    img.src = objectUrl;
  });
}

function getDimensions(image: DecodedImage): { width: number; height: number } {
  if (image instanceof ImageBitmap) {
    return { width: image.width, height: image.height };
  }
  return { width: image.naturalWidth, height: image.naturalHeight };
}

function downscaleToJpeg(image: DecodedImage): string {
  const { width, height } = getDimensions(image);

  if (!width || !height) {
    throw new Error(UNSUPPORTED_FORMAT_MESSAGE);
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(UNSUPPORTED_FORMAT_MESSAGE);
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
