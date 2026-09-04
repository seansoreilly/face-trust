export interface FaceAnalysisResult {
  score: number;
  honesty: number;
  reliability: number;
  explanation: string;
}

const convertToBase64 = (file: File): Promise<string> => {
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

/**
 * Uploads an image file to the analyze-face API and returns trust scores.
 */
export const analyzeFace = async (imageFile: File): Promise<FaceAnalysisResult> => {
  const base64Image = await convertToBase64(imageFile);

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
