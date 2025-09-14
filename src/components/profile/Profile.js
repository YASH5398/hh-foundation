import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';

const getInitial = (name) => (name && name.length > 0 ? name[0].toUpperCase() : 'U');
const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
];
function getColorFromName(name) {
  if (!name) return avatarColors[0];
  const code = name.charCodeAt(0);
  return avatarColors[code % avatarColors.length];
}

const Profile = () => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [formData] = useState({
    name: user?.name || user?.fullName || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    paymentMethod: user?.paymentMethod || '',
  });

  if (!user) {
    return <div className="text-center mt-10">User not logged in.</div>;
  }

  const avatarColor = getColorFromName(user.fullName || user.name);
  const initial = getInitial(user.fullName || user.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto p-6"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

        {/* Profile Picture */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center overflow-hidden ${imgError || !user.profileUrl ? avatarColor : ''}`}>
              {user.profileUrl && !imgError ? (
                <img
                  src={user.profileUrl}
                  alt={user.fullName || user.name || 'Profile'}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-3xl font-bold text-white">{initial}</span>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">{user?.fullName || user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
            <input
              type="text"
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled
            />
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Profile;