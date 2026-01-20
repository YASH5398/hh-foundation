import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export async function waitForAuthReady({ timeoutMs = 10000 } = {}) {
  // If user is already authenticated, return immediately
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Authentication timeout - user not logged in'));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        cleanup();
        resolve(user);
      } else if (user === null) {
        // User is explicitly null (logged out)
        cleanup();
        reject(new Error('User not authenticated'));
      }
      // If user is undefined, keep waiting (auth state still loading)
    });

    function cleanup() {
      clearTimeout(timer);
      try {
        unsubscribe();
      } catch (_) {}
    }
  });
}

export async function requireFreshIdToken({ timeoutMs = 10000 } = {}) {
  const user = await waitForAuthReady({ timeoutMs });
  if (!user) {
    throw new Error('User not authenticated');
  }
  try {
    await user.getIdToken(true); // Force refresh
    return user;
  } catch (error) {
    console.error('Error getting fresh ID token:', error);
    throw new Error('Failed to get authentication token');
  }
}
