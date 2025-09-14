import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSearch, FiAlertTriangle, FiUser, FiMail, FiCalendar, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const UserBugChecker = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const scanForIssues = async () => {
    setLoading(true);
    setScanResults(null);

    try {
      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = [];
      const issues = {
        duplicateEmails: [],
        incompleteProfiles: [],
        suspiciousActivity: [],
        inactiveAccounts: [],
        invalidData: []
      };

      const emailMap = new Map();
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));

      usersSnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        usersData.push(userData);

        // Check for duplicate emails
        if (userData.email) {
          if (emailMap.has(userData.email)) {
            issues.duplicateEmails.push({
              email: userData.email,
              users: [emailMap.get(userData.email), userData]
            });
          } else {
            emailMap.set(userData.email, userData);
          }
        }

        // Check for incomplete profiles
        const requiredFields = ['email', 'name', 'phone'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        if (missingFields.length > 0) {
          issues.incompleteProfiles.push({
            user: userData,
            missingFields
          });
        }

        // Check for suspicious activity
        if (userData.loginAttempts > 10 || userData.failedPayments > 5) {
          issues.suspiciousActivity.push({
            user: userData,
            reason: userData.loginAttempts > 10 ? 'Too many login attempts' : 'Multiple failed payments'
          });
        }

        // Check for inactive accounts
        const lastLogin = userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : new Date(userData.lastLoginAt || 0);
        if (lastLogin < thirtyDaysAgo && userData.status !== 'inactive') {
          issues.inactiveAccounts.push({
            user: userData,
            lastLogin: lastLogin
          });
        }

        // Check for invalid data
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        
        if (userData.email && !emailRegex.test(userData.email)) {
          issues.invalidData.push({
            user: userData,
            field: 'email',
            value: userData.email,
            reason: 'Invalid email format'
          });
        }
        
        if (userData.phone && !phoneRegex.test(userData.phone.replace(/[\s\-\(\)]/g, ''))) {
          issues.invalidData.push({
            user: userData,
            field: 'phone',
            value: userData.phone,
            reason: 'Invalid phone format'
          });
        }
      });

      setUsers(usersData);
      setScanResults({
        totalUsers: usersData.length,
        issues,
        scannedAt: new Date()
      });
      
      const totalIssues = Object.values(issues).reduce((sum, issueArray) => sum + issueArray.length, 0);
      toast.success(`Scan completed! Found ${totalIssues} issues across ${usersData.length} users`);
    } catch (error) {
      console.error('Error scanning users:', error);
      toast.error('Failed to scan users for issues');
    } finally {
      setLoading(false);
    }
  };

  const getIssueCount = (issueType) => {
    if (!scanResults) return 0;
    return scanResults.issues[issueType]?.length || 0;
  };

  const getFilteredIssues = () => {
    if (!scanResults) return [];
    
    let allIssues = [];
    
    if (selectedIssue === 'all') {
      Object.entries(scanResults.issues).forEach(([type, issues]) => {
        issues.forEach(issue => {
          allIssues.push({ ...issue, type });
        });
      });
    } else {
      scanResults.issues[selectedIssue]?.forEach(issue => {
        allIssues.push({ ...issue, type: selectedIssue });
      });
    }

    if (searchTerm) {
      allIssues = allIssues.filter(issue => {
        const user = issue.user || issue.users?.[0];
        return (
          user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return allIssues;
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'duplicateEmails': return <FiMail className="w-4 h-4" />;
      case 'incompleteProfiles': return <FiUser className="w-4 h-4" />;
      case 'suspiciousActivity': return <FiAlertTriangle className="w-4 h-4" />;
      case 'inactiveAccounts': return <FiClock className="w-4 h-4" />;
      case 'invalidData': return <FiXCircle className="w-4 h-4" />;
      default: return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

  const getIssueColor = (type) => {
    switch (type) {
      case 'duplicateEmails': return 'bg-red-100 text-red-800';
      case 'incompleteProfiles': return 'bg-yellow-100 text-yellow-800';
      case 'suspiciousActivity': return 'bg-red-100 text-red-800';
      case 'inactiveAccounts': return 'bg-gray-100 text-gray-800';
      case 'invalidData': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatIssueTitle = (type) => {
    switch (type) {
      case 'duplicateEmails': return 'Duplicate Emails';
      case 'incompleteProfiles': return 'Incomplete Profiles';
      case 'suspiciousActivity': return 'Suspicious Activity';
      case 'inactiveAccounts': return 'Inactive Accounts';
      case 'invalidData': return 'Invalid Data';
      default: return 'Unknown Issue';
    }
  };

  const renderIssueDetails = (issue) => {
    switch (issue.type) {
      case 'duplicateEmails':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">Email: {issue.email}</p>
            <p className="text-sm text-gray-600">Found in {issue.users.length} accounts:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
              {issue.users.map(user => (
                <li key={user.id}>{user.name || 'Unnamed'} (ID: {user.id})</li>
              ))}
            </ul>
          </div>
        );
      case 'incompleteProfiles':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              User: {issue.user.name || 'Unnamed'} ({issue.user.email})
            </p>
            <p className="text-sm text-gray-600">
              Missing fields: {issue.missingFields.join(', ')}
            </p>
          </div>
        );
      case 'suspiciousActivity':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              User: {issue.user.name || 'Unnamed'} ({issue.user.email})
            </p>
            <p className="text-sm text-gray-600">Reason: {issue.reason}</p>
          </div>
        );
      case 'inactiveAccounts':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              User: {issue.user.name || 'Unnamed'} ({issue.user.email})
            </p>
            <p className="text-sm text-gray-600">
              Last login: {issue.lastLogin.toLocaleDateString()}
            </p>
          </div>
        );
      case 'invalidData':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              User: {issue.user.name || 'Unnamed'} ({issue.user.email})
            </p>
            <p className="text-sm text-gray-600">
              Invalid {issue.field}: {issue.value}
            </p>
            <p className="text-sm text-gray-600">Reason: {issue.reason}</p>
          </div>
        );
      default:
        return <p className="text-sm text-gray-600">Unknown issue type</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Bug Checker</h1>
              <p className="text-gray-600">Scan user database for issues and anomalies</p>
            </div>
            <button
              onClick={scanForIssues}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FiSearch className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Scanning...' : 'Start Scan'}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {scanResults && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Scan Results</h2>
                <div className="text-sm text-gray-500">
                  Scanned at: {scanResults.scannedAt.toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{scanResults.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{getIssueCount('duplicateEmails')}</p>
                  <p className="text-sm text-gray-600">Duplicate Emails</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{getIssueCount('incompleteProfiles')}</p>
                  <p className="text-sm text-gray-600">Incomplete Profiles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{getIssueCount('suspiciousActivity')}</p>
                  <p className="text-sm text-gray-600">Suspicious Activity</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{getIssueCount('inactiveAccounts')}</p>
                  <p className="text-sm text-gray-600">Inactive Accounts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{getIssueCount('invalidData')}</p>
                  <p className="text-sm text-gray-600">Invalid Data</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex space-x-4">
                    <select
                      value={selectedIssue}
                      onChange={(e) => setSelectedIssue(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Issues</option>
                      <option value="duplicateEmails">Duplicate Emails</option>
                      <option value="incompleteProfiles">Incomplete Profiles</option>
                      <option value="suspiciousActivity">Suspicious Activity</option>
                      <option value="inactiveAccounts">Inactive Accounts</option>
                      <option value="invalidData">Invalid Data</option>
                    </select>
                  </div>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Issues List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                {getFilteredIssues().length === 0 ? (
                  <div className="text-center py-12">
                    <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedIssue === 'all' ? 'All users look good!' : `No ${formatIssueTitle(selectedIssue).toLowerCase()} found.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredIssues().map((issue, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueColor(issue.type)}`}>
                              {getIssueIcon(issue.type)}
                              <span className="ml-1">{formatIssueTitle(issue.type)}</span>
                            </span>
                          </div>
                        </div>
                        {renderIssueDetails(issue)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No scan results */}
        {!scanResults && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiSearch className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Scan</h3>
            <p className="text-gray-500 mb-6">
              Click "Start Scan" to analyze your user database for potential issues and anomalies.
            </p>
            <button
              onClick={scanForIssues}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiSearch className="w-5 h-5 mr-2" />
              Start Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBugChecker;