import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiBook, FiCopy, FiSend, FiBookmark, FiTag,
  FiFilter, FiRefreshCw, FiPlus, FiEdit3, FiTrash2,
  FiChevronDown, FiChevronRight, FiMessageSquare, FiStar, FiClock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, orderBy, onSnapshot, where,
  getDocs, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const KnowledgeBase = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['common']));
  
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: 'common',
    tags: [],
    isPublic: true
  });

  // Predefined categories and templates
  const defaultCategories = [
    { id: 'common', name: 'Common Issues', icon: '🔧', color: 'blue' },
    { id: 'payment', name: 'Payment Issues', icon: '💳', color: 'green' },
    { id: 'technical', name: 'Technical Support', icon: '⚙️', color: 'purple' },
    { id: 'account', name: 'Account Issues', icon: '👤', color: 'orange' },
    { id: 'verification', name: 'Verification', icon: '✅', color: 'teal' },
    { id: 'escalation', name: 'Escalation', icon: '⬆️', color: 'red' }
  ];

  const defaultTemplates = [
    {
      id: 'welcome',
      title: 'Welcome Message',
      content: 'Hello! Thank you for contacting our support team. I\'m here to help you with your inquiry. Could you please provide more details about the issue you\'re experiencing?',
      category: 'common',
      tags: ['greeting', 'welcome'],
      isPublic: true,
      usageCount: 0
    },
    {
      id: 'payment-pending',
      title: 'Payment Verification Pending',
      content: 'I can see that your payment is currently under verification. Our team typically processes payment verifications within 24-48 hours. You will receive a confirmation once the verification is complete. Is there anything specific about this payment you\'d like me to check?',
      category: 'payment',
      tags: ['payment', 'verification', 'pending'],
      isPublic: true,
      usageCount: 0
    },
    {
      id: 'account-locked',
      title: 'Account Locked Resolution',
      content: 'I understand your account has been locked. This usually happens for security reasons. To unlock your account, please provide: 1) Your registered email address, 2) Last successful login date, 3) Any recent transactions you remember. I\'ll help you regain access safely.',
      category: 'account',
      tags: ['account', 'locked', 'security'],
      isPublic: true,
      usageCount: 0
    },
    {
      id: 'technical-issue',
      title: 'Technical Issue Investigation',
      content: 'Thank you for reporting this technical issue. To help me investigate this properly, could you please provide: 1) What device/browser you\'re using, 2) When did this issue first occur, 3) Any error messages you\'ve seen, 4) Steps you\'ve already tried. This will help me provide the best solution.',
      category: 'technical',
      tags: ['technical', 'investigation', 'troubleshooting'],
      isPublic: true,
      usageCount: 0
    },
    {
      id: 'escalation-needed',
      title: 'Escalation to Specialist',
      content: 'I understand this issue requires specialized attention. I\'m escalating your case to our technical specialist team who will be better equipped to handle this specific situation. You can expect to hear from them within 4-6 hours. Your case reference number is: [CASE_ID]',
      category: 'escalation',
      tags: ['escalation', 'specialist', 'technical'],
      isPublic: true,
      usageCount: 0
    },
    {
      id: 'verification-documents',
      title: 'Document Verification Request',
      content: 'To complete your verification process, please upload the following documents: 1) Government-issued photo ID (front and back), 2) Proof of address (utility bill or bank statement from last 3 months), 3) Clear selfie holding your ID. Please ensure all documents are clear and readable.',
      category: 'verification',
      tags: ['verification', 'documents', 'kyc'],
      isPublic: true,
      usageCount: 0
    }
  ];

  // Fetch knowledge base data
  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      try {
        setLoading(true);
        
        // Initialize with default data if no custom templates exist
        setCategories(defaultCategories);
        setTemplates(defaultTemplates);
        
        // In a real implementation, you would fetch from Firestore:
        // const templatesQuery = query(
        //   collection(db, 'knowledgeBase'),
        //   where('isPublic', '==', true),
        //   orderBy('usageCount', 'desc')
        // );
        // const templatesSnapshot = await getDocs(templatesQuery);
        // const templatesData = templatesSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // }));
        // setTemplates(templatesData);
        
        // Load user's recently used templates
        const recentlyUsedData = JSON.parse(localStorage.getItem(`recentlyUsed_${user?.uid}`) || '[]');
        setRecentlyUsed(recentlyUsedData);
        
        // Load user's favorite templates
        const favoritesData = JSON.parse(localStorage.getItem(`favorites_${user?.uid}`) || '[]');
        setFavorites(favoritesData);
        
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        toast.error('Failed to load knowledge base');
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchKnowledgeBase();
    }
  }, [user?.uid]);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = categories.reduce((acc, category) => {
    acc[category.id] = filteredTemplates.filter(template => template.category === category.id);
    return acc;
  }, {});

  // Handle template usage
  const handleUseTemplate = async (template) => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(template.content);
      toast.success('Template copied to clipboard!');
      
      // Update recently used
      const updatedRecentlyUsed = [
        template,
        ...recentlyUsed.filter(t => t.id !== template.id)
      ].slice(0, 10);
      
      setRecentlyUsed(updatedRecentlyUsed);
      localStorage.setItem(`recentlyUsed_${user?.uid}`, JSON.stringify(updatedRecentlyUsed));
      
      // In real implementation, update usage count in Firestore
      // await updateDoc(doc(db, 'knowledgeBase', template.id), {
      //   usageCount: template.usageCount + 1,
      //   lastUsed: serverTimestamp()
      // });
      
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to copy template');
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = (template) => {
    const isFavorite = favorites.some(f => f.id === template.id);
    let updatedFavorites;
    
    if (isFavorite) {
      updatedFavorites = favorites.filter(f => f.id !== template.id);
      toast.success('Removed from favorites');
    } else {
      updatedFavorites = [...favorites, template];
      toast.success('Added to favorites');
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${user?.uid}`, JSON.stringify(updatedFavorites));
  };

  // Handle category expansion
  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle template creation/editing
  const handleSaveTemplate = async () => {
    try {
      if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const templateData = {
        ...newTemplate,
        createdBy: user.uid,
        createdAt: new Date(),
        usageCount: 0,
        tags: newTemplate.tags.filter(tag => tag.trim())
      };
      
      if (editingTemplate) {
        // Update existing template
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id ? { ...templateData, id: editingTemplate.id } : t
        );
        setTemplates(updatedTemplates);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const newTemplateWithId = { ...templateData, id: Date.now().toString() };
        setTemplates([...templates, newTemplateWithId]);
        toast.success('Template created successfully');
      }
      
      // Reset form
      setNewTemplate({
        title: '',
        content: '',
        category: 'common',
        tags: [],
        isPublic: true
      });
      setEditingTemplate(null);
      setShowTemplateModal(false);
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">Quick access to templates and common solutions</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              setEditingTemplate(null);
              setNewTemplate({
                title: '',
                content: '',
                category: 'common',
                tags: [],
                isPublic: true
              });
              setShowTemplateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates by Category */}
          <div className="space-y-6">
            {categories.map(category => {
              const categoryTemplates = groupedTemplates[category.id] || [];
              if (categoryTemplates.length === 0 && selectedCategory !== 'all') return null;
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  <div 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedCategories.has(category.id) ? 
                          <FiChevronDown className="w-4 h-4 text-gray-400" /> :
                          <FiChevronRight className="w-4 h-4 text-gray-400" />
                        }
                        <span className="text-lg">{category.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(category.color)}`}>
                          {categoryTemplates.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedCategories.has(category.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {categoryTemplates.length > 0 ? (
                            categoryTemplates.map(template => (
                              <div
                                key={template.id}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                      {template.content}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      {template.tags.map(tag => (
                                        <span
                                          key={tag}
                                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => handleToggleFavorite(template)}
                                      className={`p-2 rounded-md transition-colors ${
                                        favorites.some(f => f.id === template.id)
                                          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                      }`}
                                      title="Toggle favorite"
                                    >
                                      <FiStar className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => handleUseTemplate(template)}
                                      className="p-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                      title="Copy template"
                                    >
                                      <FiCopy className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setEditingTemplate(template);
                                        setNewTemplate({
                                          title: template.title,
                                          content: template.content,
                                          category: template.category,
                                          tags: template.tags,
                                          isPublic: template.isPublic
                                        });
                                        setShowTemplateModal(true);
                                      }}
                                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                      title="Edit template"
                                    >
                                      <FiEdit3 className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Delete template"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <FiBook className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No templates in this category</p>
                              <p className="text-sm text-gray-400">Create your first template to get started</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recently Used */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FiClock className="w-5 h-5" />
              <span>Recently Used</span>
            </h3>
            
            <div className="space-y-2">
              {recentlyUsed.slice(0, 5).map(template => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{template.title}</p>
                  <p className="text-xs text-gray-500 truncate">{template.content}</p>
                </div>
              ))}
              
              {recentlyUsed.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recently used templates</p>
              )}
            </div>
          </div>

          {/* Favorites */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FiStar className="w-5 h-5" />
              <span>Favorites</span>
            </h3>
            
            <div className="space-y-2">
              {favorites.slice(0, 5).map(template => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{template.title}</p>
                  <p className="text-xs text-gray-500 truncate">{template.content}</p>
                </div>
              ))}
              
              {favorites.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No favorite templates</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Templates</span>
                <span className="text-sm font-medium text-gray-900">{templates.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Categories</span>
                <span className="text-sm font-medium text-gray-900">{categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Favorites</span>
                <span className="text-sm font-medium text-gray-900">{favorites.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recently Used</span>
                <span className="text-sm font-medium text-gray-900">{recentlyUsed.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter template title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter template content"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.tags.join(', ')}
                    onChange={(e) => setNewTemplate({ 
                      ...newTemplate, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., greeting, payment, technical"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newTemplate.isPublic}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this template public (visible to all agents)
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeBase;