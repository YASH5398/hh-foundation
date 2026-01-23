import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateSocialTask } from '../services/userService';

export function useSocialTasks(uid) {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError('');
    const ref = doc(db, 'socialTasks', uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTasks(snap.data());
      } else {
        setTasks(null);
      }
      setLoading(false);
    }, (err) => {
      setError('Failed to load social tasks');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const completeTask = async (taskKey, username = '') => {
    if (!uid || !taskKey) return;
    // Prevent duplicate update if already completed
    if (tasks && tasks[taskKey]) return;
    
    try {
      await updateSocialTask(uid, taskKey, username);
    } catch (error) {
      setError('Failed to complete task');
      console.error('Error completing task:', error);
    }
  };

  return { tasks, loading, error, completeTask };
}
