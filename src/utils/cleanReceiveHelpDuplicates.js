import { getDocs, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function cleanReceiveHelpDuplicates() {
  const snapshot = await getDocs(collection(db, 'receiveHelp'));
  // Group by receiverId + level
  const groups = {};
  snapshot.docs.forEach(d => {
    const data = d.data();
    const receiverId = String(data.receiverId).trim().toLowerCase();
    const level = String(data.level).trim().toLowerCase();
    const key = `${receiverId}__${level}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ id: d.id, ...data });
  });
  let deletedCount = 0;
  for (const key in groups) {
    const docs = groups[key];
    if (docs.length > 3) {
      // Sort by timestamp ascending (oldest first)
      docs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      // Keep first 3, delete the rest
      const toDelete = docs.slice(3);
      for (const docData of toDelete) {
        await deleteDoc(doc(db, 'receiveHelp', docData.id));
        deletedCount++;
        console.log('✅ Deleted excess receiveHelp:', docData.id, 'for receiver/level:', key);
      }
    }
  }
  console.log(`✅ Duplicate cleanup done. Deleted ${deletedCount} excess receiveHelp doc(s).`);
  return deletedCount;
} 