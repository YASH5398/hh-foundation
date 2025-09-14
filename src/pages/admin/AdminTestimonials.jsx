import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore";
import { FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "waiting_video", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  waiting_video: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      let q = collection(db, "testimonials");
      if (filter !== "all") {
        q = query(q, where("status", "==", filter));
      }
      q = query(q, orderBy("submittedAt", "desc"));
      const snap = await getDocs(q);
      setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchTestimonials();
  }, [filter]);

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const testimonialRef = doc(db, "testimonials", id);
    if (action === "approve") {
      await updateDoc(testimonialRef, { status: "approved", epinGiven: true });
    } else if (action === "reject") {
      await updateDoc(testimonialRef, { status: "rejected", epinGiven: false });
    }
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: action === "approve" ? "approved" : "rejected", epinGiven: action === "approve" } : t));
    setActionLoading(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3 text-gray-900 drop-shadow-sm">
        <span role="img" aria-label="Testimonials" className="text-3xl">🎬</span>
        Testimonials
      </h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="font-bold text-gray-800 text-base">Filter by status:</label>
        <select
          className="border border-gray-400 rounded px-4 py-2 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full text-sm bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-800 border-b border-gray-200">
              <th className="py-2 px-3">👤 Name</th>
              <th className="py-2 px-3">🆔 User ID</th>
              <th className="py-2 px-3">🌐 Method</th>
              <th className="py-2 px-3">🔗 Video Link</th>
              <th className="py-2 px-3">⭐ Rating</th>
              <th className="py-2 px-3">📝 Review</th>
              <th className="py-2 px-3">🕒 Submitted</th>
              <th className="py-2 px-3">✅ Confirmed</th>
              <th className="py-2 px-3">🎯 Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
            ) : testimonials.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-500">No testimonials found.</td></tr>
            ) : testimonials.map(t => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-blue-50 transition">
                <td className="py-2 px-3 font-medium text-gray-900">{t.name}</td>
                <td className="py-2 px-3 text-gray-700">{t.userId}</td>
                <td className="py-2 px-3 text-gray-700">{t.method && t.method.charAt(0).toUpperCase() + t.method.slice(1)}</td>
                <td className="py-2 px-3">
                  {t.videoLink ? (
                    <a href={t.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                      Link <FaExternalLinkAlt className="inline-block text-xs" />
                    </a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3 text-yellow-600">{t.rating ? '⭐'.repeat(t.rating) : <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 max-w-xs truncate text-gray-700" title={t.review}>{t.review || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 text-gray-700">{t.submittedAt?.toDate ? t.submittedAt.toDate().toLocaleString() : <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 text-center">{t.confirmed ? <FaCheckCircle className="text-green-500 mx-auto text-lg" /> : <FaTimesCircle className="text-red-500 mx-auto text-lg" />}</td>
                <td className="py-2 px-3">
                  <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${STATUS_STYLES[t.status] || 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                    {t.status === 'approved' ? 'Approved' :
                      t.status === 'rejected' ? 'Rejected' :
                      t.status === 'waiting_video' ? 'Waiting' :
                      t.status}
                  </span>
                </td>
                <td className="py-2 px-3 flex gap-2 items-center">
                  {t.status === 'waiting_video' && (
                    <>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60"
                        onClick={() => handleAction(t.id, 'approve')}
                        disabled={actionLoading[t.id]}
                        title="Accept"
                      >
                        <FaCheck /> Accept
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60"
                        onClick={() => handleAction(t.id, 'reject')}
                        disabled={actionLoading[t.id]}
                        title="Reject"
                      >
                        <FaTimes /> Reject
                      </button>
                    </>
                  )}
                  {(t.status === 'approved' || t.status === 'rejected') && (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTestimonials; 