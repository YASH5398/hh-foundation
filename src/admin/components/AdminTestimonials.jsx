import React, { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore";
import { FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "waiting_video", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

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
      // Always order by submittedAt desc
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
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><span role="img" aria-label="Testimonials">🎬</span> Testimonials</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">Filter by status:</label>
        <select
          className="border rounded px-3 py-1"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
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
              <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{t.name}</td>
                <td className="py-2 px-3">{t.userId}</td>
                <td className="py-2 px-3">{t.method && t.method.charAt(0).toUpperCase() + t.method.slice(1)}</td>
                <td className="py-2 px-3">
                  {t.videoLink ? (
                    <a href={t.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                      Link <FaExternalLinkAlt className="inline-block text-xs" />
                    </a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3">{t.rating ? '⭐'.repeat(t.rating) : <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 max-w-xs truncate" title={t.review}>{t.review || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3">{t.submittedAt?.toDate ? t.submittedAt.toDate().toLocaleString() : <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 text-center">{t.confirmed ? <FaCheckCircle className="text-green-500 mx-auto" /> : <FaTimesCircle className="text-red-400 mx-auto" />}</td>
                <td className="py-2 px-3 capitalize">
                  {t.status === 'approved' ? <span className="text-green-700 font-semibold">Approved</span> :
                   t.status === 'rejected' ? <span className="text-red-600 font-semibold">Rejected</span> :
                   t.status === 'waiting_video' ? <span className="text-yellow-700 font-semibold">Waiting</span> :
                   t.status}
                </td>
                <td className="py-2 px-3 flex gap-2 items-center">
                  {t.status === 'waiting_video' && (
                    <>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60"
                        onClick={() => handleAction(t.id, 'approve')}
                        disabled={actionLoading[t.id]}
                        title="Accept"
                      >
                        <FaCheck /> Accept
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60"
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