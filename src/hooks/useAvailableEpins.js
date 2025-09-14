import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const useAvailableEpins = (userId) => {
  const [availableEpins, setAvailableEpins] = useState(0);
  const [loadingEpins, setLoadingEpins] = useState(true);
  const [errorEpins, setErrorEpins] = useState(null);

  useEffect(() => {
    const fetchEpins = async () => {
      if (!userId) {
        setAvailableEpins(0);
        setLoadingEpins(false);
        return;
      }
      setLoadingEpins(true);
      setErrorEpins(null);
      try {
        const q = query(
          collection(db, 'epins'),
          where('assignedTo', '==', userId),
          where('used', '==', false)
        );
        const querySnapshot = await getDocs(q);
        setAvailableEpins(querySnapshot.size);
      } catch (err) {
        console.error("Error fetching available E-PINs:", err);
        setErrorEpins(err);
      } finally {
        setLoadingEpins(false);
      }
    };

    fetchEpins();
  }, [userId]);

  return { availableEpins, loadingEpins, errorEpins };
};

export default useAvailableEpins;