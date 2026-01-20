<<<<<<< HEAD
export {};
=======
/**
 * Cloudinary Upload Service
 * Handles image uploads via secure backend API
 * 
 * SECURITY: NO API KEY or API SECRET in frontend
 * All uploads go through the backend server which has the credentials
 */

// Backend API URL - adjust based on your server configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3002';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Convert File to Base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload an image file to Cloudinary via backend API
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<string>} - Returns the secure_url of the uploaded image
 */
export async function uploadImageToCloudinary(file, onProgress = null) {
  // Validate file exists
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit');
  }

  // Check file type (only jpg, jpeg, png, webp)
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are allowed');
  }

  try {
    // Convert file to base64
    if (onProgress) onProgress(10);
    const imageBase64 = await fileToBase64(file);
    
    if (onProgress) onProgress(30);

    // Send to backend API
    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (onProgress) onProgress(80);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    
    if (onProgress) onProgress(100);

    if (data.url) {
      console.log('✅ Cloudinary upload successful');
      return data.url;
    } else {
      throw new Error('No URL in response');
    }
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw new Error(error.message || 'Image upload failed');
  }
}

export default { uploadImageToCloudinary };
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
