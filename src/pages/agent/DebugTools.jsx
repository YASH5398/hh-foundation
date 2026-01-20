import React, { useState, useEffect } from 'react';
import { 
  FiTool, FiSearch, FiEye, FiRefreshCw, FiAlertTriangle,
  FiInfo, FiCheckCircle, FiXCircle, FiClock, FiUser,
  FiDatabase, FiActivity, FiSettings, FiCode, FiPlay,
  FiPause, FiStop, FiDownload, FiUpload, FiFilter,
  FiMonitor, FiServer, FiWifi, FiShield, FiLock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, orderBy, limit, where,
  getDocs, doc, getDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { toast } from 'react-hot-toast';

const DebugTools = () => {
  const { currentUser } = useAgentAuth();
  const user = currentUser || null;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  
  const [logs, setLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [userSimulation, setUserSimulation] = useState(null);
  const [ticketSimulation, setTicketSimulation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
  const [simulationForm, setSimulationForm] = useState({
    userId: '',
    ticketId: '',
    action: 'view',
    parameters: '{}'
  });

  // Mock data for demonstration
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      level: 'info',
      message: 'User authentication successful',
      userId: 'user123',
      action: 'login',
      details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      level: 'warning',
      message: 'Payment verification taking longer than expected',
      userId: 'user456',
      action: 'payment_verification',
      details: { paymentId: 'pay_123', duration: '45s' }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      level: 'error',
      message: 'Failed to send notification',
      userId: 'user789',
      action: 'notification',
      details: { error: 'FCM token invalid', retryCount: 3 }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      level: 'info',
      message: 'Support ticket created',
      userId: 'user101',
      action: 'ticket_creation',
      details: { ticketId: 'ticket_456', priority: 'medium' }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      level: 'debug',
      message: 'Database query executed',
      userId: 'system',
      action: 'database',
      details: { query: 'SELECT * FROM users WHERE...', duration: '120ms' }
    }
  ];

  const mockSystemStatus = {
    database: { status: 'healthy', responseTime: '45ms', connections: 12 },
    firebase: { status: 'healthy', responseTime: '120ms', quota: '85%' },
    notifications: { status: 'degraded', responseTime: '2.1s', failureRate: '5%' },
    storage: { status: 'healthy', usage: '67%', available: '2.3GB' },
    api: { status: 'healthy', responseTime: '89ms', requests: '1.2k/min' }
  };

  const mockPerformanceMetrics = {
    avgResponseTime: '156ms',
    requestsPerMinute: 1247,
    errorRate: '0.8%',
    activeUsers: 342,
    memoryUsage: '78%',
    cpuUsage: '45%'
  };

  const timeRanges = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' }
  ];

  const severityLevels = [
    { value: 'all', label: 'All Levels', color: 'gray' },
    { value: 'debug', label: 'Debug', color: 'blue' },
    { value: 'info', label: 'Info', color: 'green' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'error', label: 'Error', color: 'red' }
  ];

  const tabs = [
    { id: 'logs', label: 'System Logs', icon: FiActivity },
    { id: 'status', label: 'System Status', icon: FiMonitor },
    { id: 'simulation', label: 'User Simulation', icon: FiUser },
    { id: 'performance', label: 'Performance', icon: FiServer },
    { id: 'security', label: 'Security', icon: FiShield }
  ];

  // Initialize data
  useEffect(() => {
    setLogs(mockLogs);
    setSystemStatus(mockSystemStatus);
    setPerformanceMetrics(mockPerformanceMetrics);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: ['info', 'warning', 'error', 'debug'][Math.floor(Math.random() * 4)],
          message: [
            'User action completed',
            'Payment processed',
            'Notification sent',
            'Database query executed',
            'Cache updated'
          ][Math.floor(Math.random() * 5)],
          userId: `user${Math.floor(Math.random() * 1000)}`,
          action: 'system',
          details: { timestamp: new Date().toISOString() }
        };
        
        setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'all' || log.level === selectedSeverity;
    
    const now = new Date();
    const logTime = new Date(log.timestamp);
    const timeDiff = now - logTime;
    
    let matchesTimeRange = true;
    switch (selectedTimeRange) {
      case '15m':
        matchesTimeRange = timeDiff <= 15 * 60 * 1000;
        break;
      case '1h':
        matchesTimeRange = timeDiff <= 60 * 60 * 1000;
        break;
      case '6h':
        matchesTimeRange = timeDiff <= 6 * 60 * 60 * 1000;
        break;
      case '24h':
        matchesTimeRange = timeDiff <= 24 * 60 * 60 * 1000;
        break;
      case '7d':
        matchesTimeRange = timeDiff <= 7 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return matchesSearch && matchesSeverity && matchesTimeRange;
  });

  // Handle user simulation
  const handleUserSimulation = async () => {
    if (!simulationForm.userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would fetch actual user data
      // For demo purposes, we'll simulate the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUserData = {
        uid: simulationForm.userId,
        email: `user${simulationForm.userId}@example.com`,
        fullName: `User ${simulationForm.userId}`,
        role: 'user',
        isActivated: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        tickets: Math.floor(Math.random() * 10),
        payments: Math.floor(Math.random() * 5)
      };
      
      setUserSimulation(mockUserData);
      toast.success('User data loaded successfully');
      
    } catch (error) {
      console.error('Error simulating user:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Handle ticket simulation
  const handleTicketSimulation = async () => {
    if (!simulationForm.ticketId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTicketData = {
        id: simulationForm.ticketId,
        userId: `user${Math.floor(Math.random() * 1000)}`,
        agentId: user?.uid,
        status: ['open', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        subject: 'Sample ticket subject',
        description: 'This is a simulated ticket for debugging purposes.',
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        messages: Math.floor(Math.random() * 10) + 1
      };
      
      setTicketSimulation(mockTicketData);
      toast.success('Ticket data loaded successfully');
      
    } catch (error) {
      console.error('Error simulating ticket:', error);
      toast.error('Failed to load ticket data');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'debug': return 'text-blue-600 bg-blue-100';
      case 'info': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debug Tools</h1>
          <p className="text-gray-600">System monitoring and debugging utilities</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* System Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {severityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                <p className="text-sm text-gray-600">Showing {filteredLogs.length} logs</p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</span>
                          <span className="text-sm text-gray-500">User: {log.userId}</span>
                        </div>
                        
                        <p className="text-gray-900 mb-2">{log.message}</p>
                        
                        {log.details && (
                          <details className="text-sm text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredLogs.length === 0 && (
                  <div className="p-8 text-center">
                    <FiActivity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No logs found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Status Tab */}
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{service}</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status.status)}`}>
                    {status.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-gray-900">{status.responseTime}</span>
                  </div>
                  
                  {status.connections && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Connections</span>
                      <span className="text-sm font-medium text-gray-900">{status.connections}</span>
                    </div>
                  )}
                  
                  {status.quota && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quota Used</span>
                      <span className="text-sm font-medium text-gray-900">{status.quota}</span>
                    </div>
                  )}
                  
                  {status.failureRate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Failure Rate</span>
                      <span className="text-sm font-medium text-gray-900">{status.failureRate}</span>
                    </div>
                  )}
                  
                  {status.usage && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Usage</span>
                      <span className="text-sm font-medium text-gray-900">{status.usage}</span>
                    </div>
                  )}
                  
                  {status.requests && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Requests/min</span>
                      <span className="text-sm font-medium text-gray-900">{status.requests}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Simulation Tab */}
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulation Controls */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Controls</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={simulationForm.userId}
                    onChange={(e) => setSimulationForm({ ...simulationForm, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter user ID to simulate"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket ID
                  </label>
                  <input
                    type="text"
                    value={simulationForm.ticketId}
                    onChange={(e) => setSimulationForm({ ...simulationForm, ticketId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket ID to simulate"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={handleUserSimulation}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiUser className="w-4 h-4" />}
                    <span>Simulate User</span>
                  </button>
                  
                  <button
                    onClick={handleTicketSimulation}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiEye className="w-4 h-4" />}
                    <span>Simulate Ticket</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Results */}
            <div className="space-y-6">
              {/* User Simulation Results */}
              {userSimulation && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Simulation Results</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User ID</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Full Name</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Role</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-medium ${
                        userSimulation.isActivated ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {userSimulation.isActivated ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tickets</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.tickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payments</span>
                      <span className="text-sm font-medium text-gray-900">{userSimulation.payments}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket Simulation Results */}
              {ticketSimulation && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Simulation Results</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ticket ID</span>
                      <span className="text-sm font-medium text-gray-900">{ticketSimulation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User ID</span>
                      <span className="text-sm font-medium text-gray-900">{ticketSimulation.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-medium ${
                        ticketSimulation.status === 'resolved' ? 'text-green-600' :
                        ticketSimulation.status === 'in_progress' ? 'text-blue-600' :
                        ticketSimulation.status === 'open' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {ticketSimulation.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className={`text-sm font-medium ${
                        ticketSimulation.priority === 'urgent' ? 'text-red-600' :
                        ticketSimulation.priority === 'high' ? 'text-orange-600' :
                        ticketSimulation.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {ticketSimulation.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subject</span>
                      <span className="text-sm font-medium text-gray-900">{ticketSimulation.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Messages</span>
                      <span className="text-sm font-medium text-gray-900">{ticketSimulation.messages}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(performanceMetrics).map(([metric, value]) => (
              <div key={metric} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-3xl font-bold text-blue-600">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiShield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Firestore Rules</span>
                    </div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiLock className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Authentication</span>
                    </div>
                    <span className="text-sm text-green-600">Secure</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiWifi className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">SSL/TLS</span>
                    </div>
                    <span className="text-sm text-green-600">Enabled</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Security Events</h4>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">• Failed login attempt blocked</div>
                      <div className="text-xs text-gray-600">• Rate limit applied to API</div>
                      <div className="text-xs text-gray-600">• Suspicious activity detected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugTools;