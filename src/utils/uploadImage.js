import { uploadImage as uploadImageV2 } from "../services/storageUpload";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file to upload (must be a File object)
 * @param {string} path - The full storage path (e.g., 'epinScreenshots/filename_timestamp')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export const uploadImage = async (file, path) => {
  return uploadImageV2(file, path);
};

/**
 * Uploads a payment screenshot and updates the epinRequests doc with screenshotUrl.
 * @param {File} file - The screenshot file
 * @param {string} requestId - The Firestore document ID for the E-PIN request
 */
export const uploadEpinScreenshot = async (file, requestId) => {
  throw new Error('uploadEpinScreenshot is deprecated. Use src/services/storageUpload.js from the current payment flows instead.');
};