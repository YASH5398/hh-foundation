import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, updateDoc } from "firebase/firestore";
import { FaYoutube, FaGoogleDrive, FaWhatsapp, FaTelegramPlane, FaStar, FaCheckCircle, FaGift, FaVideo } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const SHARE_METHODS = [
  {
    key: "youtube",
    label: "YouTube Link",
    icon: <FaYoutube className="text-red-600" />,
  },
  {
    key: "gdrive",
    label: "Google Drive Link",
    icon: <FaGoogleDrive className="text-green-600" />,
  },
  {
    key: "whatsapp",
    label: "WhatsApp Share",
    icon: <FaWhatsapp className="text-green-500" />,
  },
  {
    key: "telegram",
    label: "Telegram Share",
    icon: <FaTelegramPlane className="text-blue-500" />,
  },
];

const ADMIN_WA = "919999999999"; // TODO: Replace with real admin number
const TELEGRAM_HANDLE = "@HelpingHandsSupport";

const EarnFreeEPIN = () => {
  const { user } = useAuth();
  const [method, setMethod] = useState(null);
  const [videoLink, setVideoLink] = useState("");
  const [waCopied, setWaCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testimonial, setTestimonial] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [testimonialDocId, setTestimonialDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmBox, setShowConfirmBox] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTestimonial = async () => {
      setLoading(true);
      const q = query(collection(db, "testimonials"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        setTestimonial(docData);
        setTestimonialDocId(snap.docs[0].id);
        setConfirmed(!!docData.confirmed);
      }
      setLoading(false);
    };
    fetchTestimonial();
  }, [user]);

  // WhatsApp message template
  const waMessage = `Hello Helping Hands Team,%0A%0AI am – ${user?.fullName}%0AMy User ID – ${user?.userId}%0A%0AHere is my video testimonial about my experience with the Helping Plan.%0APlease review and reward me with 5 free E-PINs. 🙏😊`;
  const waMessagePlain = `Hello Helping Hands Team,\n\nI am – ${user?.fullName}\nMy User ID – ${user?.userId}\n\nHere is my video testimonial about my experience with the Helping Plan.\nPlease review and reward me with 5 free E-PINs. 🙏😊`;
  const whatsappLink = `https://wa.me/${ADMIN_WA}?text=${waMessage}`;

  const handleCopyWA = () => {
    navigator.clipboard.writeText(waMessagePlain);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method || ((method === "youtube" || method === "gdrive") && !videoLink.trim()) || rating === 0) return;
    setSubmitting(true);
    const timestamp = Date.now();
    const docId = `testimonial_${user.userId}_${timestamp}`;
    let status = "waiting_review";
    if (method === "whatsapp" || method === "telegram") status = "waiting_video";
    const testimonialData = {
      uid: user.uid,
      userId: user.userId,
      name: user.fullName,
      method,
      videoLink: (method === "youtube" || method === "gdrive") ? videoLink.trim() : "",
      rating,
      review: review.trim(),
      status,
      epinGiven: false,
      submittedAt: serverTimestamp(),
      confirmed: false,
    };
    await setDoc(doc(db, "testimonials", docId), testimonialData);
    setTestimonial(testimonialData);
    setTestimonialDocId(docId);
    setSubmitting(false);
    setSuccess(true);
    setShowConfirmBox(true);
    toast.success("Submitted successfully, redirecting to WhatsApp...");
    if (method === "whatsapp") {
      setTimeout(() => window.open(whatsappLink, "_blank"), 800);
    } else if (method === "telegram") {
      setTimeout(() => window.open(`https://t.me/${TELEGRAM_HANDLE.replace('@','')}`, "_blank"), 800);
    }
  };

  const handleConfirm = async () => {
    if (!testimonialDocId) return;
    setConfirming(true);
    await updateDoc(doc(db, "testimonials", testimonialDocId), { confirmed: true });
    setConfirmed(true);
    setConfirming(false);
    toast.success("Thank you for confirming! Our team will review your video.");
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto bg-white shadow p-6 mt-8 rounded-xl text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-600">🎁 Earn Free E-PIN</h1>
        <p className="text-gray-700">Please log in to submit your testimonial.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Already confirmed: show only thank you
  if (testimonial && confirmed) {
    return (
      <div className="max-w-xl mx-auto bg-white shadow-lg p-8 mt-12 rounded-2xl flex flex-col items-center text-center">
        <FaCheckCircle className="text-green-600 text-5xl mb-2" />
        <div className="text-2xl font-bold text-green-700 mb-2">You’ve successfully submitted your testimonial. Thank you!</div>
        <div className="text-gray-700">Our team will verify and credit your 5 free E-PINs within 24 hours.</div>
      </div>
    );
  }

  // Testimonial exists but not confirmed: show confirmation UI
  if (testimonial && !confirmed && showConfirmBox) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-xl mx-auto bg-yellow-50 border border-yellow-300 shadow-lg p-8 mt-12 rounded-2xl flex flex-col items-center text-center relative"
        >
          <button
            className="absolute top-2 right-3 text-xl text-yellow-700 hover:text-yellow-900 cursor-pointer"
            onClick={() => setShowConfirmBox(false)}
            aria-label="Close confirmation box"
            type="button"
          >
            ×
          </button>
          <FaCheckCircle className="text-yellow-500 text-4xl mb-2" />
          <div className="text-xl font-semibold text-yellow-700 mb-2">✅ Did you share your video on WhatsApp?</div>
          <div className="text-yellow-700 mb-4">🕒 Our team will verify and credit your 5 free E-PINs within 24 hours.</div>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold text-lg shadow hover:bg-yellow-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {confirming ? "Confirming..." : "Confirm"}
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // No testimonial yet: show form
  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-3xl p-8 mb-8 shadow-xl border border-green-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 shadow-lg">
            <FaGift className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎁 Earn Free E-PIN
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed max-w-md mx-auto">
            Submit your video testimonial and earn <span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg">5 Free E-PINs</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
            <FaVideo className="text-green-500" />
            <span>Share your experience • Get rewarded instantly</span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        {success ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FaCheckCircle className="text-green-600 text-3xl" />
            </div>
            <div className="text-green-700 font-bold text-2xl mb-2">Testimonial Submitted!</div>
            <div className="text-gray-600 text-lg">Our team will review and credit your E-PINs within 24 hours.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                  method ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>1</div>
                <div className={`w-12 h-1 rounded ${
                  rating > 0 ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                  rating > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>2</div>
                <div className={`w-12 h-1 rounded ${
                  review.trim() ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                  review.trim() ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>3</div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Step 1: Sharing Method */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Choose Sharing Method</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SHARE_METHODS.map((m) => (
                    <motion.button
                      type="button"
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 justify-center rounded-2xl border-2 px-6 py-4 font-semibold transition-all duration-200 shadow-lg text-base focus:outline-none focus:ring-4 focus:ring-green-200 ${
                        method === m.key 
                          ? "border-green-500 bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-xl transform scale-105" 
                          : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:shadow-xl hover:bg-gray-50"
                      }`}
                      disabled={!!testimonial}
                    >
                      <div className="text-2xl">{m.icon}</div>
                      <span>{m.label}</span>
                    </motion.button>
                  ))}
                </div>
          </div>

          {/* Step 2: Dynamic Input Section */}
          {method === "youtube" && (
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="font-medium mb-1 text-gray-800 flex items-center gap-2"><FaYoutube className="text-red-600" /> YouTube Video Link</div>
              <input
                type="url"
                className="w-full border rounded p-2 mt-1"
                placeholder="Paste your YouTube video link here"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                required={method === "youtube"}
                disabled={!!testimonial}
              />
              <div className="text-xs text-gray-500 mt-1">Make sure your video is set to Unlisted or Public.</div>
            </div>
          )}
          {method === "gdrive" && (
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="font-medium mb-1 text-gray-800 flex items-center gap-2"><FaGoogleDrive className="text-green-600" /> Google Drive Link</div>
              <input
                type="url"
                className="w-full border rounded p-2 mt-1"
                placeholder="Paste your Google Drive video link here"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                required={method === "gdrive"}
                disabled={!!testimonial}
              />
              <div className="text-xs text-gray-500 mt-1">Set sharing to "Anyone with the link can view".</div>
            </div>
          )}
          {method === "whatsapp" && (
            <div className="bg-green-50 rounded-lg p-4 shadow-inner">
              <div className="font-medium mb-2 text-green-800 flex items-center gap-2"><FaWhatsapp className="text-green-500" /> WhatsApp Share</div>
              <div className="bg-white rounded p-3 border border-green-200 text-sm text-gray-800 mb-2 whitespace-pre-line">
                {waMessagePlain}
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleCopyWA}
                  className="px-3 py-1 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  disabled={!!testimonial}
                >
                  {waCopied ? "Copied!" : "Copy Message"}
                </button>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-green-500 text-white text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-1"
                >
                  <FaWhatsapp /> Open WhatsApp
                </a>
              </div>
              <div className="text-xs text-gray-500">Paste the message and send your video to our admin WhatsApp.</div>
            </div>
          )}
          {method === "telegram" && (
            <div className="bg-blue-50 rounded-lg p-4 shadow-inner">
              <div className="font-medium mb-2 text-blue-800 flex items-center gap-2"><FaTelegramPlane className="text-blue-500" /> Telegram Share</div>
              <div className="bg-white rounded p-3 border border-blue-200 text-sm text-gray-800 mb-2">
                Send your video directly to our Telegram: <span className="font-semibold">{TELEGRAM_HANDLE}</span>
              </div>
              <a
                href={`https://t.me/${TELEGRAM_HANDLE.replace('@','')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-1"
              >
                <FaTelegramPlane /> Open Telegram
              </a>
            </div>
          )}

              {/* Step 2: Star Rating */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                    <span className="text-yellow-600 font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Rate Your Experience</h3>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <motion.button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="focus:outline-none p-2 rounded-full hover:bg-yellow-100 transition-all duration-200"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        disabled={!!testimonial}
                      >
                        <FaStar
                          className={`w-10 h-10 transition-all duration-300 ${
                            (hoverRating || rating) >= star 
                              ? "text-yellow-400 drop-shadow-lg" 
                              : "text-gray-300"
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <div className="text-center">
                    {(hoverRating || rating) > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700"
                      >
                        <span className="text-3xl">{["😡","😕","😐","😊","😍"][(hoverRating || rating)-1]}</span>
                        <span>{["Poor","Fair","Good","Great","Excellent"][(hoverRating || rating)-1]}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Optional Text Review */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Short Written Review 
                    <span className="text-gray-500 font-normal text-base">(optional)</span>
                  </h3>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl p-4 min-h-[100px] text-gray-700 placeholder-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
                    placeholder="Share your experience in a few words..."
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    maxLength={200}
                    disabled={!!testimonial}
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>Help others understand your experience</span>
                    <span>{review.length}/200</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={submitting || !method || ((method === "youtube" || method === "gdrive") && !videoLink.trim()) || rating === 0 || !!testimonial}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white py-4 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        🚀 Submit Testimonial
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EarnFreeEPIN;