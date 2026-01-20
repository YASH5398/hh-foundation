import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../config/firebase';

/**
 * Centralized Firebase Storage Service
 * Handles all file uploads with proper authentication and path structure
 */
class FirebaseStorageService {
  /**
   * Ensures user is authenticated before any storage operation
   * @throws {Error} If user is not authenticated
   */
  _requireAuth() {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to perform storage operations');
    }
    return auth.currentUser;
  }

  /**
   * Sanitizes filename to prevent path traversal and invalid characters
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  _sanitizeFilename(filename) {
    if (!filename) return 'upload';
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Uploads E-PIN screenshot with proper path structure
   * @param {File} file - File to upload
   * @param {string} userId - User ID (optional, will use current user if not provided)
   * @returns {Promise<string>} Download URL
   */
  async uploadEPinScreenshot(file, userId = null) {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    const user = this._requireAuth();
    const targetUserId = userId || user.uid;
    
    try {
      // Create proper path: epin-screenshots/{userId}/{filename}
      const sanitizedFilename = this._sanitizeFilename(file.name);
      const timestamp = Date.now();
      const filename = `${timestamp}_${sanitizedFilename}`;
      const storagePath = `epin-screenshots/${targetUserId}/${filename}`;
      
      console.log('Uploading E-PIN screenshot:', {
        path: storagePath,
        fileSize: file.size,
        fileType: file.type,
        userId: targetUserId
      });

      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Upload file using uploadBytes
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload completed:', uploadResult.metadata.fullPath);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL generated:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading E-PIN screenshot:', {
        error: error.message,
        code: error.code,
        userId: targetUserId,
        fileName: file.name,
        fileSize: file.size
      });
      
      // Provide user-friendly error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to upload files. Please check your authentication.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please contact support.');
      } else if (error.code === 'storage/invalid-format') {
        throw new Error('Invalid file format. Please upload a valid image file.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Uploads E-PIN QR image with proper path structure
   * @param {File} file - QR image file to upload
   * @param {string} userId - User ID (optional, will use current user if not provided)
   * @returns {Promise<string>} Download URL
   */
  async uploadFile(file, path) {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    this._requireAuth();
    
    try {
      const storageRef = ref(storage, path);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('File uploaded successfully:', {
        path: uploadResult.metadata.fullPath,
        downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', {
        error: error.message,
        code: error.code,
        path
      });
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Gets download URL for existing file
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  async getDownloadURL(path) {
    this._requireAuth();
    
    try {
      const storageRef = ref(storage, path);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error getting download URL:', {
        error: error.message,
        code: error.code,
        path
      });
      throw new Error(`Failed to get download URL: ${error.message}`);
    }
  }

  /**
   * Deletes file from storage
   * @param {string} path - Storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    this._requireAuth();
    
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log('File deleted successfully:', path);
    } catch (error) {
      console.error('Error deleting file:', {
        error: error.message,
        code: error.code,
        path
      });
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Validates file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {boolean} True if valid
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return true;
  }
}

// Export singleton instance
export const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService;