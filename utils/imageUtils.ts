
/**
 * Fetches an image from a URL and converts it to a base64 string.
 * NOTE: This may fail if the image server has restrictive CORS policies.
 * In a production environment, it's often better to handle this server-side or via a CORS proxy.
 * @param imageUrl The URL of the image to convert.
 * @returns A promise that resolves to an object containing the base64 string and its mimeType.
 */
export const urlToBase64 = async (
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> => {
  try {
    // Use a CORS proxy to bypass potential browser restrictions on fetching images from other domains.
    // This is a common technique for client-side applications.
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const response = await fetch(proxyUrl + imageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // result is "data:image/jpeg;base64,...."
        // We only need the part after the comma
        const base64 = result.split(',')[1];
        if (!base64) {
            reject(new Error("Failed to extract base64 string from data URL."));
            return;
        }
        resolve({ base64, mimeType });
      };
      reader.onerror = (error) => {
        reject(new Error("Failed to convert blob to base64: " + error));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching or converting image:", error);
    throw new Error(
      "Could not fetch the selected image. The server may be blocking requests (CORS issue). This demo uses a proxy; if it fails, the proxy may be down."
    );
  }
};

/**
 * Calculates the dimensions of an image from its base64 representation.
 * @param base64 The base64 string of the image.
 * @param mimeType The MIME type of the image (e.g., 'image/png'). Defaults to 'image/png'.
 * @returns A promise that resolves to an object with the image's width and height.
 */
export const getImageDimensions = async (
  base64: string,
  mimeType: string = 'image/png'
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image to determine dimensions. The base64 data may be corrupt."));
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
};

/**
 * Resizes an image from a base64 string to target dimensions using a canvas.
 * It uses a "letterbox" (contain) approach, fitting the entire image within the
 * new dimensions while maintaining aspect ratio. The empty space is filled
 * with the background color sampled from the top-left corner of the source image.
 * @param base64 The base64 string of the source image.
 * @param targetWidth The desired output width.
 * @param targetHeight The desired output height.
 * @param mimeType The MIME type of the image. Defaults to 'image/png'.
 * @returns A promise that resolves to the data URL of the resized image.
 */
export const resizeImageBase64 = (
  base64: string,
  targetWidth: number,
  targetHeight: number,
  mimeType: string = 'image/png'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Main canvas for the final output
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas 2D context.'));
      }
      
      // Create a temporary canvas to sample the pixel color from the original image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
          return reject(new Error('Could not get temporary canvas context for color sampling.'));
      }
      
      // Draw the original image onto the temp canvas to read its pixel data
      tempCtx.drawImage(img, 0, 0);
      
      // Get the color of the top-left pixel to use as the background fill
      const pixelData = tempCtx.getImageData(0, 0, 1, 1).data;
      const backgroundColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
      
      // Fill the main canvas with the sampled background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Set high quality interpolation for the scaled image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      const sourceAspectRatio = img.width / img.height;
      const targetAspectRatio = targetWidth / targetHeight;

      let drawWidth: number, drawHeight: number, x: number, y: number;
      
      // "Contain" (letterbox) logic: scale the image to fit within the canvas
      if (sourceAspectRatio > targetAspectRatio) {
        // Source is wider than target -> fit to width
        drawWidth = targetWidth;
        drawHeight = drawWidth / sourceAspectRatio;
        x = 0;
        y = (targetHeight - drawHeight) / 2; // Center vertically
      } else {
        // Source is taller or same as target -> fit to height
        drawHeight = targetHeight;
        drawWidth = drawHeight * sourceAspectRatio;
        x = (targetWidth - drawWidth) / 2; // Center horizontally
        y = 0;
      }
      
      // Draw the scaled image on top of the solid background
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      
      resolve(canvas.toDataURL(mimeType));
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image for resizing.`));
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
};