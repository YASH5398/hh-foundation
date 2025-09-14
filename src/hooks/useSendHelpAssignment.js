import { useEffect, useState } from 'react';
import { checkSenderEligibility, selectReceiver, createSendAndReceiveHelp } from '../services/sendHelpService';

export function useSendHelpAssignment(currentUser) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function assign() {
      setLoading(true);
      setError('');
      setAssignment(null);
      const { eligible, userData, reason } = await checkSenderEligibility(currentUser);
      if (!eligible) {
        setError(reason);
        setLoading(false);
        return;
      }
      const receiver = await selectReceiver(userData);
      if (!receiver) {
        setError('No eligible receiver found');
        setLoading(false);
        return;
      }
      const docId = await createSendAndReceiveHelp(userData, receiver);
      setAssignment({ docId, userData, receiver });
      setLoading(false);
    }
    if (currentUser) assign();
    return () => { isMounted = false; };
  }, [currentUser]);

  return { assignment, loading, error };
} 