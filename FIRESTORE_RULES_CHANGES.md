# Firestore Security Rules - Chat Permission Fixes

## Summary of Changes

Fixed permission-denied errors in chat and send-help related features by adding explicit rules for subcollections and fixing document creation logic.

## Issues Fixed

### 1. Transaction Chat Messages (sendHelp/receiveHelp)
**Problem**: No explicit rules for the `chat` subcollection under `sendHelp/{id}/chat` and `receiveHelp/{id}/chat`

**Solution**: Added comprehensive rules for both collections:
- **Read/List**: Users can read messages if they are the sender or receiver of the parent transaction
- **Create**: Users can create messages if they are participants AND the senderId matches their auth uid
- **Update**: Users can update messages (mark as read) if they are participants
- Admins and agents have full access

**Lines Modified**: 168-188 (sendHelp), 199-219 (receiveHelp)

### 2. Direct Chat Document Creation (chats)
**Problem**: Rules checked `resource.data.participants` during creation, but `resource.data` doesn't exist for new documents

**Solution**: 
- Split creation and read/update rules
- Use `request.resource.data.participants` for creation checks
- Use `resource.data.participants` for existing document checks
- Added validation that message creators must be in the chat participants

**Lines Modified**: 230-257

### 3. Help Chat Messages (helpChats)
**Problem**: Generic read/write rules didn't properly validate message creation

**Solution**:
- Split create/read/update operations
- Added explicit validation that message senderUid must match auth uid
- Ensured users can only create chats where they are sender or receiver

**Lines Modified**: 259-294

## Security Guarantees Maintained

✅ Users can ONLY access chats where they are participants (sender/receiver)
✅ Users can ONLY send messages with their own uid as senderId
✅ Users can ONLY mark messages as read in chats they participate in
✅ Admins and agents retain full access for support purposes
✅ No allow-all rules introduced
✅ All existing working rules remain unchanged

## Collections Affected

1. `sendHelp/{id}/chat/{messageId}` - Transaction chat messages
2. `receiveHelp/{id}/chat/{messageId}` - Transaction chat messages
3. `chats/{chatId}` - Direct chat documents
4. `chats/{chatId}/messages/{messageId}` - Direct chat messages
5. `helpChats/{chatId}` - Help chat documents
6. `helpChats/{chatId}/messages/{messageId}` - Help chat messages

## Testing Recommendations

1. **Send Help Flow**:
   - Send a message in a sendHelp transaction
   - Mark messages as read
   - Verify other users cannot access the chat

2. **Receive Help Flow**:
   - Send a message in a receiveHelp transaction
   - Mark messages as read
   - Verify other users cannot access the chat

3. **Direct Chat**:
   - Initialize a new chat between two users
   - Send messages
   - Mark messages as read
   - Verify third parties cannot access

4. **Agent/Admin Access**:
   - Verify agents can access all chats for support
   - Verify admins have full access

## No Breaking Changes

All existing functionality remains intact:
- User management rules unchanged
- Notification rules unchanged
- Agent-specific rules unchanged
- Support ticket rules unchanged
- E-PIN rules unchanged
- All other collections unchanged
