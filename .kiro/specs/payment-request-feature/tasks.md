# Implementation Plan: Payment Request Feature

## Overview

This implementation plan converts the Payment Request feature design into discrete coding tasks that build incrementally. The approach integrates seamlessly with the existing MLM application architecture, leveraging React components, Firebase/Firestore backend, and the established help flow system.

## Tasks

- [ ] 1. Set up payment request data schema and service functions
  - Create payment request utility functions in helpService.js
  - Add cooldown checking and time formatting utilities
  - Implement requestPaymentFromSender function with proper error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 1.1 Write property test for payment request service functions
  - **Property 3: Document Consistency on Payment Request**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 1.2 Write property test for cooldown enforcement
  - **Property 4: Cooldown Enforcement**
  - **Validates: Requirements 2.3**

- [ ] 2. Create PaymentRequestButton component
  - [ ] 2.1 Implement PaymentRequestButton with cooldown timer display
    - Create reusable button component with disabled states
    - Add mm:ss countdown timer for active cooldowns
    - Implement loading states and error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.2 Write property test for button visibility logic
    - **Property 1: Button Visibility Based on Status**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 2.3 Write property test for cooldown UI state
    - **Property 2: Cooldown UI State Management**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 3. Create PaymentRequestNotification component
  - [ ] 3.1 Implement notification popup for senders
    - Create highlighted popup/card component
    - Add proper messaging and dismiss functionality
    - Implement smooth animations and transitions
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.2 Write unit test for notification text accuracy
    - **Property 6: Notification Text Accuracy**
    - **Validates: Requirements 3.2**

- [ ] 4. Integrate PaymentRequestButton into ReceiveHelp component
  - [x] 4.1 Add payment request functionality to ReceiveHelpRefactored
    - Import and integrate PaymentRequestButton component
    - Add cooldown state management and localStorage persistence
    - Implement handleRequestPayment function with proper error handling
    - Update help item rendering to include payment request button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [ ] 4.2 Write property test for ReceiveHelp integration
    - **Property 13: User Interaction Feedback**
    - **Validates: Requirements 7.4**

- [ ] 5. Checkpoint - Test payment request from receiver side
  - Ensure payment request button appears correctly on pending help items
  - Verify cooldown enforcement and timer display
  - Test error handling and user feedback
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integrate PaymentRequestNotification into SendHelp component
  - [ ] 6.1 Add real-time payment request notifications to SendHelpRefactored
    - Import and integrate PaymentRequestNotification component
    - Enhance help status listener to monitor paymentRequested field
    - Add notification state management and display logic
    - Implement notification dismissal and cleanup
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.2 Write property test for real-time synchronization
    - **Property 7: Real-time UI Synchronization**
    - **Validates: Requirements 3.3, 3.4, 8.1, 8.2**

- [ ] 7. Implement payment completion integration
  - [ ] 7.1 Update payment completion flow to reset paymentRequested
    - Modify existing payment done handlers to set paymentRequested to false
    - Update both SendHelp and ReceiveHelp components
    - Ensure notification cleanup on payment completion
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 7.2 Write property test for payment completion state reset
    - **Property 9: Payment Completion State Reset**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 8. Update Firestore security rules
  - [ ] 8.1 Enhance security rules for payment request fields
    - Add rules allowing receivers to update paymentRequested and lastPaymentRequestAt
    - Add rules allowing senders to reset paymentRequested to false
    - Ensure backward compatibility with existing MLM security
    - Test security rule enforcement
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 8.2 Write property test for security access control
    - **Property 11: Security Access Control**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 9. Add schema field initialization
  - [ ] 9.1 Implement field initialization for existing help documents
    - Add utility functions to initialize missing payment request fields
    - Update help document access patterns to handle missing fields
    - Implement default value logic (paymentRequested: false, lastPaymentRequestAt: null)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 9.2 Write property test for schema field consistency
    - **Property 8: Schema Field Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 10. Checkpoint - Test complete payment request workflow
  - Test end-to-end payment request flow from receiver to sender
  - Verify real-time notifications and UI updates
  - Test payment completion and state reset
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add error handling and offline resilience
  - [ ] 11.1 Implement comprehensive error handling
    - Add network failure handling with retry logic
    - Implement graceful degradation for offline scenarios
    - Add user-friendly error messages and recovery options
    - Test error scenarios and recovery patterns
    - _Requirements: 8.4_

  - [ ] 11.2 Write property test for offline resilience
    - **Property 14: Offline Resilience**
    - **Validates: Requirements 8.4**

- [ ] 12. UI consistency and styling
  - [ ] 12.1 Ensure UI consistency with existing components
    - Apply consistent styling to match existing Send Help and Receive Help components
    - Implement responsive design for mobile and desktop
    - Add proper accessibility attributes and keyboard navigation
    - _Requirements: 7.1_

  - [ ] 12.2 Write property test for UI consistency
    - **Property 12: UI Consistency Preservation**
    - **Validates: Requirements 7.1**

- [ ] 13. Integration testing and validation
  - [ ] 13.1 Write integration tests for complete payment request workflow
    - Test multi-user scenarios with sender and receiver
    - Verify real-time synchronization across user sessions
    - Test cooldown enforcement across browser sessions
    - **Property 10: Status Transition Integrity**
    - **Validates: Requirements 5.4**

  - [ ] 13.2 Write property test for notification triggering
    - **Property 5: Notification Triggering**
    - **Validates: Requirements 2.4, 3.1**

- [ ] 14. Final checkpoint - Complete system validation
  - Run all tests and ensure 100% pass rate
  - Verify no breaking changes to existing MLM functionality
  - Test performance and real-time listener efficiency
  - Validate security rules and access controls
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation with full testing coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and integration points
- The implementation maintains full backward compatibility with existing MLM logic