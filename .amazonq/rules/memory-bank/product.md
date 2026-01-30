# Product Overview

## Project Purpose
HH Foundation MLM is a multi-level marketing (MLM) platform that facilitates peer-to-peer financial help transactions between members. The system manages user registrations, E-PIN purchases, help requests/assignments, payment tracking, and team hierarchies with multiple income levels.

## Key Features

### Core MLM Functionality
- **Multi-Level Income System**: 8-level deep commission structure with configurable percentages per level
- **E-PIN Management**: Digital PIN purchase, approval workflow, and QR code generation for activation
- **Help Request/Assignment**: Automated matching system that pairs help senders with eligible receivers
- **Payment Tracking**: Complete payment journey from request to verification with proof uploads
- **Team Hierarchy**: Downline tracking, sponsor relationships, and genealogy visualization

### User Management
- **Role-Based Access**: Separate interfaces for regular users, agents, and administrators
- **Profile Management**: KYC details, payment methods (UPI, PhonePe, Google Pay), and avatar uploads
- **Authentication**: Firebase Authentication with custom claims for role management
- **Eligibility Tracking**: Automated calculation of send/receive help eligibility based on activity

### Communication & Support
- **In-App Chat**: Real-time messaging between help senders and receivers
- **AI Chatbot**: Automated support using intent detection and contextual responses
- **Agent Support System**: Live chat escalation to human agents with queue management
- **Push Notifications**: FCM-based notifications for transactions, assignments, and system events

### Administrative Tools
- **User Transaction Safety Hub**: Monitor and manage all payment requests, approvals, and disputes
- **Level Manager**: Configure income percentages and MLM structure settings
- **User Manager**: View user details, manage accounts, and handle administrative actions
- **Analytics Dashboard**: Track system metrics, user activity, and financial flows

### Technical Capabilities
- **Real-time Updates**: Firestore listeners for live data synchronization
- **Cloud Functions**: Backend automation for notifications, eligibility checks, and assignments
- **File Storage**: Cloudinary integration for payment proofs and profile images
- **Responsive Design**: Mobile-first UI built with React and Tailwind CSS

## Target Users

### Primary Users (Members)
- Individuals seeking to participate in the MLM network
- Users who purchase E-PINs to activate accounts
- Members sending and receiving financial help
- Team builders growing their downline networks

### Secondary Users (Agents)
- Customer support representatives handling live chat
- Agents managing escalated support tickets
- Staff monitoring chat queues and response times

### Administrative Users
- System administrators managing platform configuration
- Financial controllers approving E-PIN requests
- Compliance officers monitoring transactions
- Technical staff maintaining system health

## Use Cases

### Member Journey
1. Register with sponsor referral code
2. Purchase E-PIN and await approval
3. Activate account using QR code
4. Send help to assigned receivers
5. Receive help from matched senders
6. Earn commissions from downline activity
7. Track team growth and income levels

### Payment Flow
1. User initiates send help request
2. System assigns eligible receiver
3. Sender uploads payment proof
4. Receiver verifies payment
5. System updates balances and eligibility
6. Commissions distributed to upline

### Support Workflow
1. User initiates chat or chatbot interaction
2. AI chatbot handles common queries
3. Complex issues escalated to agents
4. Agents provide personalized support
5. Tickets tracked and resolved
6. Satisfaction metrics collected
