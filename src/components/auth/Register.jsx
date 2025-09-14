import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { db } from '../../config/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorIdLocked, setSponsorIdLocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      if (ref === 'loading') {
        setSponsorId('');
        setSponsorIdLocked(false);
        return;
      }
      
      const verifySponsor = async () => {
        setIsVerifying(true);
        try {
          const sponsorDoc = await getDoc(doc(db, 'users', ref));
          if (sponsorDoc.exists()) {
            setSponsorId(ref);
            setSponsorIdLocked(true);
            toast.success('Sponsor verified!');
          } else {
            setSponsorId('');
            setSponsorIdLocked(false);
            toast.error('Invalid sponsor ID.');
          }
        } catch (error) {
          toast.error('Error verifying sponsor.');
          setSponsorId('');
          setSponsorIdLocked(false);
        } finally {
          setIsVerifying(false);
        }
      };
      verifySponsor();
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setLoading(true);
      const userCredential = await signup(email, password);
      const user = userCredential.user || userCredential;
      // Create Firestore user doc with approved structure
      await setDoc(doc(db, 'users', user.uid), {
        userId: '', // Set/generate as needed
        fullName: '', // Collect from form if needed
        email: email,
        phone: '', // Collect from form if needed
        whatsapp: '', // Collect from form if needed
        password: password, // Or hash if needed
        sponsorId: sponsorId, // Use the state variable
        uplineId: '', // Collect from form if needed
        isActivated: false,
        isBlocked: false,
        level: 'Star',
        levelStatus: 1,
        registrationTime: serverTimestamp(),
        paymentMethod: {
          gpay: '',
          phonePe: '',
          upi: ''
        },
        bank: {
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          name: ''
        },
        profileImage: '',
        referralCount: 0,
        referredUsers: [],
        totalEarnings: 0,
        totalReceived: 0,
        totalSent: 0,
        totalTeam: 0,
        epins: '',
        deviceToken: '',
        helpReceived: 0,
        paymentBlocked: false,
        nextLevelPaymentDone: false
      });
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/register-success');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sponsorId">
              Sponsor ID
            </label>
            <input
              type="text"
              id="sponsorId"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter sponsor ID"
              value={sponsorId}
              onChange={e => setSponsorId(e.target.value)}
              required
              readOnly={sponsorIdLocked}
            />
            {isVerifying && <p className="text-sm text-blue-500 mt-1">Verifying sponsor...</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-800">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;