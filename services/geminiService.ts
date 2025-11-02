import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Calls the Gemini API to edit an image based on a prompt.
 * @param base64Image The base64-encoded image data, without the data URL prefix.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to the base64-encoded string of the edited image.
 */
export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  // The API key is expected to be available in the environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // Extract the image data from the response.
  // The response should contain a single part with the edited image.
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image data was found in the Gemini API response.");
};
