import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, updateDoc, doc, query, where, orderBy, writeBatch, addDoc, increment } from "firebase/firestore";
import { FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { Star, MessageSquare, Users, TrendingUp, Search, Filter, CheckCircle, XCircle, Clock, Eye, ThumbsUp, ThumbsDown, MoreHorizontal, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All Requests", icon: MessageSquare },
  { value: "pending", label: "Pending Review", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

const STATUS_STYLES = {
  approved: "bg-green-900/50 text-green-300 border border-green-700",
  rejected: "bg-red-900/50 text-red-300 border border-red-700",
  pending: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
};

const STATUS_BADGES = {
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/20", border: "border-green-700" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-900/20", border: "border-red-700" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-700" },
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestimonials, setSelectedTestimonials] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch testimonial requests with enhanced error handling
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      let q = collection(db, "testimonialRequests");
      if (filter !== "all") {
        q = query(q, where("status", "==", filter));
      }
      q = query(q, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const testimonialData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTestimonials(testimonialData);
    } catch (error) {
      console.error("Error fetching testimonial requests:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission Denied: Access restricted to Admins.");
      } else {
        toast.error("Failed to load testimonial requests");
      }
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);

  // Filter and sort testimonials
  const filteredAndSortedTestimonials = testimonials
    .filter(testimonial =>
      searchTerm === "" ||
      testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.review?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "rating":
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case "submittedAt":
          aVal = a.createdAt?.seconds || 0;
          bVal = b.createdAt?.seconds || 0;
          break;
        default:
          return 0;
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  // Statistics calculations
  const stats = testimonials.reduce((acc, t) => {
    acc.total++;
    if (t.status === "approved") acc.approved++;
    if (t.status === "rejected") acc.rejected++;
    if (t.status === "pending") acc.pending++;
    acc.totalRating += t.rating || 0;
    return acc;
  }, { total: 0, approved: 0, rejected: 0, pending: 0, totalRating: 0 });

  const averageRating = stats.total > 0 ? (stats.totalRating / stats.total).toFixed(1) : 0;

  // Generate unique E-PIN code
  const generateEpinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const testimonialRef = doc(db, "testimonialRequests", id);

      if (action === "approve") {
        // Get testimonial request data
        const testimonialDoc = await getDocs(query(collection(db, "testimonialRequests"), where("requestId", "==", id)));
        const testimonialData = testimonialDoc.docs[0].data();

        // Start batch operation for atomic updates
        const batch = writeBatch(db);

        // 1. Update testimonial request status
        batch.update(testimonialRef, { status: "approved" });

        // 2. Generate 5 E-PINs
        const epinsData = [];
        for (let i = 0; i < 5; i++) {
          const epinCode = generateEpinCode();
          const epinData = {
            epinCode,
            assignedTo: testimonialData.uid,
            source: "testimonial",
            status: "unused",
            createdAt: new Date()
          };
          epinsData.push(epinData);

          // Add to batch
          const epinRef = doc(collection(db, "epins"));
          batch.set(epinRef, epinData);
        }

        // 3. Update user profile (increment epins count)
        const userRef = doc(db, "users", testimonialData.uid);
        batch.update(userRef, {
          epins: increment(5)
        });

        // 4. Create in-app notification
        const notificationData = {
          uid: testimonialData.uid,
          type: "epin_reward",
          title: "Congratulations 🎉",
          message: "You have received 5 free E-PINs for submitting a testimonial.",
          isRead: false,
          createdAt: new Date()
        };
        const notificationRef = doc(collection(db, "notifications"));
        batch.set(notificationRef, notificationData);

        // Commit all operations atomically
        await batch.commit();

        toast.success("Testimonial approved! User received 5 E-PINs and notification.");
      } else if (action === "reject") {
        await updateDoc(testimonialRef, { status: "rejected" });
        toast.success("Testimonial request rejected");
      }

      // Update local state
      setTestimonials(prev => prev.map(t =>
        t.id === id
          ? { ...t, status: action === "approve" ? "approved" : "rejected" }
          : t
      ));
    } catch (error) {
      console.error("Error processing testimonial request:", error);
      toast.error("Failed to process testimonial request");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedTestimonials.length === filteredAndSortedTestimonials.length) {
      setSelectedTestimonials([]);
    } else {
      setSelectedTestimonials(filteredAndSortedTestimonials.map(t => t.id));
    }
  };

  const handleSelectTestimonial = (id) => {
    setSelectedTestimonials(prev =>
      prev.includes(id)
        ? prev.filter(testimonialId => testimonialId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedTestimonials.length === 0) {
      toast.error("Please select testimonial requests first");
      return;
    }

    try {
      const batch = writeBatch(db);

      if (action === "approve") {
        // For bulk approve, we need to process each testimonial individually
        // since each needs to generate E-PINs and notifications
        for (const id of selectedTestimonials) {
          const testimonialDoc = await getDocs(query(collection(db, "testimonialRequests"), where("requestId", "==", id)));
          const testimonialData = testimonialDoc.docs[0].data();

          // Update testimonial status
          const testimonialRef = doc(db, "testimonialRequests", id);
          batch.update(testimonialRef, { status: "approved" });

          // Generate 5 E-PINs for each user
          for (let i = 0; i < 5; i++) {
            const epinCode = generateEpinCode();
            const epinData = {
              epinCode,
              assignedTo: testimonialData.uid,
              source: "testimonial",
              status: "unused",
              createdAt: new Date()
            };
            const epinRef = doc(collection(db, "epins"));
            batch.set(epinRef, epinData);
          }

          // Update user profile
          const userRef = doc(db, "users", testimonialData.uid);
          batch.update(userRef, {
            epins: increment(5)
          });

          // Create notification
          const notificationData = {
            uid: testimonialData.uid,
            type: "epin_reward",
            title: "Congratulations 🎉",
            message: "You have received 5 free E-PINs for submitting a testimonial.",
            isRead: false,
            createdAt: new Date()
          };
          const notificationRef = doc(collection(db, "notifications"));
          batch.set(notificationRef, notificationData);
        }
      } else if (action === "reject") {
        selectedTestimonials.forEach(id => {
          const testimonialRef = doc(db, "testimonialRequests", id);
          batch.update(testimonialRef, { status: "rejected" });
        });
      }

      await batch.commit();

      setTestimonials(prev => prev.map(t =>
        selectedTestimonials.includes(t.id)
          ? { ...t, status: action === "approve" ? "approved" : "rejected" }
          : t
      ));

      setSelectedTestimonials([]);
      toast.success(`${selectedTestimonials.length} testimonial requests ${action === "approve" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <MessageSquare className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Testimonial Requests
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Review testimonial requests and award E-PINs</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.total}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Requests</h3>
            <p className="text-slate-500 text-xs mt-1">All submitted requests</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all duration-300">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.pending}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Pending Review</h3>
            <p className="text-slate-500 text-xs mt-1">Awaiting approval</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.approved}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Approved</h3>
            <p className="text-slate-500 text-xs mt-1">Published testimonials</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">{averageRating}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Average Rating</h3>
            <p className="text-slate-500 text-xs mt-1">Out of 5 stars</p>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, user ID, or review..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="submittedAt" className="bg-slate-800 text-white">Newest First</option>
                  <option value="name" className="bg-slate-800 text-white">Name</option>
                  <option value="rating" className="bg-slate-800 text-white">Rating</option>
                </select>
                <TrendingUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTestimonials.length > 0 && (
              <div className="flex gap-2">
                <span className="text-slate-400 text-sm self-center mr-2">
                  {selectedTestimonials.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject All
                </button>
              </div>
            )}

            <button
              onClick={fetchTestimonials}
              className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-b border-slate-600">
                  <th className="px-4 py-4 font-semibold text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedTestimonials.length === filteredAndSortedTestimonials.length && filteredAndSortedTestimonials.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-left">User</th>
                  <th className="px-6 py-4 font-semibold text-left">Method</th>
                  <th className="px-6 py-4 font-semibold text-left">Video Link</th>
                  <th className="px-6 py-4 font-semibold text-center">Rating</th>
                  <th className="px-6 py-4 font-semibold text-left">Review</th>
                  <th className="px-6 py-4 font-semibold text-left">Submitted</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 bg-slate-900/30">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading testimonial requests...
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 bg-slate-900/30">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-slate-500" />
                        <p>No testimonial requests found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTestimonials.map(t => {
                    const isSelected = selectedTestimonials.includes(t.id);
                    const statusBadge = STATUS_BADGES[t.status];

                    return (
                      <tr key={t.id} className={`border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-all duration-200 ${isSelected ? 'bg-blue-900/20 border-blue-700/50' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTestimonial(t.id)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{t.name}</div>
                              <div className="text-slate-400 text-sm font-mono">{t.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-full text-xs font-medium capitalize">
                            {t.method || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {t.videoLink ? (
                            <a
                              href={t.videoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Video
                            </a>
                          ) : (
                            <span className="text-slate-500 text-sm">No video</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {t.rating ? (
                              <>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-slate-300 text-sm ml-1">({t.rating})</span>
                              </>
                            ) : (
                              <span className="text-slate-500 text-sm">No rating</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-white text-sm leading-relaxed">
                            {t.review ? (
                              <span title={t.review}>
                                {t.review.length > 100 ? `${t.review.substring(0, 100)}...` : t.review}
                              </span>
                            ) : (
                              <span className="text-slate-500">No review provided</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">
                          {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          <div className="text-slate-500 text-xs">
                            {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString() : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${STATUS_BADGES[t.status]?.bg} ${STATUS_BADGES[t.status]?.border} border`}>
                            {statusBadge?.icon && <statusBadge.icon className={`w-3 h-3 ${STATUS_BADGES[t.status]?.color}`} />}
                            <span className={STATUS_BADGES[t.status]?.color}>
                              {t.status === 'approved' ? 'Approved' :
                                t.status === 'rejected' ? 'Rejected' :
                                  t.status === 'waiting_video' ? 'Waiting' :
                                    t.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {t.status === 'waiting_video' && (
                              <>
                                <button
                                  className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleAction(t.id, 'approve')}
                                  disabled={actionLoading[t.id]}
                                >
                                  {actionLoading[t.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleAction(t.id, 'reject')}
                                  disabled={actionLoading[t.id]}
                                >
                                  {actionLoading[t.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}
                            {(t.status === 'approved' || t.status === 'rejected') && (
                              <span className="text-slate-500 text-sm">Processed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-16 text-slate-400 bg-slate-800/50 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading testimonials...
            </div>
          ) : filteredAndSortedTestimonials.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700">
              <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p>No testimonials found matching your criteria</p>
            </div>
          ) : (
            filteredAndSortedTestimonials.map(t => {
              const isSelected = selectedTestimonials.includes(t.id);
              const statusBadge = STATUS_BADGES[t.status];

              return (
                <div key={t.id} className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border p-6 transition-all duration-200 ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700'}`}>
                  {/* Selection and Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectTestimonial(t.id)}
                        className="w-5 h-5 mt-1 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                        </div>
                        <div className="text-slate-400 text-sm font-mono mb-1">{t.userId}</div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${STATUS_BADGES[t.status]?.bg} ${STATUS_BADGES[t.status]?.border} border`}>
                            {statusBadge?.icon && <statusBadge.icon className={`w-3 h-3 ${STATUS_BADGES[t.status]?.color}`} />}
                            <span className={STATUS_BADGES[t.status]?.color}>
                              {t.status === 'approved' ? 'Approved' :
                                t.status === 'rejected' ? 'Rejected' :
                                  t.status === 'waiting_video' ? 'Waiting' :
                                    t.status}
                            </span>
                          </span>
                          <span className="inline-flex items-center px-3 py-1 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-full text-xs font-medium capitalize">
                            {t.method || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  {t.rating && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-300 text-sm">Rating</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < t.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'}`}
                          />
                        ))}
                        <span className="text-slate-300 text-sm ml-2">({t.rating}/5)</span>
                      </div>
                    </div>
                  )}

                  {/* Review */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">Review</span>
                    </div>
                    <div className="text-white text-sm leading-relaxed bg-slate-800/50 p-3 rounded-lg">
                      {t.review || <span className="text-slate-500 italic">No review provided</span>}
                    </div>
                  </div>

                  {/* Video Link */}
                  {t.videoLink && (
                    <div className="mb-4">
                      <a
                        href={t.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Testimonial Video
                      </a>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs">
                    <Clock className="w-4 h-4" />
                    {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : 'Unknown date'}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {t.status === 'waiting_video' && (
                      <>
                        <button
                          className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleAction(t.id, 'approve')}
                          disabled={actionLoading[t.id]}
                        >
                          {actionLoading[t.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleAction(t.id, 'reject')}
                          disabled={actionLoading[t.id]}
                        >
                          {actionLoading[t.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                    {(t.status === 'approved' || t.status === 'rejected') && (
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Processed
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTestimonials; 