import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Firebase Storage Service for handling image uploads
 * Provides reusable functions for uploading images with progress tracking and error handling
 */
class StorageService {
  /**
   * Upload an image file to Firebase Storage
   * @param {File} file - The image file to upload
   * @param {string} folder - The storage folder path (e.g., 'payment-proofs', 'epin-screenshots')
   * @param {Function} onProgress - Callback function for upload progress (optional)
   * @returns {Promise<string>} - Returns the download URL of the uploaded image
   */
  async uploadImage(file, folder = 'uploads', onProgress = null) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file
        if (!file) {
          reject(new Error('No file provided'));
          return;
        }

        // Check file size (3MB limit)
        const maxSize = 3 * 1024 * 1024; // 3MB
        if (file.size > maxSize) {
          reject(new Error('File size exceeds 3MB limit'));
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          reject(new Error('File must be an image'));
          return;
        }

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${timestamp}_${sanitizedName}`;
        const storageRef = ref(storage, `${folder}/${fileName}`);

        console.log('🔄 Starting upload to Firebase Storage:', fileName);

        // Create upload task with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Track upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const roundedProgress = Math.round(progress);
            console.log(`📊 Upload progress: ${roundedProgress}%`);
            
            // Call progress callback if provided
            if (onProgress && typeof onProgress === 'function') {
              onProgress(roundedProgress);
            }
          },
          (error) => {
            console.error('❌ Upload failed:', error);
            
            // Provide specific error messages
            let errorMessage = 'Upload failed';
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'Permission denied. Please check storage rules.';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload was canceled.';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Storage quota exceeded.';
                break;
              case 'storage/invalid-format':
                errorMessage = 'Invalid file format.';
                break;
              case 'storage/invalid-event-name':
                errorMessage = 'Invalid event name.';
                break;
              case 'storage/invalid-url':
                errorMessage = 'Invalid URL.';
                break;
              case 'storage/invalid-argument':
                errorMessage = 'Invalid argument provided.';
                break;
              case 'storage/no-default-bucket':
                errorMessage = 'No default bucket configured.';
                break;
              case 'storage/cannot-slice-blob':
                errorMessage = 'Cannot slice blob. File may be corrupted.';
                break;
              case 'storage/server-file-wrong-size':
                errorMessage = 'Server file wrong size.';
                break;
              default:
                errorMessage = error.message || 'Unknown upload error';
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Upload completed! Download URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      } catch (error) {
        console.error('❌ Error creating upload task:', error);
        reject(new Error('Failed to initialize upload'));
      }
    });
  }

  /**
   * Upload payment screenshot with specific folder and validation
   * @param {File} file - The screenshot file to upload
   * @param {Function} onProgress - Callback function for upload progress (optional)
   * @returns {Promise<string>} - Returns the download URL of the uploaded screenshot
   */
  async uploadPaymentScreenshot(file, onProgress = null) {
    return this.uploadImage(file, 'payment-screenshots', onProgress);
  }

  /**
   * Upload E-PIN request screenshot with specific folder and validation
   * @param {File} file - The screenshot file to upload
   * @param {Function} onProgress - Callback function for upload progress (optional)
   * @returns {Promise<string>} - Returns the download URL of the uploaded screenshot
   */
  async uploadEpinScreenshot(file, onProgress = null) {
    return this.uploadImage(file, 'epinScreenshots', onProgress);
  }

  /**
   * Validate image file before upload
   * @param {File} file - The file to validate
   * @returns {Object} - Returns validation result with isValid boolean and error message
   */
  validateImageFile(file) {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size (3MB limit)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size should be less than 3MB' };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file' };
    }

    // Check for common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Supported formats: JPG, PNG, GIF, WebP' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Get file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Human readable file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;