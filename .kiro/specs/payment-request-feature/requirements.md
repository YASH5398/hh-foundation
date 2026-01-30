# Requirements Document

## Introduction

The Payment Request feature enables receivers in the MLM application to proactively request payment completion from senders when help transactions are pending. This feature adds a communication mechanism between receivers and senders to expedite payment processing while maintaining the existing MLM business logic and user flows.

## Glossary

- **Payment_Request_System**: The system component that manages payment request functionality
- **Receiver**: A user who is expecting to receive help/payment from another user
- **Sender**: A user who is supposed to send help/payment to another user
- **Help_Document**: Firestore document containing sendHelp and receiveHelp transaction data
- **Cooldown_Period**: The 2-hour restriction period between payment requests
- **MLM_Application**: The existing multi-level marketing application with Send Help and Receive Help sections

## Requirements

### Requirement 1: Payment Request Button Visibility

**User Story:** As a receiver, I want to see a "Request Payment" button on pending help items, so that I can proactively request payment completion from senders.

#### Acceptance Criteria

1. WHEN a receiver views the Receive Help section, THE Payment_Request_System SHALL display a "Request Payment" button on each pending help item
2. WHEN a help item is not in pending status, THE Payment_Request_System SHALL hide the "Request Payment" button
3. WHEN the cooldown period is active, THE Payment_Request_System SHALL display the button in disabled state
4. WHERE the cooldown period is active, THE Payment_Request_System SHALL show remaining time in mm:ss format

### Requirement 2: Payment Request Processing

**User Story:** As a receiver, I want to request payment from senders with appropriate rate limiting, so that I can expedite payment processing without spamming requests.

#### Acceptance Criteria

1. WHEN a receiver clicks "Request Payment", THE Payment_Request_System SHALL update the lastPaymentRequestAt timestamp in both sendHelp and receiveHelp documents
2. WHEN a receiver clicks "Request Payment", THE Payment_Request_System SHALL set paymentRequested to true in the help documents
3. IF a payment request was made within the last 2 hours, THEN THE Payment_Request_System SHALL block the action and display "You can request payment once every 2 hours."
4. WHEN a payment request is successfully processed, THE Payment_Request_System SHALL trigger a notification to the sender

### Requirement 3: Sender Notification System

**User Story:** As a sender, I want to be notified when receivers request payment, so that I can complete pending payments promptly.

#### Acceptance Criteria

1. WHEN a payment request is successfully created, THE Payment_Request_System SHALL trigger a popup alert for the sender in the Send Help section
2. WHEN displaying the notification popup, THE Payment_Request_System SHALL show the text "Receiver has requested you to complete the payment."
3. WHEN paymentRequested equals true, THE Payment_Request_System SHALL display a highlighted popup card on top of the Send Help section
4. WHEN the sender views the Send Help section, THE Payment_Request_System SHALL show real-time updates for payment request status

### Requirement 4: Document Schema Management

**User Story:** As a system administrator, I want proper document fields for payment requests, so that the system can track and manage payment request states correctly.

#### Acceptance Criteria

1. WHEN a help document is created or updated, THE Payment_Request_System SHALL ensure paymentRequested boolean field exists
2. WHEN a help document is created or updated, THE Payment_Request_System SHALL ensure lastPaymentRequestAt timestamp field exists
3. WHEN help documents are queried, THE Payment_Request_System SHALL provide access to both paymentRequested and lastPaymentRequestAt fields
4. WHEN document fields are missing, THE Payment_Request_System SHALL initialize them with appropriate default values

### Requirement 5: Payment Completion Integration

**User Story:** As a sender, I want the payment request state to be automatically cleared when I complete payment, so that the system maintains accurate transaction status.

#### Acceptance Criteria

1. WHEN a sender clicks "Payment Done", THE Payment_Request_System SHALL automatically set paymentRequested to false
2. WHEN paymentRequested is set to false, THE Payment_Request_System SHALL remove any active payment request notifications
3. WHEN payment completion is processed, THE Payment_Request_System SHALL maintain all existing MLM business logic and flows
4. WHEN payment is marked as done, THE Payment_Request_System SHALL update the help document status appropriately

### Requirement 6: Security and Access Control

**User Story:** As a system administrator, I want proper security controls for payment requests, so that only authorized users can modify payment request fields.

#### Acceptance Criteria

1. WHEN a receiver attempts to update payment request fields, THE Payment_Request_System SHALL allow updates only to paymentRequested and lastPaymentRequestAt on their own help documents
2. WHEN unauthorized access is attempted, THE Payment_Request_System SHALL deny the request and maintain data integrity
3. WHEN Firestore security rules are evaluated, THE Payment_Request_System SHALL enforce receiver-only access to payment request fields
4. WHEN security rules are applied, THE Payment_Request_System SHALL maintain compatibility with existing MLM security requirements

### Requirement 7: User Interface Integration

**User Story:** As a user, I want the payment request feature to integrate seamlessly with existing UI, so that the application maintains consistent user experience.

#### Acceptance Criteria

1. WHEN payment request components are rendered, THE Payment_Request_System SHALL maintain existing Send Help and Receive Help component styling
2. WHEN payment request features are active, THE Payment_Request_System SHALL not break existing MLM logic or user flows
3. WHEN UI components are updated, THE Payment_Request_System SHALL apply changes cleanly and minimally to existing codebase
4. WHEN users interact with payment request features, THE Payment_Request_System SHALL provide appropriate visual feedback and state management

### Requirement 8: Real-time Data Synchronization

**User Story:** As a user, I want real-time updates for payment request status, so that I can see current payment request states without manual refresh.

#### Acceptance Criteria

1. WHEN payment request status changes, THE Payment_Request_System SHALL update the UI in real-time using Firebase listeners
2. WHEN multiple users are involved in a help transaction, THE Payment_Request_System SHALL synchronize payment request status across all relevant user interfaces
3. WHEN real-time listeners are established, THE Payment_Request_System SHALL maintain efficient data subscription patterns
4. WHEN network connectivity issues occur, THE Payment_Request_System SHALL handle offline scenarios gracefully and sync when connection is restored