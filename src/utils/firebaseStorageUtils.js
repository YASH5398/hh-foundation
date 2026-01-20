/**
 * Converts Firebase Storage download URL to direct public URL
 * This avoids CORS issues when displaying images
 * 
 * @param {string} downloadURL - Firebase Storage download URL
 * @returns {string} Direct public URL for the image
 */
export const getDirectImageUrl = (downloadURL) => {
  if (!downloadURL) return '';
  
  // If it's already a direct public URL, return as is
  if (downloadURL.includes('firebasestorage.googleapis.com/v0/b/')) {
    return downloadURL;
  }
  
  // If it's a Firebase Storage download URL, convert it
  if (downloadURL.includes('firebasestorage.googleapis.com/v0/b/') && downloadURL.includes('?alt=media')) {
    return downloadURL;
  }
  
  // Extract the path from the download URL
  const url = new URL(downloadURL);
  const pathMatch = url.pathname.match(/\/v0\/b\/([^\/]+)\/o\/(.+)/);
  
  if (pathMatch) {
    const bucket = pathMatch[1];
    const encodedPath = encodeURIComponent(pathMatch[2]);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }
  
  // If we can't parse it, return the original URL
  return downloadURL;
};

/**
 * Creates a direct public URL for Firebase Storage images
 * 
 * @param {string} userId - User ID
 * @param {string} fileName - File name
 * @param {string} folder - Folder path (default: 'paymentProofs')
 * @returns {string} Direct public URL
 */
export const createDirectImageUrl = (userId, fileName, folder = 'paymentProofs') => {
<<<<<<< HEAD
  const bucket = 'hh-foundation.firebasestorage.app';
=======
  const bucket = 'hh-foundation.appspot.com';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const path = `${folder}/${userId}/${fileName}`;
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
};

/**
 * Extracts user ID and file name from Firebase Storage URL
 * 
 * @param {string} downloadURL - Firebase Storage download URL
 * @returns {object} Object containing userId and fileName
 */
export const extractImageInfo = (downloadURL) => {
  if (!downloadURL) return { userId: '', fileName: '' };
  
  try {
    const url = new URL(downloadURL);
    const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
    
    if (pathMatch) {
      const decodedPath = decodeURIComponent(pathMatch[1]);
      const pathParts = decodedPath.split('/');
      
      if (pathParts.length >= 3) {
        const folder = pathParts[0];
        const userId = pathParts[1];
        const fileName = pathParts.slice(2).join('/');
        
        return { folder, userId, fileName };
      }
    }
  } catch (error) {
    console.error('Error extracting image info:', error);
  }
  
  return { userId: '', fileName: '' };
}; 