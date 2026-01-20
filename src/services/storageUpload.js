import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { requireFreshIdToken } from './authReady';

export async function uploadImage(file, path) {
  if (!file) throw new Error('No file provided');
  await requireFreshIdToken();

  const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileRef = ref(storage, `${path}/${Date.now()}_${safeName}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}

export function uploadImageResumable(file, path, onProgress) {
  if (!file) return Promise.reject(new Error('No file provided'));

  return requireFreshIdToken().then(() => {
    const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileRef = ref(storage, `${path}/${Date.now()}_${safeName}`);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (typeof onProgress === 'function' && snapshot.totalBytes) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              downloadURL,
              screenshotPath: uploadTask.snapshot.ref.fullPath,
              screenshotContentType: file.type,
              screenshotSize: file.size
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  });
}
