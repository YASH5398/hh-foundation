import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { app, db } from "../config/firebase";

const storage = getStorage(app, "gs://hh-foundation.appspot.com");

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file to upload (must be a File object)
 * @param {string} path - The full storage path (e.g., 'epinScreenshots/filename_timestamp')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export const uploadImage = async (file, path) => {
  try {
    const imageRef = ref(storage, path);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
};

/**
 * Uploads a payment screenshot and updates the epinRequests doc with screenshotUrl.
 * @param {File} file - The screenshot file
 * @param {string} requestId - The Firestore document ID for the E-PIN request
 */
export const uploadEpinScreenshot = async (file, requestId) => {
  try {
    // Upload file to Firebase Storage
    const storageRef = ref(storage, `epinScreenshots/${requestId}`);
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Update epinRequests doc with screenshotUrl
    const epinRef = doc(db, "epinRequests", requestId);
    await updateDoc(epinRef, {
      screenshotUrl: downloadURL
    });

    console.log("Screenshot URL added successfully!");
    return downloadURL;
  } catch (error) {
    console.error("Error uploading screenshot:", error);
    throw error;
  }
};

const handleUpload = async (e) => {
  const file = e.target.files[0];
  const folder = "profileImages"; // or "screenshots"
  const userId = "someUserId"; // Placeholder for currentUser.userId
  try {
    const url = await uploadImage(file, userId);
    console.log("Uploaded URL:", url);
    // You can now save the URL to Firestore or show image preview
  } catch (err) {
    console.error("Upload failed:", err.message);
  }
};

// In your JSX:
<input type="file" accept="image/*" onChange={handleUpload} /> 