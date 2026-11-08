export interface FaceAnalysisResult {
  score: number;
  honesty: number;
  reliability: number;
  explanation: string;
}

const convertToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
  });
};

const MAX_DIMENSION = 2048; // the server downsizes to 2048px anyway

/**
 * Re-encodes the photo as a JPEG no larger than 2048px so phone photos, WebP
 * and HEIC-converted images fit the server's accepted formats (JPEG/PNG) and
 * its 3 MB size cap. Falls back to the original file if the browser cannot
 * decode it.
 */
const normalizeImage = async (file: File): Promise<File | Blob> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } catch {
    return file;
  }
};

/**
 * Uploads an image file to the analyze-face API and returns trust scores.
 */
export const analyzeFace = async (imageFile: File): Promise<FaceAnalysisResult> => {
  const base64Image = await convertToBase64(await normalizeImage(imageFile));

  const response = await fetch("/api/analyze-face", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data || typeof data.score !== "number") {
    throw new Error("Invalid response format from analysis service");
  }

  return {
    score: data.score,
    honesty: data.honesty,
    reliability: data.reliability,
    explanation: data.explanation,
  };
};
