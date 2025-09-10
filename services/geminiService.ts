import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Purpose = 'app-store' | 'social-media' | 'og-image' | 'custom' | 'promo-video';

/**
 * Generates text overlays based on the specified purpose.
 * @param featureDescription The user-provided text about the app feature.
 * @param purpose The intended use case for the generated content.
 * @param socialPlatform The specific social media platform, if applicable.
 * @param language The target language for the generated text.
 * @returns An object with headline, subheadline, and optional caption/hashtags.
 */
export const generateTextOverlays = async (
  featureDescription: string,
  purpose: Purpose,
  socialPlatform?: string,
  language: string = 'English'
): Promise<{ headline: string; subheadline: string; caption?: string; hashtags?: string }> => {
  
  let prompt: string;
  let responseSchema: any;

  if (purpose === 'social-media') {
    let platformContext = "for a generic social media post. Generate a few relevant hashtags.";

    switch (socialPlatform) {
      case 'instagram-post':
        platformContext = "for an Instagram feed post. Generate 5-10 relevant, popular hashtags.";
        break;
      case 'instagram-story':
        platformContext = "for an Instagram Story. The text should be very concise and punchy. Generate 2-3 relevant hashtags that could be used as interactive stickers.";
        break;
      case 'x-threads':
        platformContext = "for a post on X (formerly Twitter) or Threads. The caption should be concise, ideally under 280 characters for X compatibility. Generate 2-3 highly relevant hashtags for use on X.";
        break;
    }

    prompt = `
      Based on the following app feature, you will generate two types of content in ${language}.

      1.  **For the Image Overlay:** As a marketing expert, write a concise, compelling headline (max 5 words) and sub-headline (max 10 words). This text will be placed directly on the promotional image.

      2.  **For the Social Media Post Caption:** Switch personas. Write a post caption from the perspective of a satisfied user who has just discovered this feature. The tone should be authentic and sound like a genuine user testimonial or review, not like an advertisement. It should be positive but natural and not overly exaggerated. After the caption, generate relevant hashtags. ${platformContext}

      Feature Description: "${featureDescription}"
    `;
    responseSchema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING, description: "A short, punchy headline for the image (max 5 words)." },
            subheadline: { type: Type.STRING, description: "A brief sub-headline for the image (max 10 words)." },
            caption: { type: Type.STRING, description: "An engaging post caption for Instagram, X, or Threads." },
            hashtags: { type: Type.STRING, description: "A string of relevant, space-separated, all-lowercase hashtags (e.g., #app #design #newfeature)." }
        },
        required: ["headline", "subheadline", "caption", "hashtags"]
    };
  } else {
    // Default for App Store, OG Image, Custom
    prompt = `
      You are an expert App Store marketing copywriter. Based on the following feature description, 
      create a concise and compelling headline and sub-headline for a promotional image.

      The headline should be short and punchy (maximum 5 words).
      The sub-headline should briefly elaborate on the feature's key benefit (maximum 10 words).

      **CRITICAL:** The entire output must be in ${language}.

      Feature Description: "${featureDescription}"
    `;
    responseSchema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING, description: "A short, punchy headline (max 5 words)." },
            subheadline: { type: Type.STRING, description: "A brief sub-headline elaborating on the benefit (max 10 words)." }
        },
        required: ["headline", "subheadline"]
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return {
        headline: parsed.headline || '',
        subheadline: parsed.subheadline || '',
        caption: parsed.caption,
        hashtags: parsed.hashtags ? parsed.hashtags.toLowerCase() : undefined,
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
  backgroundColor: string | undefined,
  purpose: Purpose
): Promise<string> => {

  const [width, height] = generationResolution.split('x').map(Number);
  const [targetWidth, targetHeight] = targetResolution.split('x').map(Number);
  const aspectRatio = targetWidth / targetHeight;


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
  
  let compositionInstructions: string;

  // Dynamically choose layout instructions based on the target aspect ratio.
  // This ensures optimal composition for landscape, portrait, and square images.
  if (aspectRatio > 1.1) {
    // ** Landscape Layout (e.g., OG Images, wide social posts) **
    compositionInstructions = `
      **TASK RE-DEFINITION: You are creating a wide, horizontal promotional banner for a website or social media, NOT a vertical app store screenshot.**
      
      **COMPOSITION INSTRUCTIONS (for WIDE LANDSCAPE Aspect Ratio):**
      
      **CRITICAL CANVAS SHAPE:**
      - The final image's shape is **LANDSCAPE (HORIZONTAL)**. It is **wider than it is tall**.
      - You MUST create a canvas with the exact ${width}x${height} pixel dimensions.
      - **ABSOLUTELY DO NOT create a portrait (vertical) image.** All instructions are for this **wide, horizontal banner format.**

      ${backgroundInstruction}

      2.  **UI Image Pre-processing:** Before placing the main app UI image, you MUST edit it to remove the horizontal grey home indicator bar located at the very bottom of the provided screenshot. The area where the bar was should be filled in seamlessly with the surrounding content from the app's UI.

      3.  **Layout Strategy for a WIDE BANNER:** Create a balanced **horizontal** composition on the **wide canvas**.
          - **Device Placement:** Place the device mockup on the **right side** of the canvas, occupying roughly 40-50% of the canvas width. It must be vertically centered.
          - **Text Placement:** Place the text block on the **left side** of the canvas in the remaining empty space. It must also be vertically centered as a block.

      4.  **App UI Image Placement:** Place the cleaned app UI image prominently within a sleek, modern, and photorealistic device mockup of the latest ${deviceModel}. The mockup should be minimal and not distract from the UI.

      5.  **Text Overlays:**
          - **Content:**
            - Headline: "${headline}"
            ${subheadline ? `- Sub-headline: "${subheadline}"` : ''}
          - **Placement:** Position the text on the **left side**, as defined in the layout strategy.
          - **Alignment:** CRITICAL - The text block (both headline and sub-headline) must be **left-aligned**.
          - **Readability is KEY:** The text must be extremely high-contrast and easily readable against the background (must pass WCAG AA contrast ratio of at least 4.5:1).
          - **Typography:** CRITICAL - Use the **Helvetica** font family. If Helvetica is unavailable, use a visually identical, clean, modern, geometric sans-serif font like Arial. The headline should be significantly larger and use a **Bold** or **Heavy** weight. The sub-headline should be smaller and use a **Regular** or **Medium** weight. This creates a clear visual hierarchy. Font sizes must be large enough to be legible even when the image is viewed at a small size in a link preview.
    `;
  } else { 
    // ** Portrait & Square Layout (e.g., App Store, Social Media Posts) **
      compositionInstructions = `
      **COMPOSITION INSTRUCTIONS (for Portrait/Square Aspect Ratio):**
      **CRITICAL CANVAS SHAPE:** The final image's shape is **portrait (vertical) or square**. This means it is **taller than it is wide, or its sides are equal**. You MUST create a canvas with the exact ${width}x${height} pixel dimensions. All following layout instructions are for this tall or square canvas.
      ${backgroundInstruction}
      2.  **UI Image Pre-processing:** Before placing the main app UI image, you MUST edit it to remove the horizontal grey home indicator bar located at the very bottom of the provided screenshot. The area where the bar was should be filled in seamlessly with the surrounding content from the app's UI.
      3.  **Layout Strategy - VERY IMPORTANT:** Create a visually balanced **vertical** composition.
          - **Text Placement:** The text block MUST be placed **ABOVE** the device mockup.
          - **Device Placement:** The device mockup MUST be placed **BELOW** the text block.
          - **Grouping:** Position the text block and the device mockup close together in the vertical center of the canvas to form a single, focused element.
          - **Alignment:** The text block (both headline and sub-headline) and the device mockup must be horizontally centered on the canvas.
      4.  **App UI Image Placement:** Following the layout strategy, place the cleaned app UI image prominently within the frame. It MUST be displayed within a sleek, modern, and photorealistic device mockup of the latest ${deviceModel}. The mockup should be minimal and not distract from the UI. Do not crop or distort the cleaned UI image content.
      5.  **Text Overlays:**
          - **Content:**
            - Headline: "${headline}"
            ${subheadline ? `- Sub-headline: "${subheadline}"` : ''}
          - **Placement:** Position the text **ABOVE** the device, as defined in the layout strategy.
          - **Alignment:** CRITICAL - Both the headline and sub-headline must be **center-aligned** horizontally. Do not left-align or right-align the text.
          - **Readability is KEY:** The text must be extremely high-contrast and easily readable against the background (must pass WCAG AA contrast ratio of at least 4.5:1).
          - **Typography:** CRITICAL - Use the **Helvetica** font family. If Helvetica is unavailable, use a visually identical, clean, modern, geometric sans-serif font like Arial. The headline should be significantly larger and use a **Bold** or **Heavy** weight. The sub-headline should be smaller and use a **Regular** or **Medium** weight. This creates a clear visual hierarchy. Ensure font sizes are large enough for clear readability.
      `;
  }

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

    ${compositionInstructions}

    6.  **Layout and Margins:** Maintain a safe margin of at least 6% from all four edges of the ${generationResolution} canvas. No text or key UI elements from the provided image should be placed outside these margins.
    7.  **Policy Compliance:** Do not include any competitor logos, Apple/Google trademarks, or make unverifiable claims. The output must be polished and professional, strictly adhering to App Store guidelines.

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


/**
 * Generates a promotional video using the VEO model.
 * @param base64Image The base64 encoded string of the source app screenshot.
 * @param mimeType The MIME type of the source image.
 * @param onProgress A callback function to report progress messages to the UI.
 * @returns A promise that resolves to the downloadable URI of the generated video.
 */
export const generatePromotionalVideo = async (
  base64Image: string,
  mimeType: string,
  onProgress: (message: string) => void
): Promise<string> => {
  onProgress("Sending request to the video model...");
  
  const finalPrompt = `
    Animate the device shown in the provided static promotional image. The goal is to create a short, premium video that animates ONLY the device itself.

    **CRITICAL ANIMATION INSTRUCTION (READ CAREFULLY):**
    The ONLY motion permitted in the entire video is a smooth, continuous, 360-degree rotation of the device mockup in a single direction.
    
    1.  **Movement Type:** The device must rotate smoothly around its central vertical axis for one full 360-degree turn. It should be a one-way rotation, not back and forth.
    2.  **Speed:** The rotation speed must be **slow and elegant**. The primary focus should be the app UI on the screen, not the device's motion. The full 360-degree rotation should take several seconds to complete, allowing the viewer to clearly see the details on the screen.
    3.  **Smoothness:** The animation must be fluid and continuous without any jitter or sudden stops.

    **VIDEO FORMAT:** The final video output must have a **portrait aspect ratio of 9:16**. It must be taller than it is wide.

    **STRICT CONSTRAINTS (DO NOT DEVIATE):**
    - **No Extra Animations:** Absolutely no other animations are allowed. The UI on the screen, the background, and all text overlays from the original image must remain completely static and motionless.
    - **No Camera Movement:** DO NOT zoom in, zoom out, pan, or tilt the camera. The camera's position is fixed.
    - **No Added Content:** DO NOT generate any new text, logos, or images. The video must only contain the elements from the user-provided image.
    - **Realistic Device Back:** As the device completes its rotation, its back and sides will become fully visible. You MUST render these parts as a realistic, unbranded smartphone back (e.g., a matte glass or metal finish). **CRITICAL:** DO NOT show another app screenshot, a pattern, or a mirrored version of the front on the back of the device. It must look like the physical back of a modern phone.
  `;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: finalPrompt,
    image: {
      imageBytes: base64Image,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
    }
  });

  onProgress("Your video is being processed. This can take a few minutes...");

  const pollInterval = 10000; // 10 seconds
  let checks = 0;

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    checks++;
    onProgress(`Checking generation status... (Attempt ${checks})`);
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  onProgress("Finalizing your video...");

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation completed, but no download link was found.");
  }

  return downloadLink;
};