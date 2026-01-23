# Requirements Document

## Introduction

The Receive Help eligibility system in the MLM application currently suffers from scattered logic across multiple files and components, leading to inconsistent behavior and silent blocks for eligible users. This feature will centralize all eligibility logic into a single, reliable source of truth that ensures consistent behavior across the entire application.

## Glossary

- **Eligibility_System**: The centralized system responsible for determining user eligibility for receiving help
- **User_Document**: The Firestore document containing all user data and status information
- **Silent_Block**: When a user who meets all eligibility criteria is prevented from receiving help without clear error messaging
- **Scattered_Logic**: Eligibility checks distributed across multiple files causing inconsistent behavior
- **Frontend_State**: Application state managed by React components (unreliable for eligibility)
- **Firestore_Data**: Authoritative user data stored in the database

## Requirements

### Requirement 1: Centralized Eligibility Logic

**User Story:** As a developer, I want a single source of truth for eligibility checks, so that all parts of the application use consistent logic.

#### Acceptance Criteria

1. THE Eligibility_System SHALL provide a single function `checkReceiveHelpEligibility(userDoc)` in `src/utils/eligibilityUtils.js`
2. WHEN any component needs to check eligibility, THE Eligibility_System SHALL be the only source used
3. THE Eligibility_System SHALL replace all scattered eligibility logic in existing files
4. WHEN eligibility logic needs updates, THE Eligibility_System SHALL require changes in only one location

### Requirement 2: Comprehensive Eligibility Criteria

**User Story:** As a system administrator, I want clear and complete eligibility criteria, so that users are consistently evaluated for help eligibility.

#### Acceptance Criteria

1. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.isActivated === true
2. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.isBlocked !== true
3. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.isOnHold !== true
4. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.isReceivingHeld !== true
5. WHEN kycDetails exists, THE Eligibility_System SHALL verify userDoc.kycDetails.paymentBlocked !== true
6. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.helpVisibility !== false
7. WHEN checking eligibility, THE Eligibility_System SHALL verify userDoc.levelStatus exists
8. WHEN all criteria are met, THE Eligibility_System SHALL return eligible status as true

### Requirement 3: Reliable Data Source

**User Story:** As a user, I want eligibility checks based on authoritative data, so that my eligibility status is accurate and consistent.

#### Acceptance Criteria

1. THE Eligibility_System SHALL use only Firestore User_Document data for eligibility checks
2. THE Eligibility_System SHALL NOT depend on Frontend_State for any eligibility decisions
3. WHEN Frontend_State conflicts with Firestore_Data, THE Eligibility_System SHALL use Firestore_Data
4. THE Eligibility_System SHALL fetch fresh user data when performing eligibility checks

### Requirement 4: Structured Response Format

**User Story:** As a developer, I want consistent response format from eligibility checks, so that I can handle results uniformly across the application.

#### Acceptance Criteria

1. THE Eligibility_System SHALL return responses in format `{eligible: boolean, reason: string}`
2. WHEN a user is eligible, THE Eligibility_System SHALL return `{eligible: true, reason: "User is eligible"}`
3. WHEN a user is not eligible, THE Eligibility_System SHALL return `{eligible: false, reason: "Specific blocking reason"}`
4. THE Eligibility_System SHALL provide specific reasons for each blocking condition

### Requirement 5: Legacy Code Replacement

**User Story:** As a developer, I want to remove scattered eligibility logic, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE Eligibility_System SHALL replace eligibility logic in ReceiveHelpRefactored.jsx
2. THE Eligibility_System SHALL replace eligibility logic in SendHelpRefactored.jsx
3. THE Eligibility_System SHALL replace eligibility logic in helpService.js
4. THE Eligibility_System SHALL replace eligibility logic in Cloud Functions assignment logic
5. WHEN legacy eligibility code is removed, THE Eligibility_System SHALL be the only eligibility source

### Requirement 6: Error Handling and Transparency

**User Story:** As a user, I want clear feedback when I'm not eligible for help, so that I understand why and can take corrective action.

#### Acceptance Criteria

1. WHEN a user is not eligible, THE Eligibility_System SHALL provide a specific reason string
2. THE Eligibility_System SHALL NOT cause Silent_Block conditions for eligible users
3. WHEN eligibility checks fail, THE Eligibility_System SHALL log detailed failure reasons
4. THE Eligibility_System SHALL handle missing or undefined fields gracefully

### Requirement 7: Development and Debugging Support

**User Story:** As a developer, I want detailed logging for eligibility failures, so that I can debug issues quickly and effectively.

#### Acceptance Criteria

1. WHEN eligibility checks fail, THE Eligibility_System SHALL log the exact blocking reason to console
2. WHEN eligibility checks pass, THE Eligibility_System SHALL log successful validation
3. THE Eligibility_System SHALL include user ID and timestamp in all log messages
4. THE Eligibility_System SHALL provide detailed field-by-field validation results in logs

### Requirement 8: Graceful Field Handling

**User Story:** As a system administrator, I want the system to handle missing user data fields appropriately, so that incomplete data doesn't cause unexpected blocks.

#### Acceptance Criteria

1. WHEN required fields are missing, THE Eligibility_System SHALL treat them as blocking conditions
2. WHEN optional fields are missing, THE Eligibility_System SHALL treat them as non-blocking
3. WHEN kycDetails is undefined, THE Eligibility_System SHALL skip paymentBlocked check
4. WHEN levelStatus is missing, THE Eligibility_System SHALL treat user as ineligible