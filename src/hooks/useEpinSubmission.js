import { useState } from 'react';
import { db } from '../config/firebase'; // Assuming firebase config is here
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const useEpinSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitEpinRequest = async (data, user) => {
    setLoading(true);
    setError(null);
    console.log("Starting E-PIN submission with data:", data);
    try {
      // Your existing validation logic here
      if (!user) {
        throw new Error("You must be logged in to request E-PINs.");
      }
      // ... other validations

      console.log("Attempting to write to Firestore...");
      await addDoc(collection(db, 'epinRequests'), {
        userId: user.uid,
        requestedQuantity: data.requestedQuantity,
        offerReceived: data.offerReceived,
        totalEpinToAssign: data.totalEpinToAssign,
        paymentMethod: data.paymentMethod,
        utrNumber: data.utrNumber,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      console.log("Firestore write successful.");
      toast.success("E-PIN Request Submitted!");
      return true; // Indicate success
    } catch (err) {
      console.error("Error submitting E-PIN request:", err);
      setError(err);
      toast.error(`Error: ${err.message || 'Failed to submit request.'}`);
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  };

  return { submitEpinRequest, loading, error };
};

export default useEpinSubmission;