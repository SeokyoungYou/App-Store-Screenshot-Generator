import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a headline and sub-headline from a feature description.
 * @param featureDescription The user-provided text about the app feature.
 * @returns An object with headline and subheadline strings.
 */
export const generateTextOverlays = async (
  featureDescription: string
): Promise<{ headline: string; subheadline: string }> => {
  
  const prompt = `
    You are an expert App Store marketing copywriter. Based on the following feature description, 
    create a concise and compelling headline and sub-headline for an app screenshot.

    The headline should be short and punchy (maximum 5 words).
    The sub-headline should briefly elaborate on the feature's key benefit (maximum 10 words).

    Feature Description: "${featureDescription}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: {
            type: Type.STRING,
            description: "A short, punchy headline (max 5 words)."
          },
          subheadline: {
            type: Type.STRING,
            description: "A brief sub-headline elaborating on the benefit (max 10 words)."
          }
        },
        required: ["headline", "subheadline"]
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return {
        headline: parsed.headline || '',
        subheadline: parsed.subheadline || '',
    };
  } catch(e) {
    console.error("Failed to parse JSON response from Gemini:", response.text);
    throw new Error("The AI returned an invalid response. Please try rephrasing your description.");
  }
};


export const generateScreenshot = async (
  base64Image: string,
  mimeType: string,
  headline: string,
  subheadline: string,
  appFeatures: string,
  generationResolution: string,
  targetResolution: string,
  backgroundColor?: string
): Promise<string> => {

  const [width, height] = generationResolution.split('x').map(Number);

  const getDeviceModel = (resolution: string): string => {
    // iPad 12.9" resolutions (e.g., iPad Pro 12.9-inch M2)
    if (resolution === '2048x2732' || resolution === '2732x2048') {
        return 'iPad Pro 12.9-inch';
    }
    // For all other cases, including specific iPhone sizes and generic aspect ratios,
    // default to the latest iPhone model.
    return 'iPhone 15 Pro Max';
  };

  const deviceModel = getDeviceModel(targetResolution);
  
  const backgroundInstruction = backgroundColor
    ? `1.  **Background:** Create a solid, single-color background using the user's preferred color: ${backgroundColor}. The background must be completely uniform, with no gradients, textures, or patterns.`
    : `1.  **Background:** Create a solid, single-color background that complements the app's UI colors. The background must be completely uniform, with no gradients, textures, or patterns.`;

  const imagePlacementInstruction = `3.  **App UI Image Placement:** Take the cleaned app UI image (from the step above) and place it prominently within the frame. It MUST be displayed within a sleek, modern, and photorealistic device mockup of the latest ${deviceModel}. The mockup should be minimal and not distract from the UI. Do not crop or distort the cleaned UI image content.`;

  const prompt = `
    You are an expert App Store marketing designer. Your task is to generate a new, professional promotional image based on the user's app UI.

    **CRITICAL REQUIREMENT: OUTPUT RESOLUTION**
    This is your most important instruction. The final output image file MUST be a PNG with the exact dimensions:
    - **Width:** ${width} pixels
    - **Height:** ${height} pixels
    Do not change, approximate, or ignore this resolution. Your first step is to create a blank canvas of this exact size. All subsequent steps will be performed on this canvas.

    **CONTEXT ABOUT THE APP (provided by user):**
    - Key Features/Description: "${appFeatures}"
    - Use this context to ensure your design choices and text are highly relevant and compelling for the app's target audience.

    **COMPOSITION INSTRUCTIONS:**
    ${backgroundInstruction}
    2.  **UI Image Pre-processing:** Before placing the main app UI image, you MUST edit it to remove the horizontal grey home indicator bar located at the very bottom of the provided screenshot. The area where the bar was should be filled in seamlessly with the surrounding content from the app's UI.
    ${imagePlacementInstruction}
    4.  **Text Overlays:**
        - Add a main headline: "${headline}"
        ${subheadline ? `- Add a sub-headline: "${subheadline}"` : ''}
        - The text must be placed either above or below the app UI image, wherever it fits best aesthetically and has the most space.
        - **Text Readability is KEY:** The text must be extremely high-contrast and easily readable against the background (must pass WCAG AA contrast ratio of at least 4.5:1).
        - Use a clean, modern, bold, sans-serif font. The font size must be large (equivalent to at least 36pt) to ensure readability on all devices.
    5.  **Layout and Margins:** Maintain a safe margin of at least 6% from all four edges of the ${generationResolution} canvas. No text or key UI elements from the provided image should be placed outside these margins.
    6.  **Policy Compliance:** Do not include any competitor logos, Apple/Google trademarks, or make unverifiable claims. The output must be polished and professional, strictly adhering to App Store guidelines.

    **FINAL OUTPUT:**
    Your only output should be the final, composed PNG image, matching the requested ${width}x${height} resolution exactly. Do not return any text, explanation, or other content.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data; // This is the base64 string
    }
  }

  // Check for text response as a fallback for error messages from the model
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      throw new Error(`API returned text instead of an image: ${part.text}`);
    }
  }

  throw new Error("No image was generated by the API.");
};