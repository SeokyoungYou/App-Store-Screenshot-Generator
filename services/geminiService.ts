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
  resolution: string,
  backgroundColor?: string
): Promise<string> => {

  const [width, height] = resolution.split('x').map(Number);

  const getDeviceModel = (resolution: string): string => {
    // iPhone 6.9" resolutions (e.g., 15 Pro Max)
    if (resolution.startsWith('1290x2796') || resolution.startsWith('1320x2868') || resolution.startsWith('2796x1290') || resolution.startsWith('2868x1320')) {
        return 'iPhone 15 Pro Max';
    }
    // iPad 13" resolutions (e.g., iPad Pro 13-inch M4)
    if (resolution.startsWith('2064x2752') || resolution.startsWith('2048x2732')) {
        return 'iPad Pro 13-inch (M4)';
    }
    return 'latest high-end smartphone'; // A safe fallback
  };

  const deviceModel = getDeviceModel(resolution);
  
  const backgroundInstruction = backgroundColor
    ? `1.  **Background:** Create a new, premium, elegant, and minimal gradient background. The gradient MUST be based on the user's preferred color: ${backgroundColor}. Use this color as the primary theme for the gradient, blending it with complementary and harmonious shades (like lighter/darker tints or analogous colors) to create a visually stunning, non-distracting background suitable for an App Store screenshot.`
    : `1.  **Background:** Create a new, premium, elegant, and minimal gradient background that complements the app's UI colors. Use a subtle, modern color palette. The background must be clean and not distract from the UI or text.`;

  const imagePlacementInstruction = `3.  **App UI Image Placement:** Take the cleaned app UI image (from the step above) and place it prominently within the frame. It MUST be displayed within a sleek, modern, and photorealistic device mockup of the latest ${deviceModel}. The mockup should be minimal and not distract from the UI. Do not crop or distort the cleaned UI image content.`;

  const prompt = `
    You are an expert App Store marketing designer. Your task is to take the provided existing App Store screenshot and radically improve it into a professional and visually appealing promotional image.

    **CONTEXT ABOUT THE APP (provided by user):**
    - Key Features/Description: "${appFeatures}"
    - Use this context to ensure your design choices and text are highly relevant and compelling for the app's target audience.

    **CRITICAL OUTPUT SPECIFICATIONS (NON-NEGOTIABLE):**
    - **Resolution:** The final output image file MUST have the exact dimensions of ${resolution} pixels (${width}px width by ${height}px height). This is the most critical requirement. Do not approximate or change the resolution.
    - **Format:** PNG

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
    5.  **Layout and Margins:** Maintain a safe margin of at least 6% from all four edges of the ${resolution} canvas. No text or key UI elements from the provided image should be placed outside these margins.
    6.  **Policy Compliance:** Do not include any competitor logos, Apple/Google trademarks, or make unverifiable claims. The output must be polished and professional, strictly adhering to App Store guidelines.

    **FINAL OUTPUT:**
    Your only output should be the final, composed PNG image, matching the requested resolution exactly. Do not return any text, explanation, or other content.
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