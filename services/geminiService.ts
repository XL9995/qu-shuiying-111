import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { VideoResolution, VideoAspectRatio } from "../types";

/**
 * Helper to convert a Blob/File to Base64 string (without data: prefix for some uses, with for others)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix for raw base64 operations if needed, 
      // but Gemini usually handles standard base64 extraction logic or we pass strict base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Service for handling Gemini API calls
 */
class GeminiService {
  private getClient(apiKey?: string) {
    // If a specific key is passed (e.g. from Veo selection), use it. 
    // Otherwise default to process.env.API_KEY
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Removes watermarks from an image using gemini-2.5-flash-image
   */
  async removeWatermarkImage(base64Image: string, mimeType: string): Promise<string> {
    const ai = this.getClient();
    
    const model = "gemini-2.5-flash-image";
    
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            text: "Remove any watermarks, logos, text, or date stamps overlaying this image. Reconstruct the background behind the removed elements seamlessly to look like the original scene. High quality, photorealistic result.",
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ]
      }
    });

    // Extract the image from the response
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image generated in response");
  }

  /**
   * Generates/Reconstructs a clean video based on a reference image
   * Note: Requires Paid API Key via aistudio
   */
  async reconstructVideo(
    apiKey: string, 
    referenceImageBase64: string, 
    mimeType: string,
    prompt: string,
    resolution: VideoResolution = '720p',
    aspectRatio: VideoAspectRatio = '16:9'
  ): Promise<string> {
    const ai = this.getClient(apiKey);
    const model = "veo-3.1-generate-preview"; // Supports reference images

    // Create reference image payload
    const referenceImagesPayload = [
      {
        image: {
          imageBytes: referenceImageBase64,
          mimeType: mimeType,
        },
        referenceType: VideoGenerationReferenceType.ASSET, // Treat as asset to base the video on
      }
    ];

    let operation = await ai.models.generateVideos({
      model,
      prompt: `Cinematic video based on this image. ${prompt}. High quality, clean, no watermarks, no text overlays.`,
      config: {
        numberOfVideos: 1,
        referenceImages: referenceImagesPayload,
        resolution: resolution,
        aspectRatio: aspectRatio
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      throw new Error(operation.error.message);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("No video URI returned");
    }

    // Fetch the actual video bytes
    const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
    if (!videoResponse.ok) {
      throw new Error("Failed to download generated video");
    }
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  }
}

export const geminiService = new GeminiService();