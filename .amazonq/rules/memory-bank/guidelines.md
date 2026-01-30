# Development Guidelines

## Code Quality Standards

### File Organization
- **Component Structure**: React components organized by feature domain (admin/, agent/, auth/, chat/, dashboard/, etc.)
- **Service Layer Separation**: Business logic isolated in dedicated service files (services/, functions/)
- **Configuration Management**: Centralized config files for Firebase, constants, and status definitions
- **Utility Functions**: Pure helper functions separated into utils/ directory

### Naming Conventions
- **Components**: PascalCase for React components (UserTransactionSafetyHub, DashboardHome)
- **Files**: Match component names exactly (UserTransactionSafetyHub.jsx)
- **Functions**: camelCase for functions (handleUserIdSubmit, fetchDashboardData)
- **Constants**: UPPER_SNAKE_CASE for constants (HELP_STATUSES, LEVEL_RECEIVE_LIMITS)
- **Collections**: camelCase for Firestore collections (sendHelp, receiveHelp, supportTickets)

### Code Formatting
- **Indentation**: 2 spaces (consistent across JavaScript and JSX)
- **Line Length**: No strict limit but prefer readability over long lines
- **Semicolons**: Used consistently in JavaScript files
- **Quotes**: Single quotes for strings in JavaScript, double quotes in JSX attributes
- **Template Literals**: Used for string interpolation and multi-line strings

### Documentation Standards
- **Inline Comments**: Used sparingly, primarily for complex logic explanation
- **Function Documentation**: JSDoc-style comments for service functions and utilities
- **Console Logging**: Structured logging with context (e.g., `[startHelpAssignment] entry`)
- **Error Messages**: User-friendly messages with technical details in console

## Semantic Patterns

### React Component Patterns

#### Functional Components with Hooks
```javascript
const ComponentName = () => {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (/* JSX */);
};
```
**Frequency**: Used in 100% of React components

#### State Management Pattern
```javascript
// Multiple related state variables
const [activeTab, setActiveTab] = useState('dashboard');
const [loading, setLoading] = useState(false);
const [showModal, setShowModal] = useState(false);

// Complex state objects
const [dashboardStats, setDashboardStats] = useState({
  activeUsers: 0,
  pendingHelps: 0,
  failedPayments: 0,
  successRate: 0
});
```
**Frequency**: Used in 95% of components with state

#### Mobile-Responsive Conditional Rendering
```javascript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// Usage in JSX
<div className={isMobile ? 'text-sm p-2' : 'text-base p-4'}>
```
**Frequency**: Used in 80% of UI components

### Firebase Integration Patterns

#### Firestore Transaction Pattern
```javascript
await db.runTransaction(async (tx) => {
  const docRef = db.collection('collection').doc(docId);
  const docSnap = await tx.get(docRef);
  
  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'Document not found');
  }
  
  const data = docSnap.data();
  // Validation logic
  
  tx.update(docRef, {
    field: newValue,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```
**Frequency**: Used in 90% of Cloud Functions with data mutations

#### Real-time Listener Pattern
```javascript
const unsubscribe = onSnapshot(query, 
  (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  },
  (error) => {
    console.error('Error:', error);
    handleError(error);
  }
);

// Cleanup
return () => unsubscribe();
```
**Frequency**: Used in 100% of real-time data subscriptions

#### Idempotency Pattern
```javascript
const idempotencyRef = db.collection('helpIdempotency').doc(`${uid}_${key}`);
const idemSnap = await tx.get(idempotencyRef);

if (idemSnap.exists) {
  return { alreadyExists: true, helpId: idemSnap.data().helpId };
}

// Proceed with operation
tx.set(idempotencyRef, {
  uid,
  key,
  helpId,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```
**Frequency**: Used in 100% of critical mutation operations

### Error Handling Patterns

#### Try-Catch with User Feedback
```javascript
try {
  setLoading(true);
  await performOperation();
  toast.success('Operation completed successfully');
} catch (error) {
  console.error('Error:', error);
  toast.error('Failed to complete operation');
} finally {
  setLoading(false);
}
```
**Frequency**: Used in 95% of async operations

#### Cloud Function Error Handling
```javascript
const assertAuth = (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
};

const assertAdmin = (request) => {
  assertAuth(request);
  if (request.auth.token?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }
};
```
**Frequency**: Used in 100% of callable Cloud Functions

#### Safe Error Propagation
```javascript
const safeThrowInternal = (err, meta) => {
  console.error('[function] firestore.error', {
    meta: meta || null,
    message: err?.message,
    code: err?.code
  });
  throw new HttpsError('failed-precondition', err?.message || 'Operation failed', {
    ...(meta || {}),
    originalMessage: err?.message || String(err)
  });
};
```
**Frequency**: Used in 80% of complex Cloud Functions

### UI/UX Patterns

#### Framer Motion Animations
```javascript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```
**Frequency**: Used in 70% of interactive UI components

#### Tailwind CSS Utility Classes
```javascript
<div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-200">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Title</h2>
  <p className="text-sm text-gray-600">Description</p>
</div>
```
**Frequency**: Used in 100% of styled components

#### Conditional Class Names
```javascript
<button
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    isActive 
      ? 'bg-blue-600 text-white' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  }`}
>
```
**Frequency**: Used in 90% of interactive elements

### Data Validation Patterns

#### Input Validation
```javascript
if (!inputValue || typeof inputValue !== 'string' || inputValue.trim().length === 0) {
  throw new HttpsError('invalid-argument', 'Field required');
}

const normalized = inputValue.trim().toUpperCase();
if (normalized.length < 6) {
  throw new HttpsError('invalid-argument', 'Invalid format');
}
```
**Frequency**: Used in 100% of user input processing

#### Type Normalization
```javascript
const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return !!value;
};

const normalizeNumber = (value, defaultVal = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(value)) return Number(value);
  return defaultVal;
};
```
**Frequency**: Used in 60% of data processing functions

### Service Layer Patterns

#### Singleton Service Pattern
```javascript
class ServiceName {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }
  
  methodName() {
    // Implementation
  }
}

const serviceName = new ServiceName();
export default serviceName;
```
**Frequency**: Used in 100% of service classes

#### Subscription Management
```javascript
subscribeToData(callback, filters = {}) {
  const listenerId = this.generateListenerId('collection', filters);
  
  const unsubscribe = onSnapshot(query, callback, errorHandler);
  
  this.listeners.set(listenerId, unsubscribe);
  this.subscriptions.set(listenerId, { type, filters, callback });
  
  return listenerId;
}

unsubscribe(listenerId) {
  const unsubscribe = this.listeners.get(listenerId);
  if (unsubscribe) {
    unsubscribe();
    this.listeners.delete(listenerId);
    this.subscriptions.delete(listenerId);
  }
}
```
**Frequency**: Used in 100% of real-time service implementations

### Routing Patterns

#### Protected Route Wrapper
```javascript
{
  path: '/dashboard',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <DashboardHome /> },
    { path: 'send-help', element: <SendHelp /> }
  ]
}
```
**Frequency**: Used in 100% of authenticated routes

#### Role-Based Route Protection
```javascript
{
  path: '/admin',
  element: (
    <AdminProtectedRoute>
      <AdminLayout />
    </AdminProtectedRoute>
  ),
  children: [/* admin routes */]
}
```
**Frequency**: Used in 100% of role-restricted routes

## Best Practices

### Security
- Always validate user authentication before operations
- Use Firestore security rules as first line of defense
- Implement role-based access control with custom claims
- Never expose sensitive data in client-side code
- Sanitize all user inputs before processing

### Performance
- Use React.lazy for code splitting on routes
- Implement pagination for large data sets (limit queries)
- Debounce search inputs and real-time updates
- Clean up listeners and subscriptions on unmount
- Use Firestore indexes for complex queries

### Maintainability
- Keep components focused on single responsibility
- Extract reusable logic into custom hooks
- Use constants for magic numbers and strings
- Maintain consistent error handling patterns
- Document complex business logic

### Testing Considerations
- Validate critical paths with integration tests
- Test error scenarios and edge cases
- Verify authentication and authorization flows
- Test real-time listener cleanup
- Validate data transformation logic

## Common Idioms

### Firestore Timestamp Handling
```javascript
createdAt: admin.firestore.FieldValue.serverTimestamp()
updatedAt: admin.firestore.FieldValue.serverTimestamp()
```

### Conditional Rendering
```javascript
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}
```

### Array Filtering and Mapping
```javascript
const filtered = items
  .filter(item => item.status === 'active')
  .map(item => ({ id: item.id, ...item.data() }))
  .sort((a, b) => b.createdAt - a.createdAt);
```

### Async/Await with Promise.all
```javascript
const [userData, helpData, epinData] = await Promise.all([
  getUserData(uid),
  getHelpData(uid),
  getEpinData(uid)
]);
```

### Object Destructuring with Defaults
```javascript
const { 
  status = 'pending', 
  priority = 'medium',
  assignedTo = null 
} = data || {};
```
