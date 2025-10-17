# Firestore Security Rules Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the updated Firestore security rules for the MLM Helping Plan project. The new rules implement comprehensive role-based access control for all collections.

## Pre-Deployment Checklist

### 1. Backup Current Rules
Before deploying, backup your current rules:
```bash
# Using Firebase CLI
firebase firestore:rules:get > firestore-rules-backup.txt
```

### 2. Verify Firebase CLI Setup
Ensure Firebase CLI is installed and authenticated:
```bash
# Check if Firebase CLI is installed
firebase --version

# Login to Firebase (if not already logged in)
firebase login

# Verify project connection
firebase projects:list
firebase use your-project-id
```

### 3. Test Rules Locally (Recommended)
Use Firebase Emulator to test rules before deployment:
```bash
# Install Firebase emulator
npm install -g firebase-tools

# Initialize emulator (if not already done)
firebase init emulators

# Start Firestore emulator
firebase emulators:start --only firestore
```

## Deployment Steps

### Step 1: Deploy Rules
```bash
# Deploy the new rules
firebase deploy --only firestore:rules

# Or if you want to deploy specific rules file
firebase deploy --only firestore:rules --project your-project-id
```

### Step 2: Verify Deployment
After deployment, verify the rules are active:
```bash
# Check current rules
firebase firestore:rules:get
```

### Step 3: Monitor for Errors
Monitor Firebase Console for any permission errors:
1. Go to Firebase Console → Firestore Database
2. Check the "Usage" tab for permission denied errors
3. Monitor application logs for authentication issues

## Key Changes in New Rules

### 1. Role-Based Access Control
- **Users**: Can access their own data, read public leaderboard data
- **Agents**: Can access assigned chats, support tickets, and user data for assistance
- **Admins**: Full access to all collections and administrative functions

### 2. New Collections Added
- `agentChats` - Agent support chat system
- `helpHistory` - Transaction history tracking
- `testimonials` - User testimonials management
- `socialTasks` - Social media task tracking
- `agentDashboard` - Agent performance metrics
- `tickets` - Support ticket system
- `helpChats` - Help transaction chat system

### 3. Enhanced Security Features
- Proper participant validation for chat systems
- Owner-based access for private data
- Public read access for leaderboard and announcements
- Secure agent assignment for support tickets

## Validation Tests

### Test 1: User Access
```javascript
// Test user can read their own data
const userDoc = await db.collection('users').doc(currentUserId).get();

// Test user can read leaderboard
const leaderboard = await db.collection('leaderboard').get();

// Test user cannot read other users' private data
const otherUserDoc = await db.collection('users').doc(otherUserId).get(); // Should fail
```

### Test 2: Agent Access
```javascript
// Test agent can read assigned chats
const agentChats = await db.collection('agentChats')
  .where('agentId', '==', currentAgentId).get();

// Test agent can access support tickets
const tickets = await db.collection('supportTickets')
  .where('agentId', '==', currentAgentId).get();
```

### Test 3: Admin Access
```javascript
// Test admin can access all collections
const allUsers = await db.collection('users').get();
const allTickets = await db.collection('supportTickets').get();
```

## Common Issues and Solutions

### Issue 1: Permission Denied Errors
**Symptoms**: Users getting "Missing or insufficient permissions" errors
**Solutions**:
1. Verify user authentication status
2. Check if user role is properly set in `/users/{userId}` document
3. Ensure admin/agent documents exist in respective collections

### Issue 2: Chat Access Issues
**Symptoms**: Users cannot access chat messages
**Solutions**:
1. Verify `participants` array includes user ID
2. Check chat document structure matches rule expectations
3. Ensure proper subcollection path structure

### Issue 3: Leaderboard Access
**Symptoms**: Leaderboard not loading for users
**Solutions**:
1. Verify user is authenticated
2. Check if leaderboard collection has proper read permissions
3. Ensure frontend uses proper query structure

## Security Best Practices Implemented

### 1. Authentication Required
- All operations require user authentication
- No anonymous access to sensitive data

### 2. Owner-Based Access
- Users can only modify their own data
- Private information restricted to owner and admins

### 3. Role-Based Permissions
- Agents have limited access to user data for support
- Admins have full administrative access
- Regular users have restricted access

### 4. Secure Chat Systems
- Participants-only access to chat messages
- Agent oversight for support chats
- Proper validation of chat membership

### 5. Audit Trail
- Transaction logs accessible to involved parties
- Admin access for compliance and monitoring

## Rollback Procedure

If issues occur after deployment:

### Quick Rollback
```bash
# Restore from backup
firebase firestore:rules:set firestore-rules-backup.txt
firebase deploy --only firestore:rules
```

### Gradual Rollback
1. Identify specific problematic rules
2. Modify only affected collections
3. Test changes in emulator first
4. Deploy incremental fixes

## Monitoring and Maintenance

### 1. Regular Monitoring
- Check Firebase Console daily for permission errors
- Monitor application error logs
- Review user feedback for access issues

### 2. Performance Monitoring
- Monitor rule evaluation performance
- Check for complex rule chains that might slow queries
- Optimize rules based on usage patterns

### 3. Security Audits
- Regularly review access patterns
- Audit admin and agent permissions
- Update rules as application evolves

## Support and Troubleshooting

### Firebase Console Locations
- **Rules Editor**: Firestore Database → Rules
- **Usage Monitoring**: Firestore Database → Usage
- **Error Logs**: Functions → Logs (for server-side errors)

### Testing Commands
```bash
# Test specific rule
firebase firestore:rules:test --test-suite=path/to/test.js

# Validate rules syntax
firebase firestore:rules:validate

# Get current rules
firebase firestore:rules:get
```

### Emergency Contacts
- Firebase Support: [Firebase Console Support](https://console.firebase.google.com/support)
- Documentation: [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Conclusion

The new Firestore security rules provide comprehensive protection while enabling proper functionality for all user roles. Follow this guide carefully and monitor the system closely after deployment to ensure smooth operation.

Remember to:
1. Always backup before deployment
2. Test in emulator when possible
3. Monitor for errors after deployment
4. Have a rollback plan ready
5. Document any custom modifications

For additional support or questions, refer to the Firebase documentation or contact the development team.