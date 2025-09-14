import { renderHook, act } from '@testing-library/react-hooks';
import useEpinSubmission from './useEpinSubmission';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(() => ({
    on: jest.fn((event, onProgress, onError, onComplete) => {
      if (event === 'state_changed') {
        onComplete(); // Simulate immediate completion
      }
    }),
    snapshot: { ref: {} },
  })),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-download-url')),
}));
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useEpinSubmission', () => {
  it('should submit E-PIN request successfully with image', async () => {
    const { result } = renderHook(() => useEpinSubmission());

    const mockData = {
      requestedQuantity: 10,
      offerReceived: 1,
      totalEpinToAssign: 11,
      proof: new File(['dummy content'], 'test.png', { type: 'image/png' }),
      utrNumber: 'UTR12345',
      paymentMethod: 'PhonePe',
    };
    const mockCurrentUser = { uid: 'user123' };

    await act(async () => {
      await result.current.submitEpinRequest(mockData, mockCurrentUser);
    });

    expect(result.current.loading).toBe(false);
    expect(addDoc).toHaveBeenCalledWith(collection(), expect.objectContaining({
      userId: 'user123',
      proofImageUrl: 'mock-download-url',
      utrNumber: 'UTR12345',
    }));
    expect(toast.success).toHaveBeenCalledWith('E-PIN Request Submitted!');
  });

  it('should submit E-PIN request successfully without image', async () => {
    const { result } = renderHook(() => useEpinSubmission());

    const mockData = {
      requestedQuantity: 10,
      offerReceived: 1,
      totalEpinToAssign: 11,
      proof: null,
      utrNumber: 'UTR12345',
      paymentMethod: 'PhonePe',
    };
    const mockCurrentUser = { uid: 'user123' };

    await act(async () => {
      await result.current.submitEpinRequest(mockData, mockCurrentUser);
    });

    expect(result.current.loading).toBe(false);
    expect(addDoc).toHaveBeenCalledWith(collection(), expect.objectContaining({
      userId: 'user123',
      proofImageUrl: '', // Should be empty if no proof
      utrNumber: 'UTR12345',
    }));
    expect(toast.success).toHaveBeenCalledWith('E-PIN Request Submitted!');
  });

  it('should handle errors during submission', async () => {
    const { result } = renderHook(() => useEpinSubmission());
    addDoc.mockImplementationOnce(() => Promise.reject(new Error('Firestore error')));

    const mockData = {
      requestedQuantity: 10,
      offerReceived: 1,
      totalEpinToAssign: 11,
      proof: null,
      utrNumber: 'UTR12345',
      paymentMethod: 'PhonePe',
    };
    const mockCurrentUser = { uid: 'user123' };

    await act(async () => {
      await result.current.submitEpinRequest(mockData, mockCurrentUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith('Error: Firestore error');
  });
});