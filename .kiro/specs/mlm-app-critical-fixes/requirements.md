# Requirements Document

## Introduction

This document outlines the requirements for fixing critical issues in the React + Firebase MLM web application. The system currently suffers from several critical problems affecting E-PIN QR image display, Firebase Storage implementation, Firestore query errors, chatbot functionality, and navigation issues. These fixes are essential for maintaining user experience and system reliability while preserving the existing MLM business logic and UI design.

## Glossary

- **E-PIN_System**: The electronic PIN management system for user activation and transactions
- **QR_Image_Display**: The component responsible for showing QR code images in E-PIN requests
- **Firebase_Storage**: Google Firebase cloud storage service for file uploads and retrieval
- **Firestore_Database**: Google Firestore NoSQL database service
- **Chatbot_Service**: AI-powered customer support chat functionality
- **Sidebar_Navigation**: The main navigation component for the dashboard
- **MLM_Business_Logic**: Multi-level marketing system rules and workflows
- **CORS_Headers**: Cross-Origin Resource Sharing HTTP headers for API access
- **UTR**: Unique Transaction Reference number for payment tracking
- **Cloud_Function**: Firebase serverless backend functions

## Requirements

### Requirement 1: E-PIN QR Image Display System

**User Story:** As a user requesting E-PINs, I want to see QR code images properly displayed in the E-PIN components, so that I can complete payment transactions successfully.

#### Acceptance Criteria

1. WHEN a user uploads a QR screenshot for E-PIN request, THE E-PIN_System SHALL store the image using Firebase Storage with path format `epin-screenshots/{userId}/{fileName}`
2. WHEN storing QR images, THE Firebase_Storage SHALL use proper uploadBytes + getDownloadURL flow for secure URL generation
3. WHEN displaying E-PIN requests, THE QR_Image_Display SHALL show actual Firebase Storage URLs instead of dummy placeholder URLs
4. WHEN QR images fail to load, THE QR_Image_Display SHALL show appropriate fallback loader and error images
5. WHEN QR images are stored in Firestore, THE E-PIN_System SHALL ensure proper rendering in all E-PIN components

### Requirement 2: Firebase Storage Implementation

**User Story:** As a system administrator, I want Firebase Storage operations to work reliably, so that user uploads and file access function correctly.

#### Acceptance Criteria

1. WHEN users upload files, THE Firebase_Storage SHALL verify user authentication before allowing upload operations
2. WHEN uploadBytes operation completes, THE Firebase_Storage SHALL successfully generate download URLs using getDownloadURL
3. WHEN images exist in storage but won't load, THE Firebase_Storage SHALL handle CORS and Storage rules configuration properly
4. WHEN storage operations fail, THE Firebase_Storage SHALL provide proper error handling with descriptive messages
5. WHEN storage operations encounter errors, THE Firebase_Storage SHALL log detailed error information for debugging

### Requirement 3: Firestore Query Error Resolution

**User Story:** As a user of the application, I want database operations to work without errors, so that I can use all features reliably.

#### Acceptance Criteria

1. WHEN executing Firestore queries, THE Firestore_Database SHALL validate all query parameters to prevent undefined values in where() clauses
2. WHEN using array operations, THE Firestore_Database SHALL ensure arrays are not empty before executing in/array-contains-any operations
3. WHEN users are not authenticated, THE Firestore_Database SHALL prevent getDocs/onSnapshot calls and show appropriate UI messages
4. WHEN multi-field queries are executed, THE Firestore_Database SHALL ensure proper composite indexes exist
5. WHEN components unmount, THE Firestore_Database SHALL properly cleanup snapshot listeners to prevent memory leaks
6. WHEN query errors occur, THE Firestore_Database SHALL implement proper try/catch blocks with parameter logging

### Requirement 4: Chatbot CORS and Functionality

**User Story:** As a user seeking support, I want the chatbot to respond to my messages, so that I can get help with my questions.

#### Acceptance Criteria

1. WHEN the chatbot Cloud Function receives requests, THE Cloud_Function SHALL include proper CORS headers including Access-Control-Allow-Origin and Access-Control-Allow-Headers
2. WHEN browsers send preflight requests, THE Cloud_Function SHALL handle OPTIONS requests properly
3. WHEN validating chatbot requests, THE Cloud_Function SHALL ensure message field exists in request body
4. WHEN chatbot errors occur, THE Cloud_Function SHALL return proper JSON error responses instead of crashes
5. WHEN chatbot is unavailable, THE Frontend SHALL show specific error messages instead of generic "Support unavailable" text

### Requirement 5: Sidebar Navigation Back Icon

**User Story:** As a user in the chatbot interface, I want the back icon to open the sidebar, so that I can navigate to other sections easily.

#### Acceptance Criteria

1. WHEN the back icon in chatbot header is clicked, THE Sidebar_Navigation SHALL open instead of navigating back
2. WHEN connecting the back icon to sidebar, THE Chatbot_Service SHALL use proper sidebar state management
3. WHEN implementing sidebar toggle, THE Navigation_System SHALL remove incorrect navigation logic from back icon
4. WHEN sidebar opens from chatbot, THE Sidebar_Navigation SHALL maintain existing functionality and design
5. WHEN sidebar state changes, THE Navigation_System SHALL properly reflect the open/closed state

### Requirement 6: Authentication Safety Guards

**User Story:** As a system administrator, I want to prevent Firebase calls when users are not logged in, so that the application handles authentication states gracefully.

#### Acceptance Criteria

1. WHEN users are not authenticated, THE Firebase_Service SHALL block all Firebase database and storage calls
2. WHEN authentication is missing, THE User_Interface SHALL show clear messages about missing auth/session
3. WHEN implementing auth guards, THE System SHALL maintain existing UI design and visual consistency
4. WHEN auth state changes, THE Application SHALL handle transitions smoothly without breaking user experience
5. WHEN auth guards are active, THE MLM_Business_Logic SHALL remain unchanged and functional

### Requirement 7: Error Handling and Logging

**User Story:** As a developer maintaining the system, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN Firebase operations fail, THE System SHALL log detailed error information including operation type and parameters
2. WHEN Firestore queries encounter errors, THE System SHALL log query parameters and error details for debugging
3. WHEN storage operations fail, THE System SHALL provide user-friendly error messages while logging technical details
4. WHEN chatbot requests fail, THE System SHALL log request/response details for troubleshooting
5. WHEN authentication errors occur, THE System SHALL log auth state and attempted operations

### Requirement 8: System Reliability and Performance

**User Story:** As a user of the MLM application, I want the system to be reliable and performant, so that I can complete my tasks efficiently.

#### Acceptance Criteria

1. WHEN implementing fixes, THE System SHALL maintain existing performance characteristics
2. WHEN handling errors, THE System SHALL ensure graceful degradation without system crashes
3. WHEN users interact with fixed components, THE System SHALL provide responsive feedback
4. WHEN multiple users access the system, THE System SHALL handle concurrent operations safely
5. WHEN system load increases, THE Fixed_Components SHALL maintain stability and performance