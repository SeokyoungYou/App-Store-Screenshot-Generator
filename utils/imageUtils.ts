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
