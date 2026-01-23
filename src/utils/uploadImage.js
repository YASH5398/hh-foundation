import { uploadImage as uploadImageV2 } from "../services/storageUpload";

/**
 * CENTRALIZED IMAGE UPLOAD UTILITY
 * Uses the new storageUpload service for consistent file handling
 */
export const uploadImage = async (file, path) => {
  return uploadImageV2(file, path);
};

/**
 * DEPRECATED: Use src/services/storageUpload.js instead
 * This function is kept for backward compatibility only
 */
export const uploadEpinScreenshot = async (file, requestId) => {
  throw new Error('uploadEpinScreenshot is deprecated. Use src/services/storageUpload.js from the current payment flows instead.');
};